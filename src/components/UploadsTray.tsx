// components/UploadsTray.tsx
"use client";

import { useUploads } from "@/context/UploadContext";
import {
  Drawer,
  Box,
  Stack,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function UploadsTray() {
  const { items, visible, closeTray, remove, summary, openErrors } = useUploads();
  const open = visible;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={closeTray}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 } } }}
    >
      <Box
        sx={{
          p: 2,
          borderRight: "1px solid",
          borderColor: "divider",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Uploads</Typography>
          <Tooltip title="Close">
            <IconButton size="small" onClick={closeTray}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Summary */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
          <Chip icon={<CloudUploadIcon />} size="small" label={`Left: ${summary.left}`}
            sx={{ height: 24, "& .MuiChip-label": { px: 0.75 } }} />
          <Chip size="small" label={`Uploading: ${summary.uploading}`}
            sx={{ height: 24, "& .MuiChip-label": { px: 0.75 } }} />
          <Chip size="small" label={`Queued: ${summary.queued}`}
            sx={{ height: 24, "& .MuiChip-label": { px: 0.75 } }} />
          <Chip size="small" icon={<DoneAllIcon />} label={`Done: ${summary.done}`}
            sx={{ height: 24, "& .MuiChip-label": { px: 0.75 } }} />
          <Chip size="small" color={summary.error > 0 ? "error" : "default"}
            icon={<ErrorOutlineIcon />} label={`Errors: ${summary.error}`}
            sx={{ height: 24, "& .MuiChip-label": { px: 0.75 }, cursor: "pointer" }}
            onClick={openErrors} />
        </Stack>

        <Divider sx={{ mb: 1 }} />

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {items.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No uploads yet.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {items.map((t) => {
                const isProcessingWithTotal = t.phase === "processing" && typeof t.total === "number" && t.total > 0;
                const pct = (t.phase === "uploading" || isProcessingWithTotal)
                  ? Math.min(100, Math.round((t.sent / (t.total || 1)) * 100))
                  : 0;

                let subtitle = "";
                if (t.phase === "uploading") subtitle = `Uploading ${pct}%`;
                if (t.phase === "queued") subtitle = "Queued for processing…";
                if (t.phase === "processing") {
                  subtitle = isProcessingWithTotal ? `Processing ${t.sent}/${t.total}` : "Processing…";
                }
                if (t.phase === "done") subtitle = "Completed";
                if (t.phase === "error") subtitle = t.error || "Error";

                return (
                  <Box key={t.id} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t.filename}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="caption" color={t.phase === "error" ? "error.main" : "text.secondary"}>
                            {subtitle}
                          </Typography>
                          {isProcessingWithTotal && (
                            <Chip size="small" label={`${t.total} pages`} sx={{ height: 20, "& .MuiChip-label": { px: 0.75 } }} />
                          )}
                        </Stack>
                      </Box>

                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => remove(t.id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {t.phase === "uploading" && (
                      <LinearProgress variant="determinate" value={pct} />
                    )}
                    {t.phase === "queued" && (
                      <LinearProgress variant="indeterminate" />
                    )}
                    {t.phase === "processing" && (
                      isProcessingWithTotal
                        ? <LinearProgress variant="determinate" value={pct} />
                        : <LinearProgress variant="indeterminate" />
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
