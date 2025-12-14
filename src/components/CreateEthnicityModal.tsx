/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Typography
} from "@mui/material";
import { useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

type EthnicityHit = {
  id: string;
  name_en: string;
  name_ro: string;
  flag_url?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (eth: EthnicityHit) => void;
}

const UNKNOWN_FLAG =
  "https://robio-bucket.s3.eu-central-1.amazonaws.com/flags/necunoscut.png";


export default function CreateEthnicityModal({ open, onClose, onCreated }: Props) {
  const { lang } = useLanguage() as any;
  const label = (en:string, ro:string)=> (lang==="ro"?ro:en);

  const [nameEn, setNameEn] = useState("");
  const [nameRo, setNameRo] = useState("");
  const [flagFile, setFlagFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);

 const handleCreate = async () => {
  if (!nameEn || !nameRo || uploading) return;
  try {
    setUploading(true);
    let flag_url: string | undefined;

    if (flagFile) {
      const fd = new FormData();
      fd.append("file", flagFile);
      // ⬇️ trimitem și numele în engleză ca să-l folosim la prefix/slug pe backend
      fd.append("name_en", nameEn.trim());

      const up = await api.post("/profiles/ethnicities/upload_flag", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      flag_url = up.data.url;
    } else {
      // ⬇️ fallback dacă nu există fișier
      flag_url = UNKNOWN_FLAG;
    }

    const res = await api.post("/profiles/ethnicities", {
      name_en: nameEn.trim(),
      name_ro: nameRo.trim(),
      flag_url,
    });

    onCreated(res.data);
    onClose();
  } catch (e) {
    console.error("Create ethnicity failed", e);
  } finally {
    setUploading(false);
  }
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{label("Create Ethnicity", "Creează etnie")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label={label("Name (English)","Nume (Engleză)")}
            value={nameEn}
            size="small"
            onChange={(e)=>setNameEn(e.target.value)}
            fullWidth required
          />
          <TextField
            label={label("Name (Romanian)","Nume (Română)")}
            value={nameRo}
             size="small"
            onChange={(e)=>setNameRo(e.target.value)}
            fullWidth required
          />

          <Stack direction="row" alignItems="center" gap={2}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              {label("Upload flag", "Încarcă steag")}
              <input type="file" hidden accept="image/*" onChange={(e)=>setFlagFile(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {flagFile ? flagFile.name : label("No file selected","Niciun fișier selectat")}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{label("Cancel","Anulează")}</Button>
        <Button onClick={handleCreate} disabled={!nameEn || !nameRo || uploading} variant="contained">
          {label("Create","Creează")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
