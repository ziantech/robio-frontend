/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import AuthNavbar from "@/components/Auth/AuthNavbar";
import Footer from "@/components/Footer";
import { Box, Container, Typography, CircularProgress, Button } from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";

export default function VerifyEmailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        await api.post(`/users/verify-email/${id}`);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };
    if (id) verify();
  }, [id]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
      }}
    >
      <AuthNavbar />

      <Container
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <Box textAlign="center">
            <CircularProgress />
            <Typography variant="h6" mt={2}>
              {t.verifying_email || "Verifying your email..."}
            </Typography>
          </Box>
        ) : (
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {status === "success"
                ? t.email_verified_success || "Your email has been successfully verified!"
                : t.email_verified_error || "Verification failed. Your link may be invalid or expired."}
            </Typography>

            <Button
              variant="contained"
              color={status === "success" ? "primary" : "error"}
              sx={{ mt: 3 }}
              onClick={() => router.push("/login")}
            >
              {t.go_to_login || "Go to Login"}
            </Button>
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  );
}
