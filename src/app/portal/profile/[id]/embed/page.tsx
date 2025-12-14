// app/portal/profile/[tree_ref]/embed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Avatar, CircularProgress } from "@mui/material";
import api from "@/lib/api";
import { formatDateObject } from "@/utils/formatDateObject";
import { useLanguage } from "@/context/LanguageContext";
import { Profile } from "@/types/profiles";


export default function EmbedProfile() {
  const { tree_ref } = useParams();
  const { lang } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tree_ref) return;
    const fetchData = async () => {
      try {
        const res = await api.get(`/profiles/get_basic_info/${tree_ref}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load embed profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tree_ref]);

  if (loading || !profile) {
    return (
      <Box p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }const birthStr = profile?.birth?.date
    ? formatDateObject(profile.birth.date, lang, "birth")
    : lang === "ro"
    ? "Data nașterii necunoscută"
    : "Birth date unknown";

  const deathStr = profile?.death?.date
    ? formatDateObject(profile.death.date, lang, "death")
    : lang === "ro"
    ? "În viață"
    : "Living";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        border: "1px solid #ccc",
        borderRadius: 2,
        width: 400,
        height: 180,
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: "#fafafa",
        fontFamily: "Arial",
      }}
    >
      <Avatar
        src={profile.picture_url || undefined}
        sx={{ width: 64, height: 64 }}
      />
      <Box>
        <Typography fontWeight={600}>
          {profile.name.first.join(" ")} {profile.name.last}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {birthStr} – {deathStr}
        </Typography>
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          {lang === "ro"
            ? "Vezi arborele complet pe Robio"
            : "View full tree on Robio"}
        </Typography>
      </Box>
    </Box>
  );
}
