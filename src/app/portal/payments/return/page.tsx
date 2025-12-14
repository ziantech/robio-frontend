/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

export default function StripeReturnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsMore, setNeedsMore] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users/me/stripe/connect/status");
      if (!data?.has_account) throw new Error("No connected account yet.");

      if (data.payouts_enabled) {
        // curățăm ruta -> mergem în settings cu un mic mesaj (opțional query)
        router.replace("/portal/settings?toast=payout_ready");
        return;
      }

      const due: string[] = data.requirements_due || [];
      setNeedsMore(due);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const continueOnboarding = async () => {
    try {
      const { data } = await api.post("/users/me/stripe/connect/onboarding-link");
      window.location.href = data.url; // redirect Stripe-hosted
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create onboarding link.");
    }
  };

  useEffect(() => { check(); }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {needsMore.length > 0 && (
          <>
            <Typography variant="h6">Mai sunt pași de completat în Stripe</Typography>
            <Alert severity="info">
              Stripe raportează câmpuri incomplete: {needsMore.join(", ")}.
            </Alert>
            <Button variant="contained" onClick={continueOnboarding}>
              Continuă onboarding-ul
            </Button>
            <Button variant="text" onClick={() => router.replace("/portal/settings")}>
              Înapoi la Settings (fără redirect)
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
}
