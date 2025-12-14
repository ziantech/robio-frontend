/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter} from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Paper,
  IconButton,
} from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import ImageViewer from "@/components/ImageViewer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // NEW

export default function LearnAuthPage() {

  const { t, lang } = useLanguage();
  const [selectedImage, setSelectedImage] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  setView(sp.get("view"));
}, []);

  const sectionRefs = {
    register: useRef<HTMLDivElement | null>(null),
    login: useRef<HTMLDivElement | null>(null),
    forgot: useRef<HTMLDivElement | null>(null),
  } as const;

  // where to scroll when `view` is provided
  const targetRef = useMemo(() => {
    if (view === "1") return sectionRefs.register;
    if (view === "2") return sectionRefs.login;
    if (view === "3") return sectionRefs.forgot;
    return null;
  }, [view, sectionRefs.register, sectionRefs.login, sectionRefs.forgot]);

  useEffect(() => {
    if (targetRef?.current) {
      // smooth scroll & focus heading for a11y
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  const createImg = `/learn/auth/create-account-${
    lang === "ro" ? "ro" : "en"
  }.png`;

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
        <IconButton
          aria-label="Back"
          onClick={() => router.push("/learn")}
          size="small"
         
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, letterSpacing: "-.02em" }}
        >
          {t.learnAuth.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learnAuth.desc}
        </Typography>
      </Stack>
      <Divider sx={{ mb: 1.5 }} />
      {/* SECTION 1 — Register / Înregistrare */}
      <Box
        ref={sectionRefs.register}
        id="register"
        sx={{ scrollMarginTop: 84 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17, 25, 39, 0.015), rgba(17, 25, 39, 0.015))",
          }}
        >
          <Stack spacing={1.2}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnAuth.sections.register.title}
              </Typography>

              <Chip size="small" label={t.learnAuth.sections.register.badge} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnAuth.sections.register.p1}
            </Typography>

            {/* compact, image + bullets */}
            <Stack
              direction={{ xs: "column", sm: "row" } as any}
              spacing={1.5}
              alignItems="stretch"
            >
              <Box
                sx={{
                  flex: "0 0 360px",
                  maxWidth: 420,
                  mx: { xs: "auto", sm: 0 },
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <img
                  src={createImg}
                  alt={t.learnAuth.sections.register.image_alt}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedImage(createImg);
                    setImageViewerOpen(true);
                  }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnAuth.sections.register.fields_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    <strong>
                      {t.learnAuth.sections.register.fields.email.label}:
                    </strong>{" "}
                    {t.learnAuth.sections.register.fields.email.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>
                      {t.learnAuth.sections.register.fields.username.label}:
                    </strong>{" "}
                    {t.learnAuth.sections.register.fields.username.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>
                      {t.learnAuth.sections.register.fields.password.label}:
                    </strong>{" "}
                    {t.learnAuth.sections.register.fields.password.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>
                      {
                        t.learnAuth.sections.register.fields.recovery_email
                          .label
                      }
                      :
                    </strong>{" "}
                    {t.learnAuth.sections.register.fields.recovery_email.desc}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} /> {/* NEW */}
      <Box ref={sectionRefs.login} id="login" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17, 25, 39, 0.015), rgba(17, 25, 39, 0.015))",
          }}
        >
          <Stack spacing={1.2}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnAuth.sections.login.title}
              </Typography>
              <Chip size="small" label={t.learnAuth.sections.login.badge} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnAuth.sections.login.p1}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" } as any}
              spacing={1.5}
              alignItems="stretch"
            >
              <Box
                sx={{
                  flex: "0 0 360px",
                  maxWidth: 420,
                  mx: { xs: "auto", sm: 0 },
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`/learn/auth/login-${lang === "ro" ? "ro" : "en"}.png`}
                  alt={t.learnAuth.sections.login.image_alt}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnAuth.sections.login.tips_title}
                </Typography>

                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    {t.learnAuth.sections.login.tip_email_password}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t.learnAuth.sections.login.tip_remember}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t.learnAuth.sections.login.note_remember}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} /> {/* NEW */}
      <Box ref={sectionRefs.forgot} id="forgot" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17, 25, 39, 0.015), rgba(17, 25, 39, 0.015))",
          }}
        >
          <Stack spacing={1.2}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnAuth.sections.forgot.title}
              </Typography>
              <Chip size="small" label={t.learnAuth.sections.forgot.badge} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnAuth.sections.forgot.p1}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" } as any}
              spacing={1.5}
              alignItems="stretch"
            >
              <Box
                sx={{
                  flex: "0 0 360px",
                  maxWidth: 420,
                  mx: { xs: "auto", sm: 0 },
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`/learn/auth/forgot-${lang === "ro" ? "ro" : "en"}.png`}
                  alt={t.learnAuth.sections.forgot.image_alt}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnAuth.sections.forgot.tips_title}
                </Typography>

                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    {t.learnAuth.sections.forgot.tip_primary}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t.learnAuth.sections.forgot.tip_recovery}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t.learnAuth.sections.forgot.note_reset}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage}
      />
    </Box>
  );
}
