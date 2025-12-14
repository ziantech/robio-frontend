/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  ListItemButton,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useNotify } from "@/context/NotifyContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import { useUploads } from "@/context/UploadContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onSourceCreated: (sourceId: string) => void;
  autoApprove?: boolean;
}

interface SourceFileMini {
  id: string;
  url: string;
  filename?: string | null;
  status?: "unprocessed" | "processing" | "processed" | null;
}
interface SourceSuggestion {
  id: string;
  title: string;
  volume?: string;
  year?: number;
  files: SourceFileMini[];
}

export default function CreateSourceModal({
  open,
  onClose,
  onSourceCreated,
  autoApprove = true,
}: Props) {
  const [title, setTitle] = useState("");
  const [volume, setVolume] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState<SourceSuggestion[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const { t, lang } = useLanguage();
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const notify = useNotify();
  const [createdSource, setCreatedSource] = useState<SourceSuggestion | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // <<< Uploads context: folosim enqueueFiles + openTray >>>
  const { enqueueFiles, openTray } = useUploads();

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const list = Array.from(e.target.files ?? []);
    if (list.length === 0) {
      setFiles([]);
      setIsPdfMode(false);
      return;
    }

    const firstPdf = list.find((f) => f.type === "application/pdf");
    if (firstPdf) {
      if (list.length > 1) {
        setFileError(
          lang === "ro"
            ? "Ai selectat un PDF. Poți încărca un singur PDF o dată."
            : "You selected a PDF. You can upload a single PDF at a time."
        );
      }
      setFiles([firstPdf]);
      setIsPdfMode(true);
      return;
    }

    const imgs = list.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) {
      setFileError(lang === "ro" ? "Format neacceptat." : "Unsupported file type.");
      setFiles([]);
      setIsPdfMode(false);
      return;
    }
    setFiles(imgs);
    setIsPdfMode(false);
  };

  useEffect(() => {
    if (!title || title.length < 3) {
      setSuggestions([]);
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/sources/search", { params: { q: title } });
        setSuggestions(res.data || []);
      } catch (err) {
        console.error("Error searching sources:", err);
      }
    }, 400);
    setDebounceTimer(timer);
  }, [title]);

  const resetForm = () => {
    setTitle("");
    setVolume("");
    setYear("");
    setFiles([]);
    setIsPdfMode(false);
    setLink("");
    setLocation("");
    setFileError(null);
    setSuggestions([]);
    setCreatedSource(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async () => {
    if (!title || uploading) return;
    if (files.length === 0 && !link.trim()) {
      notify(
        lang === "ro"
          ? "Adaugă cel puțin un fișier sau un link."
          : "Please provide at least one file or a link.",
        "error"
      );
      return;
    }

    try {
      setUploading(true);
      const createRes = await api.post("/sources/create", {
        title,
        volume: volume || undefined,
        year: year || undefined,
        files: [],
        link: link.trim() || undefined,
        location: location || undefined,
        auto_approve: !!autoApprove,
      });
      const src = createRes.data;
      onSourceCreated(`s:${src.id}`);
      // <<< Înlocuit startUpload cu enqueueFiles >>>
      if (files.length > 0) {
        enqueueFiles(files, src.id);
        openTray();
      }

      resetForm();
      onClose();
      notify(
        lang === "ro"
          ? "Fișierele au fost încărcate. Se procesează în fundal."
          : "Files uploaded. Processing in background."
      );
    } catch (err) {
      console.error(err);
      notify(lang === "ro" ? "Eroare la încărcare." : "Upload error.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSuggestionClick = (source: SourceSuggestion) => {
    onSourceCreated(source.id);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (uploading) return;
        resetForm();
        onClose();
      }}
      disableEscapeKeyDown={uploading}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{t.add_source}</DialogTitle>
      <DialogContent>
        {uploading && (
          <>
            <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(255,255,255,0.7)",
                display: "grid",
                placeItems: "center",
                zIndex: 1,
              }}
            >
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress />
                <Typography variant="body2" sx={{ px: 2, textAlign: "center" }}>
                  {lang === "ro"
                    ? "Se încarcă și se procesează fișierul. Te rugăm să nu închizi această fereastră."
                    : "Uploading and processing file. Please do not close this window."}
                </Typography>
              </Stack>
            </Box>
          </>
        )}

        <Stack spacing={2} mt={1}>
          {createdSource && (
            <>
              <Typography variant="subtitle2">
                {lang === "ro" ? "Colecție creată" : "Created collection"}
              </Typography>
              <List dense sx={{ mt: 0.5 }}>
                <ListItem
                  disablePadding
                  sx={{ flexDirection: "column", alignItems: "stretch" }}
                >
                  <ListItemButton
                    onClick={() => {
                      onSourceCreated(`s:${createdSource.id}`);
                      onClose();
                    }}
                    sx={(theme) => ({
                      borderRadius: 1,
                      ...((createdSource?.files?.length ?? 0) > 0 && {
                        backgroundColor: alpha(theme.palette.primary.main, 0.07),
                      }),
                    })}
                  >
                    <ListItemText
                      primary={createdSource.title}
                      secondary={
                        [
                          createdSource.volume ? `Vol: ${createdSource.volume}` : null,
                          createdSource.year
                            ? `${lang === "ro" ? "An:" : "Yr:"} ${createdSource.year}`
                            : null,
                          (createdSource.files?.length ?? 0) > 0
                            ? `${lang === "ro" ? "Fișiere:" : "Files:"} ${
                                createdSource.files.length
                              }`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")
                      }
                    />
                  </ListItemButton>

                  {createdSource.files?.length ? (
                    <Accordion sx={{ width: "100%" }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">
                          {lang === "ro"
                            ? "Alege un fișier din colecția creată"
                            : "Pick a file from the new collection"}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {createdSource.files.map((f, idx) => (
                            <ListItem
                              key={f.id}
                              disablePadding
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(f.url, "_blank");
                                  }}
                                  size="small"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemButton
                                onClick={() => {
                                  onSourceCreated(`sf:${f.id}`);
                                  onClose();
                                }}
                              >
                                <ListItemText
                                  primary={f.filename || `File ${idx + 1}`}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ) : null}
                </ListItem>
              </List>
            </>
          )}

          <TextField
            label={t.title}
            value={title}
            size="small"
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          {suggestions.length > 0 && (
            <>
              <Typography variant="subtitle2">{t.existing_sources}</Typography>
              <List dense>
                {suggestions.map((source) => (
                  <ListItem
                    key={source.id}
                    disablePadding
                    sx={{ flexDirection: "column", alignItems: "stretch", mt: 1 }}
                  >
                    <ListItemButton
                      onClick={() => {
                        onSourceCreated(`s:${source.id}`);
                        onClose();
                      }}
                      sx={(theme) => ({
                        borderRadius: 1,
                        ...((source?.files?.length ?? 0) > 0 && {
                          backgroundColor: alpha(theme.palette.primary.main, 0.07),
                        }),
                      })}
                    >
                      <ListItemText
                        primary={source.title}
                        secondary={
                          [
                            source.volume
                              ? `${lang === "ro" ? "Vol:" : "Vol:"} ${source.volume}`
                              : null,
                            source.year
                              ? `${lang === "ro" ? "An:" : "Yr:"} ${source.year}`
                              : null,
                            (source.files?.length ?? 0) > 0
                              ? `${lang === "ro" ? "Fișiere:" : "Files:"} ${
                                  source.files.length
                                }`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/portal/sources/${source.id}`, "_blank");
                          }}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>

                    {source.files?.length ? (
                      <Accordion sx={{ width: "100%" }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2">
                            {lang === "ro"
                              ? "Alege un fișier din colecție"
                              : "Pick a file in this collection"}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {source.files.map((f, idx) => (
                              <ListItem
                                key={f.id}
                                disablePadding
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(f.url, "_blank");
                                    }}
                                    size="small"
                                    title={lang === "ro" ? "Deschide fișier" : "Open file"}
                                  >
                                    <OpenInNewIcon fontSize="small" />
                                  </IconButton>
                                }
                              >
                                <ListItemButton
                                  onClick={() => {
                                    onSourceCreated(`sf:${f.id}`);
                                    onClose();
                                  }}
                                >
                                  <ListItemText
                                    primary={f.filename || `File ${idx + 1}`}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ) : null}
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <TextField
            label={t.volume}
            value={volume}
            size="small"
            onChange={(e) => setVolume(e.target.value)}
            fullWidth
          />
          <TextField
            label={t.year}
            type="number"
            size="small"
            value={year}
            onChange={(e) =>
              setYear(e.target.value === "" ? "" : parseInt(e.target.value))
            }
            fullWidth
          />
          <TextField
            label={t.link || "Link"}
            value={link}
            size="small"
            onChange={(e) => setLink(e.target.value)}
            fullWidth
            placeholder="https://…"
            inputProps={{ inputMode: "url" }}
          />
          <TextField
            label={t.location || "Locație"}
            value={location}
            size="small"
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            placeholder={t.location_placeholder || "Arad, RO / Biblioteca X / Arhiva Y"}
          />

          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
            {t.upload_files || "Upload files"}
            <input
              type="file"
              ref={fileInputRef}
              hidden
              multiple={!isPdfMode}
              onChange={handleFilesChange}
              accept="image/*,application/pdf"
            />
          </Button>

          {files.length > 0 && (
            <>
              <Typography variant="subtitle2">
                {t.files_selected || "Selected files"}:
              </Typography>
              <List dense>
                {files.map((f) => (
                  <ListItem key={f.name}>
                    <ListItemText
                      primary={f.name}
                      secondary={
                        (f.type === "application/pdf"
                          ? lang === "ro"
                            ? "PDF — va fi împărțit pe pagini"
                            : "PDF — will be split by pages"
                          : f.type || "unknown") +
                        ` • ${(f.size / 1024 / 1024).toFixed(1)} MB`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {fileError && (
            <Typography variant="caption" color="error">
              {fileError}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={handleCreate} disabled={!title || uploading}>
          {t.create_source}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
