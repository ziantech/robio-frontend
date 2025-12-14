"use client";

import { useMemo } from "react";
import { Fab, Badge, Tooltip } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useUploads } from "@/context/UploadContext";

export default function UploadsFab({ side = "left" }: { side?: "left" | "right" }) {
  const { items, openTray } = useUploads();

  const active = useMemo(
    () =>
      items.filter(
        (i) => i.phase === "uploading" || i.phase === "queued" || i.phase === "processing"
      ).length,
    [items]
  );

  return (
    <Tooltip title="Open uploads">
      <Badge color={active ? "primary" : "default"} badgeContent={active || null} overlap="circular">
        <Fab
          onClick={openTray}
          size="medium"
          sx={{
            position: "fixed",
            bottom: { xs: 88, sm: 24 }, // lasă loc de bottom-nav pe mobil
            [side]: 24,
            zIndex: (t) => t.zIndex.modal + 1, // stă peste chat
          }}
        >
          <CloudUploadIcon />
        </Fab>
      </Badge>
    </Tooltip>
  );
}
