/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AuthNavbar from "@/components/Auth/AuthNavbar";
import {
  Box,
  Card,
  Container,
  Button,
  Stack,
  Typography,
  TextField,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";
import ForgotPasswordDialog from "@/components/Auth/ForgotPasswordDialog";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const notify = useNotify();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/portal");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe") === "true";
    if (savedRemember) {
      setEmail(localStorage.getItem("rememberEmail") || "");
      setPassword(localStorage.getItem("rememberPassword") || "");
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      notify(t.fill_all_fields || "Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/login", { email, password });

      if (res.status >= 200 && res.status < 300) {
             if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberEmail", email);
          localStorage.setItem("rememberPassword", password);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberEmail");
          localStorage.removeItem("rememberPassword");
        }
        const data = res.data;
        const profileId = data.profile_id || "not-set";
        const treeId    = data.profile_tree || "not-set"; 
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("profileId", profileId);
        localStorage.setItem("username", data.username);
        localStorage.setItem("treeId", treeId);
        if (login) {
         login(data.token, {
  isPartner: !!data.is_partner,
  isAdmin: !!data.is_admin,
  isModerator: !!data.is_moderator,
   hasStripeAccount: !!data.has_stripe_account,
  stripeAccountId: data.stripe_account_id || null,
}); // Call AuthContext to refresh auth state
        }
   

        notify(t.login_success || "Login successful!", "success");
        router.push("/portal");
      } else {
        notify(t.login_error || "Invalid credentials", "error");
      }
    } catch (err: any) {
      notify(
        err.response?.data?.detail || t.login_error || "Login failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/auth-background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AuthNavbar />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "background.paper",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Typography variant="h5" fontWeight={600} textAlign="center">
              {t.login_title || "Login to your account"}
            </Typography>

            <TextField
              label={t.emailUsername || "Email / Username"}
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label={t.password || "Password"}
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label={t.remember_me || "Remember me"}
            />

            <Stack spacing={2} alignItems="center" mt={2}>
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleLogin}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  t.login_button || "Login"
                )}
              </Button>

              <Typography
                variant="body2"
                sx={{ cursor: "pointer", color: "primary.main" }}
                onClick={() => router.push("/register")}
              >
                {t.no_account || "Don't have an account? Register here"}
              </Typography>

              <Typography
                variant="body2"
                sx={{ cursor: "pointer", color: "primary.main" }}
                onClick={() => setForgotOpen(true)}
              >
                {t.forgot_password || "Forgot password?"}
              </Typography>
              <ForgotPasswordDialog
                open={forgotOpen}
                onClose={() => setForgotOpen(false)}
              />
            </Stack>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
