// context/UploadContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { enqueueIngest, uploadFileMultipart, getUploadStatus, type UploadStatus } from "@/lib/uploads";

type Phase = "uploading" | "queued" | "processing" | "done" | "error";

export type UploadItem = {
  id: string;
  sourceId: string;
  filename: string;
  // UPLOADING: bytes; PROCESSING: pagini
  total: number;
  sent: number;
  phase: Phase;
  error?: string;
  key?: string;
  pageCount?: number | null;
};

export type ErrorItem = {
  id: string;
  filename: string;
  message: string;
  whenISO: string;
};

export type Summary = {
  total: number;
  uploading: number;
  queued: number;
  processing: number;
  done: number;
  error: number;
  left: number;
};

type Ctx = {
  items: UploadItem[];
  visible: boolean;
  openTray: () => void;
  closeTray: () => void;
  enqueueFiles: (files: File[], sourceId: string) => void;
  remove: (id: string) => void;

  summary: Summary;
  errors: ErrorItem[];
  errorModalOpen: boolean;
  openErrors: () => void;
  closeErrors: () => void;
  clearErrors: () => void;
};

const UploadsContext = createContext<Ctx | null>(null);

const LSK_ITEMS = "uploads_tray_v1";
const LSK_VISIBLE = "uploads_tray_visible_v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function runLimited(tasks: Array<() => Promise<void>>, concurrency: number) {
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      try {
        await tasks[i]();
      } catch {
        // task-urile își gestionează singure erorile
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
}

export function UploadsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [visible, setVisible] = useState(false);

  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const stopFlags = useRef<Record<string, boolean>>({});

  // ---- persist & rehydrate ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LSK_ITEMS);
      if (raw) {
        const saved: UploadItem[] = JSON.parse(raw);
        setItems(saved);
        // reia polling pentru cele în coadă/proces
        saved.forEach((it) => {
          if (it.phase === "queued" || it.phase === "processing") {
            // resetăm contorul de pagini; statusul vine din backend
            pollIngest(it.sourceId, it.id);
          } else if (it.phase === "uploading") {
            // upload-ul XHR nu supraviețuiește navigării; marchează ca „processing”
            // și lăsăm backendul să ne spună starea reală
            updateItem(it.id, { phase: "processing", sent: 0, total: 0, pageCount: null });
            pollIngest(it.sourceId, it.id);
          }
        });
      }
      const v = localStorage.getItem(LSK_VISIBLE);
      if (v) setVisible(v === "1");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LSK_ITEMS, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(LSK_VISIBLE, visible ? "1" : "0");
    } catch {}
  }, [visible]);

  const openTray = useCallback(() => setVisible(true), []);
  const closeTray = useCallback(() => setVisible(false), []);

  const openErrors = useCallback(() => setErrorModalOpen(true), []);
  const closeErrors = useCallback(() => setErrorModalOpen(false), []);
  const clearErrors = useCallback(() => setErrors([]), []);

  const pushError = useCallback((id: string, filename: string, message: string) => {
    setErrors((prev) => [...prev, { id, filename, message, whenISO: new Date().toISOString() }]);
    setErrorModalOpen(true);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const remove = useCallback((id: string) => {
    stopFlags.current[id] = true;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const pollIngest = useCallback(async (sourceId: string, id: string) => {
    let delay = 1000;
    stopFlags.current[id] = false;

    while (!stopFlags.current[id]) {
      let st: UploadStatus | null = null;
      try {
        st = await getUploadStatus(sourceId);
      } catch {
        // retry cu backoff
      }

      if (st) {
        if (typeof st.total_pages === "number" && st.total_pages > 0) {
          updateItem(id, {
            phase: st.phase === "done" ? "done" : st.phase === "error" ? "error" : "processing",
            pageCount: st.total_pages,
            total: st.total_pages,
            sent: Math.min(st.processed_pages, st.total_pages),
          });
        } else {
          updateItem(id, { phase: "processing", pageCount: null });
        }

        if (st.phase === "done") break;
        if (st.phase === "error") {
          const it = items.find((x) => x.id === id);
          pushError(id, it?.filename || "file", st.last_error || "Ingest failed");
          break;
        }
      }

      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(5000, Math.floor(delay * 1.5));
    }
  }, [items, pushError, updateItem]);

  const processOne = useCallback(async (file: File, sourceId: string, id: string) => {
    try {
      updateItem(id, { phase: "uploading" });
      const { key } = await uploadFileMultipart(sourceId, file, {
        onProgress: (sent, total) => updateItem(id, { sent, total }),
        concurrency: 4,
      });

      updateItem(id, { phase: "queued", key });

      await enqueueIngest(sourceId, key, file.type || "application/octet-stream", file.name);

      // nu setăm done aici; poll pentru progres real
      updateItem(id, { phase: "processing", sent: 0, total: 0, pageCount: null });
      await pollIngest(sourceId, id);
    } catch (e: any) {
      const msg = e?.message || "Upload failed";
      updateItem(id, { phase: "error", error: msg });
      const it = items.find((x) => x.id === id);
      pushError(id, it?.filename || file.name, msg);
    }
  }, [items, pollIngest, pushError, updateItem]);

  const enqueueFiles = useCallback((files: File[], sourceId: string) => {
    if (!files || files.length === 0) return;
    openTray();

    const newItems: UploadItem[] = files.map((f) => ({
      id: uuid(),
      filename: f.name,
      total: f.size,
      sent: 0,
      phase: "uploading",
      sourceId,
      pageCount: null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    const tasks = newItems.map((meta, idx) => {
      const f = files[idx];
      return () => processOne(f, sourceId, meta.id);
    });

    void runLimited(tasks, 4);
  }, [openTray, processOne]);

  const summary: Summary = useMemo(() => {
    const total = items.length;
    const uploading = items.filter((i) => i.phase === "uploading").length;
    const queued = items.filter((i) => i.phase === "queued").length;
    const processing = items.filter((i) => i.phase === "processing").length;
    const done = items.filter((i) => i.phase === "done").length;
    const error = items.filter((i) => i.phase === "error").length;
    const left = items.filter((i) => i.phase !== "done" && i.phase !== "error").length;
    return { total, uploading, queued, processing, done, error, left };
  }, [items]);

  const value: Ctx = {
    items,
    visible,
    openTray,
    closeTray,
    enqueueFiles,
    remove,
    summary,
    errors,
    errorModalOpen,
    openErrors,
    closeErrors,
    clearErrors,
  };

  return <UploadsContext.Provider value={value}>{children}</UploadsContext.Provider>;
}

export function useUploads() {
  const ctx = useContext(UploadsContext);
  if (!ctx) throw new Error("useUploads must be used within UploadsProvider");
  return ctx;
}