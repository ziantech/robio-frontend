// components/UploadErrorModal.tsx
"use client";

import { useUploads } from "@/context/UploadContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ClearAllIcon from "@mui/icons-material/ClearAll";

export default function UploadErrorModal() {
  const { errorModalOpen, closeErrors, clearErrors, errors } = useUploads();

  const handleCopy = async () => {
    const text = errors.map((e) => `[${e.whenISO}] ${e.filename}: ${e.message}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* noop */
    }
  };

  return (
    <Dialog open={errorModalOpen} onClose={closeErrors} fullWidth maxWidth="sm">
      <DialogTitle>Upload Errors</DialogTitle>

      <DialogContent dividers>
        {errors.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No errors.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {errors.map((err) => (
              <Box
                key={err.id + err.whenISO}
                sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {err.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {new Date(err.whenISO).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="error.main">
                  {err.message}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Tooltip title="Copy all">
          <IconButton onClick={handleCopy} size="small">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear">
          <IconButton onClick={clearErrors} size="small">
            <ClearAllIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button onClick={closeErrors} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
