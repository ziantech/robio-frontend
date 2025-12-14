/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
// o facem imediat
import {
  CircularProgress,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import Navbar, { triggerGlobalSearch } from "@/components/Portal/Navbar";
import Footer from "@/components/Footer";
import { useNotify } from "@/context/NotifyContext";
import { useLanguage } from "@/context/LanguageContext";
import CreateProfileModal2 from "@/components/Portal/CreateProfileModal2";
import { usePathname } from "next/navigation";
import UploadsTray from "@/components/UploadsTray";
import { UploadsProvider } from "@/context/UploadContext";
import UploadsFab from "@/components/UploadFab";
import UploadErrorModal from "@/components/UploadErrorModal";


export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
const onSearchPage = pathname?.startsWith("/portal/search");
const onProfilePage = pathname?.startsWith("/portal/profile");
const onMapPage = pathname?.startsWith("/portal/map");
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState<boolean | null>(null);

  const [userStatusChecked, setUserStatusChecked] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [bannedUntil, setBannedUntil] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const notify = useNotify();

  useEffect(() => {
    // Așteaptă să se seteze tokenul înainte de orice
    if (!token) return;

    // Dacă nu ești logat, redirecționează
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Dacă ești logat, fetch user status
    const fetchUserStatus = async () => {
      try {
        const res = await api.get("/users/me/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVerifiedEmail(res.data.email_verified);
        setIsBanned(res.data.is_banned);
        setBannedUntil(res.data.banned_until);
      } catch (err) {
        console.error("Error fetching user status", err);
        logout();
      } finally {
        setUserStatusChecked(true);
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, [isAuthenticated, logout, token, router]);

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post("/users/resend-verification");
      notify("Email de verificare trimis din nou!", "success");
    } catch (err: any) {
      notify(
        err?.response?.data?.detail || "Eroare la retrimiterea emailului",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userStatusChecked) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  if (isBanned) {
    return (
      <>
        <Navbar />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="85vh"
          textAlign="center"
          px={2}
        >
          <Typography variant="h5" gutterBottom>
            🚫 {t.account_banned || "Cont suspendat"}
          </Typography>
          <Typography variant="body1">
            {t.banned_until || "Contul tău este suspendat până la"}{" "}
            <b>{bannedUntil ? new Date(bannedUntil).toLocaleString() : "—"}</b>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t.contact_support ||
              "Dacă crezi că e o eroare, contactează suportul."}
          </Typography>
        </Box>
        <Footer />
      </>
    );
  }

  if (!verifiedEmail) {
    return (
      <>
        <Navbar />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="85vh"
          textAlign="center"
        >
          <Typography variant="h5" gutterBottom>
            📧 {t.not_verified}
          </Typography>
          <Typography variant="body1">{t.please_verify}</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                {t.sending}
              </Box>
            ) : (
              <>{t.resend || "Retrimite emailul de verificare"}</>
            )}
          </Button>
        </Box>
        <Footer />
      </>
    );
  }

  const localProfileId =
    (typeof window !== "undefined" && localStorage.getItem("profileId")) ||
    "not-set";
  const localTreeId =
    (typeof window !== "undefined" && localStorage.getItem("treeId")) ||
    "not-set";

  const noProfile =
    !localProfileId ||
    localProfileId === "not-set" ||
    !localTreeId ||
    localTreeId === "not-set";

  if (noProfile && !onSearchPage && !onProfilePage && !onMapPage ) {
    return (
      <>
        <Navbar />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="85vh"
          textAlign="center"
          px={2}
        >
          <Typography variant="h5" gutterBottom>
            🌱 {t.no_profile_title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 600 }}
          >
            {t.no_profile_desc}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="contained" onClick={() => setCreateOpen(true)}>
              {t.create_profile}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" }); // opțional: ca să vezi dropdown-ul
                triggerGlobalSearch(); // 🔥 deschide exact shortcut-ul din Navbar (Ctrl/⌘+K)
              }}
            >
              {t.claim_profile}
            </Button>
          </Stack>
          <CreateProfileModal2
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
        </Box> 
        <Footer />
      </>
    );
  }

  return (
    <>
    <UploadsProvider>
      <Navbar />
      <Box component="main" sx={{ minHeight: "80vh", p: 3 }}>
        {children}
      </Box>
<UploadsFab side="right" />
       <UploadsTray />
         <UploadErrorModal />
      <Footer />
      </UploadsProvider>
    </>
  );
}
