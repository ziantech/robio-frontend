/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, RadioGroup, FormControlLabel, Radio, Stack, Typography
} from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";

export default function ForgotPasswordDialog({
  open, onClose
}: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();

  const [method, setMethod] = useState<"primary"|"recovery_email"|"recovery_code">("primary");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setMethod("primary"); setEmail(""); setUsername(""); setCode("");
    setLoading(false); setDoneMsg(null); setError(null);
  };

  const handleClose = () => { if (!loading) { resetState(); onClose(); } };

  const submit = async () => {
    setLoading(true); setError(null); setDoneMsg(null);
    try {
      const payload: any = { method };
      if (method === "primary" || method === "recovery_email") {
        payload.email = email;
      } else {
        payload.recovery_code = code;
        if (email) payload.email = email;
        if (username) payload.username = username;
      }
      await api.post("/users/recover-password", payload);
      setDoneMsg(t.reset_sent_success || "A new password has been sent.");
    } catch (e: any) {
      setError(e.response?.data?.detail || t.reset_sent_error || "Failed to send reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t.recover_password_title || "Recover password"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            {t.recover_password_intro || "Choose a method to receive a new, system-generated password."}
          </Typography>

          <RadioGroup
            row
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
          >
            <FormControlLabel value="primary" control={<Radio />} label={t.method_primary_email || "Primary email"} />
            <FormControlLabel value="recovery_email" control={<Radio />} label={t.method_recovery_email || "Recovery email"} />
            {/* <FormControlLabel value="recovery_code" control={<Radio />} label={t.method_recovery_code || "Recovery code"} /> */}
          </RadioGroup>

          {(method === "primary" || method === "recovery_email") && (
            <TextField
              label={t.email || "Email"}
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {/* {method === "recovery_code" && (
            <>
              <TextField
                label={t.recovery_code_label || "Recovery code"}
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
              />
              <TextField
                label={t.email_or_username || "Email or Username"}
                fullWidth
                value={email || username}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes("@")) { setEmail(v); setUsername(""); }
                  else { setUsername(v); setEmail(""); }
                }}
                helperText={t.email_or_username_helper || "Enter either your account email or your username"}
              />
            </>
          )} */}

          {doneMsg && <Typography color="success.main">{doneMsg}</Typography>}
          {error && <Typography color="error.main">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>{t.cancel || "Cancel"}</Button>
        <Button onClick={submit} disabled={loading || (
          (method !== "recovery_code" && !email) ||
          (method === "recovery_code" && (!code || (!email && !username)))
        )} variant="contained">
          {loading ? (t.sending || "Sending...") : (t.send_reset || "Send password reset")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
