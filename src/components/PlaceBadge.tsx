"use client";
import { Chip } from "@mui/material";

export default function PlaceBadge({ historical }: { historical?: boolean }) {
  if (!historical) return null;
  return <Chip size="small" label="historical" variant="outlined" />;
}
