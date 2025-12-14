/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Paper,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import SavingsIcon from "@mui/icons-material/Savings";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import WithdrawDialog from "@/components/WithdrawalDialog";

type MeOut = {
  id: string;
  email: string | null;
  username: string | null;
  is_partner: boolean;
  is_admin: boolean;
  is_moderator: boolean;
};

type ConnectStatus = {
  has_account: boolean;
  payouts_enabled: boolean;
  requirements_due: string[];
  default_external_account: {
    bank_name?: string;
    country?: string;
    currency?: string;
    last4?: string;
  } | null;
  preferred_payout_currency?: string | null;
};

type FinancialsOut = {
  credits: number;
  ron_per_credit: number;
  ron_total: number;
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const { isPartner } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<ConnectStatus | null>(null);
  const [wdOpen, setWdOpen] = useState(false);

  // server state
  const [me, setMe] = useState<MeOut | null>(null);
  const [financials, setFinancials] = useState<FinancialsOut | null>(null);

  // form state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");

  // feedback
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const ron = useMemo(() => {
    if (!financials) return { credits: 0, total: 0, per: 0.1 };
    return {
      credits: financials.credits,
      total: financials.ron_total,
      per: financials.ron_per_credit,
    };
  }, [financials]);

  const refreshStripeStatus = useCallback(async () => {
    try {
      const { data } = await api.get<ConnectStatus>("/users/me/stripe/connect/status");
      setStripeStatus(data);
    } catch (e: any) {
      setStripeStatus(null);
      setMsg({ type: "error", text: e?.response?.data?.detail || "Nu pot încărca statusul de retragere." });
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, finRes, statusRes] = await Promise.all([
        api.get<MeOut>("/users/auth/me"),
        api.get<FinancialsOut>("/users/me/financials"),
        api.get<ConnectStatus>("/users/me/stripe/connect/status"),
      ]);
      setMe(meRes.data);
      setEmail(meRes.data.email || "");
      setUsername(meRes.data.username || "");
      setFinancials(finRes.data);
      setStripeStatus(statusRes.data);
    } catch (e: any) {
      setMsg({ type: "error", text: e?.response?.data?.detail || (t.load_error || "Eroare la încărcare.") });
    } finally {
      setLoading(false);
    }
  }, [t.load_error]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Handle return from onboarding: ?onboarding=done|retry
  useEffect(() => {
    const ob = searchParams.get("onboarding");
    if (!ob) return;
    if (ob === "done") {
      setMsg({ type: "success", text: "Setarea pentru retragere a fost finalizată." });
    } else if (ob === "retry") {
      setMsg({
        type: "info",
        text: "Continuă configurarea pentru a putea retrage banii.",
      });
    }
    refreshStripeStatus();
    // curăță URL-ul
    router.replace("/portal/settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const saveAccount = async () => {
    setMsg(null);
    try {
      setSavingAccount(true);
      await api.patch("/users/me", { email, username });
      setMsg({ type: "success", text: t.account_updated || "Cont actualizat." });
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e?.response?.data?.detail || t.account_update_failed || "Actualizare eșuată.",
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const changePassword = async () => {
    setMsg(null);
    if (!passwordCurrent || !passwordNew) {
      setMsg({ type: "error", text: t.password_both_required || "Completează ambele câmpuri de parolă." });
      return;
    }
    try {
      setChangingPass(true);
      await api.post("/users/me/change-password", {
        current_password: passwordCurrent,
        new_password: passwordNew,
      });
      setPasswordCurrent("");
      setPasswordNew("");
      setMsg({ type: "success", text: t.password_changed || "Parola a fost schimbată." });
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e?.response?.data?.detail || t.password_change_failed || "Schimbarea parolei a eșuat.",
      });
    } finally {
      setChangingPass(false);
    }
  };

  const handleWithdrawClick = async () => {
    if (busy) return;
    setMsg(null);
    // Dacă NU e gata pentru retragere, lansăm onboard (fără a folosi cuvinte Stripe în UI).
    if (!stripeStatus?.payouts_enabled) {
      try {
        setBusy(true);
        const endpoint = stripeStatus?.has_account
          ? "/users/me/stripe/connect/onboarding-link"
          : "/users/me/stripe/connect/init";
        const payload = stripeStatus?.has_account ? {} : { country: "RO", currency: "RON" };
        const { data } = await api.post(endpoint, payload);
        // Stripe hosted page
        window.location.href = data.onboarding_url || data.url;
      } catch (e: any) {
        setMsg({
          type: "error",
          text: e?.response?.data?.detail || "Nu pot porni configurarea pentru retragere.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }
    // altfel, deschidem dialogul de retragere
    setWdOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 2 }}>
        <Typography variant="h4">{t.settings_title || "Setări"}</Typography>
        {loading && <LinearProgress sx={{ width: 220, borderRadius: 2 }} />}
      </Stack>

      {msg && (
        <Alert severity={msg.type as any} onClose={() => setMsg(null)} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      )}

      {/* ——— 1) Financial ——— */}
      <Section title={t.financial_section || "Financiar"} description={t.financial_description || ""}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: isPartner ? "1fr" : "2fr 1fr" },
            gap: 2,
          }}
        >
          {/* Card principal */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <CircleIcon>
                  <MonetizationOnIcon />
                </CircleIcon>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t.credits_existing || "Credite disponibile"}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {ron.credits.toLocaleString("ro-RO")}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Stat
                  label={`${t.ron_equivalent || "Echivalent RON"} (${ron.per.toFixed(2)} RON / credit)`}
                  value={new Intl.NumberFormat("ro-RO", {
                    style: "currency",
                    currency: "RON",
                  }).format(ron.total)}
                  icon={<SavingsIcon />}
                />
                <Stat
                  label={t.partner_status || "Status partener"}
                  value={isPartner ? t.partner_active || "Activ" : t.partner_inactive || "Inactiv"}
                  icon={<WorkspacePremiumIcon />}
                  color={isPartner ? "success.main" : "text.secondary"}
                />
              </Box>

              {/* Info simplu despre contul pentru retragere (dacă există) */}
              {stripeStatus?.default_external_account && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                  <AccountBalanceIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {`${stripeStatus.default_external_account.bank_name || "Cont"} • ${
                      stripeStatus.default_external_account.currency || ""
                    } • ****${stripeStatus.default_external_account.last4 || ""}`}
                  </Typography>
                  {stripeStatus.preferred_payout_currency && (
                    <Chip size="small" label={stripeStatus.preferred_payout_currency} sx={{ ml: 1 }} />
                  )}
                </Stack>
              )}

              {/* Hint discret dacă nu e gata pentru retragere */}
              {stripeStatus && !stripeStatus.payouts_enabled && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Pentru a retrage banii, finalizăm un pas scurt de configurare.
                </Typography>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleWithdrawClick}
                  disabled={busy || ron.total <= 0}
                >
                  {t.withdraw_money || "Retrage banii"}
                </Button>
              </Stack>

              {wdOpen && (
                <WithdrawDialog
                  open={wdOpen}
                  onClose={() => setWdOpen(false)}
                  maxCredits={ron.credits}
                  onSuccess={async () => {
                    setMsg({
                      type: "success",
                      text: "Cererea de retragere a fost trimisă. Vei primi un email cu detalii.",
                    });
                    const [finRes] = await Promise.all([api.get<FinancialsOut>("/users/me/financials")]);
                    setFinancials(finRes.data);
                    setWdOpen(false);
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Upsell card (doar dacă NU e partener) */}
          {!isPartner && (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: "divider",
                background: "linear-gradient(180deg, rgba(255,215,0,0.10), rgba(255,215,0,0.03))",
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WorkspacePremiumIcon />
                    <Typography variant="subtitle1" fontWeight={700}>
                      {t.partner_upsell_title || "Devino partener"}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {(t.partner_upsell_text_prefix || "Retragerile se calculează la") + " "}
                    <strong>0.1 RON/credit</strong>.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      router.push("/partners");
                    }}
                  >
                    {t.apply_now || "Aplică acum"}
                  </Button>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="text.secondary">
                      {t.partner_upsell_bullets || "Avantaje dedicate contributorilor activi."}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Section>

      {/* ——— 2) Account ——— */}
      <Section title={t.account_section || "Cont"} description={t.account_description || ""}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Box>
            <TextField
              fullWidth
              label={t.email_label || "Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t.username_label || "Username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={saveAccount} disabled={savingAccount || !email || !username} fullWidth>
              {savingAccount ? t.saving || "Salvez..." : t.update_auth_button || "Actualizează"}
            </Button>
          </Box>

          <Box>
            <TextField
              fullWidth
              label={t.current_password || "Parola curentă"}
              type="password"
              value={passwordCurrent}
              onChange={(e) => setPasswordCurrent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t.new_password || "Parolă nouă"}
              type="password"
              value={passwordNew}
              onChange={(e) => setPasswordNew(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="outlined"
              onClick={changePassword}
              disabled={changingPass || !passwordCurrent || !passwordNew}
              fullWidth
            >
              {changingPass ? t.working || "Lucrez..." : t.change_password || "Schimbă parola"}
            </Button>
          </Box>
        </Box>
      </Section>

      {/* ——— 4) Security ——— */}
      <Section title={t.security_section || "Securitate"} description={t.security_description || ""}>
        <TextField
          fullWidth
          label={t.recovery_email || "Email de recuperare"}
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          sx={{ mb: 2 }}
          disabled
        />
        <Button variant="outlined" disabled>
          {t.update_recovery || "Actualizează emailul de recuperare"}
        </Button>
      </Section>
    </Box>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" gutterBottom color="text.secondary">
        {description}
      </Typography>
      <Divider sx={{ my: 2 }} />
      {children}
    </Paper>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 220 }}>
      <CircleIcon>{icon}</CircleIcon>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function CircleIcon({ children }: { children?: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: "999px",
        border: "1px solid",
        borderColor: "divider",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}
