/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Paper,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLanguage } from "@/context/LanguageContext";
import ImageViewer from "@/components/ImageViewer";
import Link from "next/link";

export default function LearnPortalHomePage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // view param via window (evităm Suspense warning)
  const [view, setView] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setView(sp.get("view")); // "1" -> verify, "2" -> suspended
  }, []);

  const [selectedImage, setSelectedImage] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const sectionRefs = {
    verify: useRef<HTMLDivElement | null>(null),
    suspended: useRef<HTMLDivElement | null>(null),
    onboard: useRef<HTMLDivElement | null>(null),
    navbar: useRef<HTMLDivElement | null>(null),
    map: useRef<HTMLDivElement | null>(null),
    actions: useRef<HTMLDivElement | null>(null),
    columns: useRef<HTMLDivElement | null>(null),
  } as const;

  const targetRef = useMemo(() => {
    if (view === "1") return sectionRefs.verify;
    if (view === "2") return sectionRefs.suspended;
    if (view === "3") return sectionRefs.onboard;
    if (view === "4") return sectionRefs.navbar;
    if (view === "5") return sectionRefs.map;
    if (view === "6") return sectionRefs.actions;
     if (view === "7") return sectionRefs.columns;
    return null;
  }, [
    view,
    sectionRefs.verify,
    sectionRefs.suspended,
    sectionRefs.onboard,
    sectionRefs.navbar,
    sectionRefs.map,
    sectionRefs.actions,
    sectionRefs.columns
  ]);

  useEffect(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  const notVerifiedImg = `/learn/portal-home/not-verified-screen-${
    lang === "ro" ? "ro" : "en"
  }.png`;
  const suspendedImg = `/learn/portal-home/suspended-account-${
    lang === "ro" ? "ro" : "en"
  }.png`;
  const searchOrCreateImg = `/learn/portal-home/search-or-create-${
    lang === "ro" ? "ro" : "en"
  }.png`;
  const createFirstImg = `/learn/portal-home/create-profile-first-${
    lang === "ro" ? "ro" : "en"
  }.png`;
  const searchFirstImg = `/learn/portal-home/search-profile-first-${
    lang === "ro" ? "ro" : "en"
  }.png`;
  const navbarImg = `/learn/portal-home/navbar.png`; // NEW
  const mapImg = `/learn/portal-home/map.png`;
  const actionsImg = `/learn/portal-home/user-platform-action-${
    lang === "ro" ? "ro" : "en"
  }.png`; // NEW
const columnsImg = `/learn/portal-home/user-portal-columns-${lang === "ro" ? "ro" : "en"}.png`; // NEW

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
          {t.learnPortalHome.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learnPortalHome.desc}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* SECTION 1 — Account verification */}
      <Box ref={sectionRefs.verify} id="verify" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
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
                {t.learnPortalHome.sections.verify.title}
              </Typography>
              <Chip
                size="small"
                label={t.learnPortalHome.sections.verify.badge}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.verify.p1}
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
                  src={notVerifiedImg}
                  alt={t.learnPortalHome.sections.verify.image_alt}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedImage(notVerifiedImg);
                    setImageViewerOpen(true);
                  }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnPortalHome.sections.verify.tips_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    {t.learnPortalHome.sections.verify.tip_email_link}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t.learnPortalHome.sections.verify.tip_resend}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t.learnPortalHome.sections.verify.tip_spam}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t.learnPortalHome.sections.verify.note_security}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* SECTION 2 — Suspended account */}
      <Box
        ref={sectionRefs.suspended}
        id="suspended"
        sx={{ scrollMarginTop: 84 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
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
                {t.learnPortalHome.sections.suspended.title}
              </Typography>
              <Chip
                size="small"
                color="warning"
                label={t.learnPortalHome.sections.suspended.badge}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.suspended.p1}
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
                  src={suspendedImg}
                  alt={t.learnPortalHome.sections.suspended.image_alt}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedImage(suspendedImg);
                    setImageViewerOpen(true);
                  }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnPortalHome.sections.suspended.tips_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    {t.learnPortalHome.sections.suspended.tip_reason}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t.learnPortalHome.sections.suspended.tip_contact}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t.learnPortalHome.sections.suspended.tip_review}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t.learnPortalHome.sections.suspended.note_policy}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Box ref={sectionRefs.onboard} id="onboard" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
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
                {t.learnPortalHome.sections.onboard.title}
              </Typography>
              <Chip
                size="small"
                label={t.learnPortalHome.sections.onboard.badge}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.onboard.p1.before}{" "}
              <Link href="/learn/profiles?view=1">
                <strong>{t.learnPortalHome.sections.onboard.p1.link}</strong>
              </Link>{" "}
              {t.learnPortalHome.sections.onboard.p1.after}
            </Typography>

            {/* imagine overview */}
            <Box
              sx={{
                flex: "0 0 360px",
                maxWidth: 680,
                mx: "auto",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <img
                src={searchOrCreateImg}
                alt={t.learnPortalHome.sections.onboard.image_overview_alt}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedImage(searchOrCreateImg);
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            {/* două opțiuni: Creează profilul / Caută profilul */}
            <Stack
              direction={{ xs: "column", sm: "row" } as any}
              spacing={1.5}
              alignItems="stretch"
            >
              {/* Create */}
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2, flex: 1 }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t.learnPortalHome.sections.onboard.create.title}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={createFirstImg}
                      alt={t.learnPortalHome.sections.onboard.create.image_alt}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSelectedImage(createFirstImg);
                        setImageViewerOpen(true);
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.learnPortalHome.sections.onboard.create.p1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.learnPortalHome.sections.onboard.create.p2.before}{" "}
                    <Link href="/learn/profiles?view=1">
                      <strong>
                        {t.learnPortalHome.sections.onboard.create.p2.link}
                      </strong>
                    </Link>
                    {t.learnPortalHome.sections.onboard.create.p2.after}
                  </Typography>
                </Stack>
              </Paper>

              {/* Search */}
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2, flex: 1 }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t.learnPortalHome.sections.onboard.search.title}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={searchFirstImg}
                      alt={t.learnPortalHome.sections.onboard.search.image_alt}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSelectedImage(searchFirstImg);
                        setImageViewerOpen(true);
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.learnPortalHome.sections.onboard.search.p1.before}{" "}
                    <Link href="/search?view=2">
                      <strong>
                        {t.learnPortalHome.sections.onboard.search.p1.link}
                      </strong>
                    </Link>{" "}
                    {t.learnPortalHome.sections.onboard.search.p1.after}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.learnPortalHome.sections.onboard.search.p2.before}{" "}
                    <Link href="/learn/profiles?view=3">
                      <strong>
                        {t.learnPortalHome.sections.onboard.search.p2.link}
                      </strong>
                    </Link>{" "}
                    {t.learnPortalHome.sections.onboard.search.p2.after}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} />

      <Box ref={sectionRefs.navbar} id="navbar" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
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
                {t.learnPortalHome.sections.navbar.title}
              </Typography>
              <Chip
                size="small"
                label={t.learnPortalHome.sections.navbar.badge}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.navbar.p1}
            </Typography>

            <Box
              sx={{
                flex: "0 0 75px",
                maxWidth: 880,
                mx: "auto",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <img
                src={navbarImg}
                alt={t.learnPortalHome.sections.navbar.image_alt}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedImage(navbarImg);
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.logo.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.logo.desc}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.home.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.home.desc}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.notifications.label}:
                </strong>{" "}
                {
                  t.learnPortalHome.sections.navbar.items.notifications.desc
                    .before
                }{" "}
                <Link href="/learn/profiles?view=3">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.notifications.link}
                  </strong>
                </Link>{" "}
                {
                  t.learnPortalHome.sections.navbar.items.notifications.desc
                    .after
                }
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.search.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.search.desc.before}{" "}
                <Link href="/learn/search">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.search.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.search.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.add_profile.label}:
                </strong>{" "}
                {
                  t.learnPortalHome.sections.navbar.items.add_profile.desc
                    .before
                }{" "}
                <Link href="/learn/profiles?view=2">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.add_profile.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.add_profile.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.my_profile.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.my_profile.desc.before}{" "}
                <Link href="/learn/profiles?view=3">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.my_profile.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.my_profile.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.map.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.map.desc.before}{" "}
                <Link href="/learn/portal-home?view=5">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.map.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.map.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.partners.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.partners.desc.before}{" "}
                <Link href="/partners">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.partners.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.partners.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.lang.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.lang.desc}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.help.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.help.desc.before}{" "}
                <Link href="/learn/users/">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.help.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.help.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.settings.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.settings.desc.before}{" "}
                <Link href="/learn/users/">
                  <strong>
                    {t.learnPortalHome.sections.navbar.items.settings.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.navbar.items.settings.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.logout.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.logout.desc}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.navbar.items.initial.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.navbar.items.initial.desc}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} />

      <Box ref={sectionRefs.map} id="map" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
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
                {t.learnPortalHome.sections.map.title}
              </Typography>
              <Chip size="small" label={t.learnPortalHome.sections.map.badge} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.map.p1}
            </Typography>

            <Box
              sx={{
                flex: "0 0 360px",
                maxWidth: 880,
                mx: "auto",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <img
                src={mapImg}
                alt={t.learnPortalHome.sections.map.image_alt}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedImage(mapImg);
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.map.p2.before}{" "}
              <Link href="/learn/places?view=1">
                <strong>{t.learnPortalHome.sections.map.p2.link_places}</strong>
              </Link>{" "}
              {t.learnPortalHome.sections.map.p2.mid}{" "}
              <Link href="/learn/profiles?view=1">
                <strong>
                  {t.learnPortalHome.sections.map.p2.link_profiles}
                </strong>
              </Link>{" "}
              {t.learnPortalHome.sections.map.p2.after}
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnPortalHome.sections.map.tips_title}
            </Typography>
    
            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                {t.learnPortalHome.sections.map.tip_density}
              </Typography>
              <Typography component="li" variant="body2">
                {t.learnPortalHome.sections.map.tip_zoom}
              </Typography>
              <Typography component="li" variant="body2">
                {t.learnPortalHome.sections.map.tip_click}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} />

      {/* SECTION 6 — Action buttons */}
      <Box ref={sectionRefs.actions} id="actions" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background:
              "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
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
                {t.learnPortalHome.sections.actions.title}
              </Typography>
              <Chip
                size="small"
                label={t.learnPortalHome.sections.actions.badge}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnPortalHome.sections.actions.p1}
            </Typography>

            <Box
              sx={{
                flex: "0 0 200px",
                maxWidth: 880,
                mx: "auto",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <img
                src={actionsImg}
                alt={t.learnPortalHome.sections.actions.image_alt}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedImage(actionsImg);
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.actions.items.tree.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.actions.items.tree.desc.before}{" "}
                <Link href="/learn/tree">
                  <strong>
                    {t.learnPortalHome.sections.actions.items.tree.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.actions.items.tree.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.actions.items.my_profile.label}:
                </strong>{" "}
                {
                  t.learnPortalHome.sections.actions.items.my_profile.desc
                    .before
                }{" "}
                <Link href="/learn/profiles?view=3">
                  <strong>
                    {t.learnPortalHome.sections.actions.items.my_profile.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.actions.items.my_profile.desc.after}
              </Typography>

              <Typography component="li" variant="body2">
                <strong>
                  {t.learnPortalHome.sections.actions.items.created.label}:
                </strong>{" "}
                {t.learnPortalHome.sections.actions.items.created.desc.before}{" "}
                <Link href="/learn/content">
                  <strong>
                    {t.learnPortalHome.sections.actions.items.created.link}
                  </strong>
                </Link>{" "}
                {t.learnPortalHome.sections.actions.items.created.desc.after}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ my: 1.5 }} />

{/* SECTION 7 — Three columns overview */}
<Box ref={sectionRefs.columns} id="columns" sx={{ scrollMarginTop: 84 }}>
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
    }}
  >
    <Stack spacing={1.2}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          data-heading
          tabIndex={-1}
          sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
        >
          {t.learnPortalHome.sections.columns.title}
        </Typography>
        <Chip size="small" label={t.learnPortalHome.sections.columns.badge} />
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {t.learnPortalHome.sections.columns.p1}
      </Typography>

      <Box
        sx={{
          flex: "0 0 360px",
          maxWidth: 880,
          mx: "auto",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <img
          src={columnsImg}
          alt={t.learnPortalHome.sections.columns.image_alt}
          style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
          onClick={() => { setSelectedImage(columnsImg); setImageViewerOpen(true); }}
        />
      </Box>

      <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
        <Typography component="li" variant="body2">
          <strong>{t.learnPortalHome.sections.columns.left.label}:</strong>{" "}
          {t.learnPortalHome.sections.columns.left.desc}
        </Typography>

        <Typography component="li" variant="body2">
          <strong>{t.learnPortalHome.sections.columns.center.label}:</strong>{" "}
          {t.learnPortalHome.sections.columns.center.desc}
        </Typography>

        <Typography component="li" variant="body2">
          <strong>{t.learnPortalHome.sections.columns.right.label}:</strong>{" "}
          {t.learnPortalHome.sections.columns.right.desc}
        </Typography>

        <Typography component="li" variant="body2">
          <strong>{t.learnPortalHome.sections.columns.cta_add.label}:</strong>{" "}
          {t.learnPortalHome.sections.columns.cta_add.desc.before}{" "}
          <Link href="/learn/profiles?view=2">
            <strong>{t.learnPortalHome.sections.columns.cta_add.link}</strong>
          </Link>{" "}
          {t.learnPortalHome.sections.columns.cta_add.desc.after}
        </Typography>
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
