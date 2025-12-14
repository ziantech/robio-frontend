/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import Footer from "@/components/Footer";
import Navbar from "@/components/Partners/Navbar";
import CreateSourceModal from "@/components/CreateSourceModal"; 
import CreateForumQuestionModal from "@/components/CreateForumQuestionModal";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";
import { useLanguage } from "@/context/LanguageContext";



import UploadsTray from "@/components/UploadsTray";
import { UploadsProvider } from "@/context/UploadContext";
import UploadsFab from "@/components/UploadFab";
import UploadErrorModal from "@/components/UploadErrorModal";
const INFO_BANNER_LS_KEY = "partner-credits-banner:v1";
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token, isPartner, flagsLoaded } = useAuth();
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);
  const {lang } = useLanguage()
  const [openCreateQuestion, setOpenCreateQuestion] = useState(false);

  // 👇 STATE pentru modalul de surse (global, accesibil din Navbar + Ctrl/⌘+K)
  const [openCreateSource, setOpenCreateSource] = useState(false);
const [showInfo, setShowInfo] = useState(true);
  useEffect(() => {
    try {
      const v = localStorage.getItem(INFO_BANNER_LS_KEY);
      if (v === "dismissed") setShowInfo(false);
    } catch {}
  }, []);
  const dismissInfo = () => {
    setShowInfo(false);
    try {
      localStorage.setItem(INFO_BANNER_LS_KEY, "dismissed");
    } catch {}
  };
    const restoreInfo = () => {
    setShowInfo(true);
    try { localStorage.removeItem(INFO_BANNER_LS_KEY); } catch {}
  };

  const notify = useNotify();

  useEffect(() => {
    if (token === null) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!flagsLoaded) return;
  }, [token, isAuthenticated, flagsLoaded, isPartner, router]);

  // 👇 Shortcut global: Ctrl/⌘+K -> deschide CreateSourceModal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenCreateSource(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSubmitApply = async () => {
    setSubmitting(true);
    setSubmitErr(null);
    setSubmitOk(null);
    try {
      await api.post("/users/partner-requests", {
        name: fullName.trim(),
        phone: phone.trim(),
      });
      notify("Cererea a fost trimisă. Vei fi contactat în curând.");
      setFullName("");
      setPhone("");
      setApplyOpen(false);
    } catch (e: any) {
      setSubmitErr(
        e?.response?.data?.message || "A apărut o eroare. Încearcă din nou."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (token === null || !isAuthenticated || !flagsLoaded) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isPartner) {
    return (
      <>
        {/* 👇 Pasăm callback-ul și în starea “nu e partener” (inofensiv) */}
        <Navbar onOpenCreateSource={() => setOpenCreateSource(true)} />

        <Box
          sx={{
            minHeight: "80vh",
            display: "grid",
            placeItems: "center",
            p: 3,
          }}
        >
          <Card
            sx={{
              maxWidth: 560,
              width: "100%",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Typography variant="h5">Program Parteneri</Typography>
                <Typography variant="body2" color="text.secondary">
                {lang === "ro" ? "  Nu ești încă partener. Aplică pentru a deveni partener RoBio și vom reveni cu un telefon cât de curând.": "You are not a partner, yet. Apply to become a Robio's Partner and we will contact you soon."}
                </Typography>
                <Button variant="contained" onClick={() => setApplyOpen(true)}>
                  {lang === "ro" ? "Aplică pentru parteneriat" : "Apply for partnership"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Footer />

        {/* Apply Modal */}
        <Dialog
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle> {lang === "ro" ? "Aplică pentru parteneriat" : "Apply for partnership"}</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              {submitErr && <Alert severity="error">{submitErr}</Alert>}
              {submitOk && <Alert severity="success">{submitOk}</Alert>}
              <TextField
                label={lang === "ro" ? "Nume complet" : "Full name"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                fullWidth
                required
              />
              <TextField
                label={lang === "ro"? "Telefon" : "Phone Number"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplyOpen(false)} disabled={submitting}>
            {lang === "ro" ? "Anulează" : "Cancel"}
            </Button>
            <Button
              onClick={onSubmitApply}
              variant="contained"
              disabled={
                submitting || !fullName.trim() || !phone.trim() || !!submitOk
              }
            >
              {submitting ? lang === "ro" ? "Se trimite…" : "Sending..." : lang === "ro" ? "Trimite cererea": "Send Request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 👇 Modalul de creare sursă, global */}
        <CreateSourceModal
          open={openCreateSource}
          onClose={() => setOpenCreateSource(false)}
          autoApprove={false}
          onSourceCreated={() => setOpenCreateSource(false)}
        />
      </>
    );
  }

  return (
  
      <UploadsProvider>
    <Navbar onOpenCreateSource={() => setOpenCreateSource(true)} onOpenCreateQuestion={() => setOpenCreateQuestion(true)} />
    {/* ⬇️ Info box sub Navbar, doar pentru parteneri */}
     {/* Info box sub Navbar, doar pentru parteneri */}
      <Box sx={{ px: 3, pt: 2 }}>
        {showInfo ? (
          <Alert
            severity="info"
            variant="outlined"
            action={
              <Button color="inherit" size="small" onClick={dismissInfo}>
                {lang === "ro" ? "Am înțeles" : "Got it"}
              </Button>
            }
          >
            <AlertTitle>
              {lang === "ro" ? "Sistem de credite" : "Credits system"}
            </AlertTitle>
            {lang === "ro" ? (
              <>
                Primești <b>1 credit (0.1 RON)</b> pentru fiecare profil creat
                în procesarea unei surse și <b>2 credite (0.2 RON)</b> pentru{" "}
                <b>fiecare pagină de registru vechi</b> sau{" "}
                <b>poză cu piatra funerară</b>.
              </>
            ) : (
              <>
                You receive <b>1 credit (0.1 RON)</b> for each profile created
                while processing a source, and <b>2 credits (0.2 RON)</b> for{" "}
                <b>each old registry page</b> or <b>grave photo</b>.
              </>
            )}
          </Alert>
        ) : (
       
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              startIcon={<InfoOutlinedIcon fontSize="small" />}
              onClick={restoreInfo}
            >
              {lang === "ro" ? "Afișează info credite" : "Show credits info"}
            </Button>
          </Box>
        )}
      </Box>
    <Box component="main" sx={{ minHeight: "100vh",width:"100%", p: 3 }}>
      {children}
    </Box>

    <Footer />

    {/* Floating chat */}

    <UploadsFab side="right" />
         <UploadsTray />
    <CreateSourceModal
      open={openCreateSource}
      onClose={() => setOpenCreateSource(false)}
      autoApprove={false}
      onSourceCreated={() => setOpenCreateSource(false)}
    />
    <CreateForumQuestionModal
  open={openCreateQuestion}
  onClose={() => setOpenCreateQuestion(false)}
/>
      <UploadErrorModal />
    </UploadsProvider>

  );
}
