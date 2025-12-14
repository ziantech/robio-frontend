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
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useLanguage } from "@/context/LanguageContext";
import ImageViewer from "@/components/ImageViewer";

export default function LearnProfilesPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // sync scroll target via query (?view=1 -> "what")
  const [view, setView] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setView(sp.get("view"));
  }, []);

  const [selectedImage, setSelectedImage] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

const sectionRefs = {
  what: useRef<HTMLDivElement | null>(null),
  createAttach: useRef<HTMLDivElement | null>(null),
  profile: useRef<HTMLDivElement | null>(null), // ⬅️ NEW
   family: useRef<HTMLDivElement | null>(null),
} as const;


const targetRef = useMemo(() => {
  if (view === "1") return sectionRefs.what;
  if (view === "2") return sectionRefs.createAttach;
  if (view === "3") return sectionRefs.profile; // ⬅️ NEW
  if (view === "4") return sectionRefs.family;
  
  return null;
}, [view, sectionRefs.what, sectionRefs.createAttach, sectionRefs.profile, sectionRefs.family]);

  useEffect(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  const overviewImg = `/learn/profiles/profile-overview-${lang === "ro" ? "ro" : "en"}.png`;

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          {t.learnProfiles?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learnProfiles?.desc}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* SECTION 1 — What is a profile? */}
      <Box ref={sectionRefs.what} id="what" sx={{ scrollMarginTop: 84 }}>
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
                {t.learnProfiles?.what?.title}
              </Typography>
              <Chip
                size="small"
                label={
                  t.learnProfiles?.what?.badge
                
                }
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnProfiles?.what?.p1}
              
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t.learnProfiles?.what?.p2 }
            </Typography>

            {/* Overview image */}
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
                src={overviewImg}
                alt={
                  t.learnProfiles?.what?.image_alt ??
                  (lang === "ro" ? "Imagine de ansamblu profil" : "Profile overview")
                }
                style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
                onClick={() => {
                  setSelectedImage(overviewImg);
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            {/* Breakdown of the UI elements shown in the screenshot */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnProfiles?.what?.ui_title }
            </Typography>

            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>{lang === "ro" ? "Imaginea de profil" : "Profile picture"}:</strong>{" "}
                {t.learnProfiles?.what?.ui_picture }
              </Typography>

              <Typography component="li" variant="body2">
                <strong>{lang === "ro" ? "Numele" : "Name"}:</strong>{" "}
                {t.learnProfiles?.what?.ui_name }
              </Typography>

              <Typography component="li" variant="body2">
                <strong>{lang === "ro" ? "Datele de viață" : "Life dates"}:</strong>{" "}
                {t.learnProfiles?.what?.ui_life }
              </Typography>

              <Typography component="li" variant="body2">
                <strong>{lang === "ro" ? "Tree ref (ID)" : "Tree ref (ID)"}:</strong>{" "}
                {t.learnProfiles?.what?.ui_tree_ref }
              </Typography>

              <Typography component="li" variant="body2">
                <strong>{lang === "ro" ? "Bara de acțiuni" : "Action bar"}:</strong>{" "}
                {t.learnProfiles?.what?.ui_actions }
              </Typography>

              <Typography component="li" variant="body2">
                <strong>{lang === "ro" ? "Owner (deținător)" : "Owner"}:</strong>{" "}
                {t.learnProfiles?.what?.ui_owner }
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnProfiles?.what?.p3 }
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t.learnProfiles?.what?.p4 }
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t.learnProfiles?.what?.cta_next }
            </Typography>

        
          </Stack>
        </Paper>
      </Box>
     <Divider sx={{ my: 1.5 }} />
<Box ref={sectionRefs.createAttach} id="create-attach" sx={{ scrollMarginTop: 84 }}>
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
      {/* Heading + badge */}
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
          {t.learnProfiles?.sections.create_attach?.title}
        </Typography>
        <Chip
          size="small"
          label={t.learnProfiles?.sections.create_attach?.badge}
        />
      </Stack>

      {/* Subsection: Create form */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.create_attach?.form?.title}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" } as any}
        spacing={1.5}
        alignItems="stretch"
      >
        {/* Image: create form */}
        <Box
          sx={{
            flex: "0 0 360px",
            maxWidth: 680,
            mx: { xs: "auto", sm: 0 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/create-profile-form-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.create_attach?.form?.image_alt}
            style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
            onClick={() => {
              const img = `/learn/profiles/create-profile-form-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>

        {/* Text */}
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.create_attach?.form?.p1?.before}{" "}
            <Link href="/learn/places">
              <strong>{t.learnProfiles?.sections.create_attach?.form?.p1?.link}</strong>
            </Link>{" "}
            {t.learnProfiles?.sections.create_attach?.form?.p1?.after}
          </Typography>

          <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.create_attach?.form?.fields?.sex?.label}:</strong>{" "}
              {t.learnProfiles?.sections.create_attach?.form?.fields?.sex?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.create_attach?.form?.fields?.name?.label}:</strong>{" "}
              {t.learnProfiles?.sections.create_attach?.form?.fields?.name?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.create_attach?.form?.fields?.birth?.label}:</strong>{" "}
              {t.learnProfiles?.sections.create_attach?.form?.fields?.birth?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.create_attach?.form?.fields?.birthplace?.label}:</strong>{" "}
              {t.learnProfiles?.sections.create_attach?.form?.fields?.birthplace?.desc_before}{" "}
              <Link href="/learn/places">
                <strong>{t.learnProfiles?.sections.create_attach?.form?.fields?.birthplace?.desc_link}</strong>
              </Link>{" "}
              {t.learnProfiles?.sections.create_attach?.form?.fields?.birthplace?.desc_after}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.create_attach?.form?.fields?.deceased?.label}:</strong>{" "}
              {t.learnProfiles?.sections.create_attach?.form?.fields?.deceased?.desc}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      {/* Subsection: Attach existing */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.create_attach?.attach?.title}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" } as any}
        spacing={1.5}
        alignItems="stretch"
      >
        {/* Image: create or attach */}
        <Box
          sx={{
            flex: "0 0 360px",
            maxWidth: 680,
            mx: { xs: "auto", sm: 0 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/create-or-attach-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.create_attach?.attach?.image_alt}
            style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
            onClick={() => {
              const img = `/learn/profiles/create-or-attach-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>

        {/* Text */}
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.create_attach?.attach?.p1}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.create_attach?.attach?.p2}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      {/* Subsection: Duplicates */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.create_attach?.duplicates?.title}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" } as any}
        spacing={1.5}
        alignItems="stretch"
      >
        {/* Image: possible duplicates */}
        <Box
          sx={{
            flex: "0 0 360px",
            maxWidth: 680,
            mx: { xs: "auto", sm: 0 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/possible-duplicates-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.create_attach?.duplicates?.image_alt}
            style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
            onClick={() => {
              const img = `/learn/profiles/possible-duplicates-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>

        {/* Text */}
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.create_attach?.duplicates?.p1}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.create_attach?.duplicates?.p2}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.create_attach?.duplicates?.p3?.before}{" "}
            <Link href="/learn/tree">
              <strong>{t.learnProfiles?.sections.create_attach?.duplicates?.p3?.link}</strong>
            </Link>{" "}
            {t.learnProfiles?.sections.create_attach?.duplicates?.p3?.after}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  </Paper>
</Box>

<Divider sx={{ my: 1.5 }} />

{/* SECTION 3 — My profile / A profile (Ownership, Claim, About tab) */}
<Box ref={sectionRefs.profile} id="profile" sx={{ scrollMarginTop: 84 }}>
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
      {/* Heading + badge */}
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
          {t.learnProfiles?.sections.profile?.title}
        </Typography>
        <Chip size="small" label={t.learnProfiles?.sections.profile?.badge} />
      </Stack>

      {/* Intro */}
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.p1}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.p2}
      </Typography>

      {/* Owned vs Not-owned screenshots */}
      <Stack
        direction={{ xs: "column", sm: "row" } as any}
        spacing={1.5}
        alignItems="stretch"
      >
        {/* Owned */}
        <Box
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/profile-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.profile?.images?.owned_alt}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              cursor: "pointer",
            }}
            onClick={() => {
              const img = `/learn/profiles/profile-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>

        {/* Not owned */}
        <Box
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/not-owned-profile-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.profile?.images?.not_owned_alt}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              cursor: "pointer",
            }}
            onClick={() => {
              const img = `/learn/profiles/not-owned-profile-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>
      </Stack>

      {/* Claim flow */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.profile?.claim?.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.claim?.p1}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.claim?.p2}
      </Typography>

      <Divider sx={{ my: 1.25 }} />

      {/* About tab */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.profile?.about?.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.about?.p1}
      </Typography>

      <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
        <Typography component="li" variant="body2">
          <strong>{t.learnProfiles?.sections.profile?.about?.fields?.name?.label}:</strong>{" "}
          {t.learnProfiles?.sections.profile?.about?.fields?.name?.desc}
        </Typography>
        <Typography component="li" variant="body2">
          <strong>
            {t.learnProfiles?.sections.profile?.about?.fields?.ethnicity?.label}:
          </strong>{" "}
          {t.learnProfiles?.sections.profile?.about?.fields?.ethnicity?.desc}
        </Typography>
        <Typography component="li" variant="body2">
          <strong>
            {t.learnProfiles?.sections.profile?.about?.fields?.gender?.label}:
          </strong>{" "}
          {t.learnProfiles?.sections.profile?.about?.fields?.gender?.desc}
        </Typography>
        <Typography component="li" variant="body2">
          <strong>
            {t.learnProfiles?.sections.profile?.about?.fields?.birth?.label}:
          </strong>{" "}
          {t.learnProfiles?.sections.profile?.about?.fields?.birth?.desc}
        </Typography>
        <Typography component="li" variant="body2">
          <strong>
            {t.learnProfiles?.sections.profile?.about?.fields?.death?.label}:
          </strong>{" "}
          {t.learnProfiles?.sections.profile?.about?.fields?.death?.desc}
        </Typography>
        <Typography component="li" variant="body2">
          <strong>
            {t.learnProfiles?.sections.profile?.about?.fields?.burials?.label}:
          </strong>{" "}
          {t.learnProfiles?.sections.profile?.about?.fields?.burials?.desc}
        </Typography>
      </Stack>

      {/* Ownership vs Suggestions */}
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.about?.p2?.before}{" "}
        
         {t.learnProfiles?.sections.profile?.about?.p2?.link}
       
        {t.learnProfiles?.sections.profile?.about?.p2?.after}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.profile?.about?.p3}
      </Typography>
    </Stack>
  </Paper>
</Box>
<Divider sx={{ my: 1.5 }} />

{/* SECTION 4 — Family, Sources & Timeline */}
<Box ref={sectionRefs.family} id="family" sx={{ scrollMarginTop: 84 }}>
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
      {/* Heading + badge */}
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
          {t.learnProfiles?.sections.family?.title}
        </Typography>
        <Chip size="small" label={t.learnProfiles?.sections.family?.badge} />
      </Stack>

      {/* Intro */}
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.family?.p1}
      </Typography>

      {/* FAMILY sub-section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.family?.rel?.title}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" } as any}
        spacing={1.5}
        alignItems="stretch"
      >
        {/* Family image */}
        <Box
          sx={{
            flex: "0 0 360px",
            maxWidth: 680,
            mx: { xs: "auto", sm: 0 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/family-section-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.family?.rel?.image_alt}
            style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
            onClick={() => {
              const img = `/learn/profiles/family-section-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>

        {/* Text */}
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.family?.rel?.p1}
          </Typography>

          <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.family?.rel?.parents?.label}:</strong>{" "}
              {t.learnProfiles?.sections.family?.rel?.parents?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.family?.rel?.spouses?.label}:</strong>{" "}
              {t.learnProfiles?.sections.family?.rel?.spouses?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.family?.rel?.children?.label}:</strong>{" "}
              {t.learnProfiles?.sections.family?.rel?.children?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.family?.rel?.tips?.label}:</strong>{" "}
              {t.learnProfiles?.sections.family?.rel?.tips?.desc_before}{" "}
              <Link href="/learn/tree">
                <strong>{t.learnProfiles?.sections.family?.rel?.tips?.link}</strong>
              </Link>{" "}
              {t.learnProfiles?.sections.family?.rel?.tips?.desc_after}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      {/* SOURCES sub-section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.family?.sources?.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.family?.sources?.p1}
      </Typography>
   

      <Divider sx={{ my: 1.25 }} />

      {/* TIMELINE sub-section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {t.learnProfiles?.sections.family?.timeline?.title}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" } as any}
        spacing={1.5}
        alignItems="stretch"
      >
        {/* Timeline image */}
        <Box
          sx={{
            flex: "0 0 360px",
            maxWidth: 680,
            mx: { xs: "auto", sm: 0 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <img
            src={`/learn/profiles/timeline-${lang === "ro" ? "ro" : "en"}.png`}
            alt={t.learnProfiles?.sections.family?.timeline?.image_alt}
            style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
            onClick={() => {
              const img = `/learn/profiles/timeline-${lang === "ro" ? "ro" : "en"}.png`;
              setSelectedImage(img);
              setImageViewerOpen(true);
            }}
          />
        </Box>

        {/* Text */}
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t.learnProfiles?.sections.family?.timeline?.p1}
          </Typography>
          <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.family?.timeline?.items?.events?.label}:</strong>{" "}
              {t.learnProfiles?.sections.family?.timeline?.items?.events?.desc}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>{t.learnProfiles?.sections.family?.timeline?.items?.history?.label}:</strong>{" "}
              {t.learnProfiles?.sections.family?.timeline?.items?.history?.desc}
            </Typography>
       
          </Stack>
        </Stack>
      </Stack>

      {/* Closing note */}
      <Typography variant="body2" color="text.secondary">
        {t.learnProfiles?.sections.family?.p2}
      </Typography>
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
