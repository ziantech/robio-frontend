/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CreateForumQuestionModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, FormControlLabel, Checkbox,
  Autocomplete, CircularProgress, Typography, Chip, Box
} from "@mui/material";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";

type ProcessingItem = {
  id: string;           // assumed: SourceFile ID
  title: string;        // source title
  run_id?: string|null; // not used here
  position?: number|null;
};

export default function CreateForumQuestionModal({
  open,
  onClose,
  defaultSourceFileId,
  defaultSourceLabel,
  afterCreate,
}: {
  open: boolean;
  onClose: () => void;
  defaultSourceFileId?: string;
  defaultSourceLabel?: string;
  afterCreate?: () => void;
}) {
  const notify = useNotify();

  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [attachFile, setAttachFile] = useState<boolean>(!!defaultSourceFileId);
  const [loadingMine, setLoadingMine] = useState(false);
  const [mine, setMine] = useState<ProcessingItem[]>([]);
  const [picked, setPicked] = useState<{ id: string; label: string } | null>(
    defaultSourceFileId
      ? { id: defaultSourceFileId, label: defaultSourceLabel || "Linked file" }
      : null
  );

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const r = await api.get<ProcessingItem[]>("/partners/files/my-processing");
      const items = (r.data || []).map((it: any) => ({
        id: it.id,
        title: it.title || "Untitled source",
        position: it.position ?? null,
      })) as ProcessingItem[];
      setMine(items);
    } catch {
      setMine([]);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    if (open && !defaultSourceFileId) loadMine();
  }, [open, defaultSourceFileId]);

  useEffect(() => {
    if (open) {
      setBody("");
      setFile(null);
      setAttachFile(!!defaultSourceFileId);
      setPicked(
        defaultSourceFileId
          ? { id: defaultSourceFileId, label: defaultSourceLabel || "Linked file" }
          : null
      );
    }
  }, [open, defaultSourceFileId, defaultSourceLabel]);

  const canSubmit = body.trim().length >= 5 && (!attachFile || !!picked?.id);

  const submit = async () => {
    try {
      const fd = new FormData();
      fd.append("body", body.trim());
      if (attachFile && picked?.id) fd.append("source_file_id", picked.id);
      if (file) fd.append("file", file);
      // status defaults to active server-side; send if you want override:
      // fd.append("status", "active");

      await api.post("/forum/questions", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      notify("Întrebare creată", "success");
      onClose();
      afterCreate?.();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to create question", "error");
    }
  };

  const fileLabel = (it: ProcessingItem) =>
    `${it.title}${it.position ? ` — File #${it.position}` : ""}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Creare întrebare forum</DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 1.25 }}>
        <TextField
          multiline
          minRows={4}
          label="Întrebare"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Descrie problema ta cât mai detaliat…"
          fullWidth
          autoFocus
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <FormControlLabel
            control={
              <Checkbox
                checked={attachFile}
                onChange={(e) => setAttachFile(e.target.checked)}
              />
            }
            label="Atașează un fișier sursă"
          />
          {picked?.id && (
            <Chip
              size="small"
              label={picked.label}
              onDelete={() => setPicked(null)}
              sx={{ ml: 1 }}
            />
          )}
        </Stack>

        {attachFile && !defaultSourceFileId && (
          <Autocomplete
            options={mine}
            loading={loadingMine}
            getOptionLabel={(o) => fileLabel(o)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_, v) =>
              setPicked(v ? { id: v.id, label: fileLabel(v) } : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Alege din fișierele mele procesate"
                placeholder="Începe să tastezi pentru a căuta…"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingMine ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                fullWidth
                size="small"
              />
            )}
          />
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Atașează o imagine (opțional)
          </Typography>
          <Button
            variant="outlined"
            component="label"
            size="small"
          >
            Încarcă imagine
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Button>
          {file && (
            <Typography variant="caption" sx={{ ml: 1 }}>
              {file.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anulează</Button>
        <Button onClick={submit} disabled={!canSubmit} variant="contained">
          Creare întrebare
        </Button>
      </DialogActions>
    </Dialog>
  );
}
