/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography, Alert } from "@mui/material";
import api from "@/lib/api";

type Quote = {
  credits: number;
  rate_per_credit_ron: number;
  gross_ron: number;
  platform_fee_ron: number;
  transfer_amount_ron: number;
  est_stripe_payout_fee_ron: number;
  expected_bank_amount_ron: number;
  currency: string;
  errors: string[];
};

export default function WithdrawDialog({
  open,
  onClose,
  maxCredits,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  maxCredits: number;
  onSuccess: () => void;
}) {
  const [credits, setCredits] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setCredits(0); setQuote(null); setError(null); }
  }, [open]);

  const fetchQuote = async (val: number) => {
    setError(null);
    setQuote(null);
    if (!val || val <= 0) return;
    setLoading(true);
    try {
      const { data } = await api.post<Quote>("/users/me/withdraw/quote", { credits: val });
      setQuote(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to get quote.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!quote || quote.errors?.length) return;
    setSubmitting(true);
    try {
      await api.post("/users/me/withdraw/request", { credits: quote.credits });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Withdraw failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Withdraw money</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Credits to withdraw"
            type="number"
            inputProps={{ min: 1, max: maxCredits }}
            value={credits || ""}
            onChange={(e) => {
              const v = Math.max(0, Math.min(maxCredits, Math.floor(Number(e.target.value || 0))));
              setCredits(v);
              fetchQuote(v);
            }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {quote && (
            <>
              {quote.errors?.length > 0 && (
                <Alert severity="warning">{quote.errors.join(", ")}</Alert>
              )}
              <Typography variant="body2">Rate: {quote.rate_per_credit_ron.toFixed(2)} RON / credit</Typography>
              <Typography variant="body2">Gross: {quote.gross_ron.toFixed(2)} RON</Typography>
              <Typography variant="body2">Platform fee: {quote.platform_fee_ron.toFixed(2)} RON</Typography>
              <Typography variant="body2">Transfer to Stripe balance: {quote.transfer_amount_ron.toFixed(2)} RON</Typography>
              <Typography variant="body2">Stripe payout fee (est.): {quote.est_stripe_payout_fee_ron.toFixed(2)} RON</Typography>
              <Typography variant="h6">You receive (est.): {quote.expected_bank_amount_ron.toFixed(2)} RON</Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting || loading || !quote || !!(quote?.errors?.length)}
        >
          {submitting ? "Processing..." : "Confirm withdraw"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
