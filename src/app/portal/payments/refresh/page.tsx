/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Box, CircularProgress, Alert } from "@mui/material";

export default function StripeRefreshPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Linkurile Stripe expiră; generăm unul nou și redirecționăm imediat.
        const { data } = await api.post("/users/me/stripe/connect/onboarding-link");
        window.location.href = data.url;
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Failed to refresh onboarding link.");
      }
    })();
  }, []);

  return (
    <Box sx={{ p: 4, display: "grid", placeItems: "center" }}>
      {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
    </Box>
  );
}
