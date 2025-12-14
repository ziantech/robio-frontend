"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";

type Severity = "success" | "info" | "warning" | "error";
type NotifyFn = (msg: string, severity?: Severity) => void;

const NotifyCtx = createContext<NotifyFn>(() => {});
export const useNotify = () => useContext(NotifyCtx);

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sev, setSev] = useState<Severity>("info");

  const notify: NotifyFn = (m, s = "info") => {
    setMsg(m);
    setSev(s);
    setOpen(true);
  };

  return (
    <NotifyCtx.Provider value={notify}>
      {children}
      <Snackbar open={open} autoHideDuration={3500} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={sev} variant="filled">
          {msg}
        </Alert>
      </Snackbar>
    </NotifyCtx.Provider>
  );
}
