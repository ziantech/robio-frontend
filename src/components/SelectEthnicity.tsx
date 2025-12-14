"use client";

import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Avatar,
} from "@mui/material";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { EthnicityOption } from "@/types/common";


interface EthnicitySelectProps {
  value: string; // ethnicity_id
  onChange: (
    id: string,
    name_en: string,
    name_ro: string,
    flag_url: string
  ) => void;
}


export const UNKNOWN_FLAG_URL =
  "https://robio-bucket.s3.eu-central-1.amazonaws.com/flags/necunoscut.png";

const EthnicitySelect: React.FC<EthnicitySelectProps> = ({
  value,
  onChange,
}) => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [ethnicities, setEthnicities] = useState<EthnicityOption[]>([]);

  useEffect(() => {
    const fetchEthnicities = async () => {
      try {
        const res = await api.get<EthnicityOption[]>("/users/ethnicities");
        setEthnicities(res.data);
      } catch (err) {
        console.error("Error fetching ethnicities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEthnicities();
  }, []);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={24} />
        <span>Loading ethnicities...</span>
      </Box>
    );
  }

  const selectedOption = ethnicities.find((e) => e.id === value) || null;

  return (
    <Autocomplete
      size="small"
      options={ethnicities}
      getOptionLabel={(option) => {
        
        return `${option.name_en} ${option.name_ro ? `(${option.name_ro})` : ""}`;
      }}
    
      value={selectedOption}
     onChange={(_, newValue) => {
  if (newValue) {
    onChange(
      newValue.id,
      newValue.name_en,
      newValue.name_ro,
      newValue.flag_url
    );
  } else {
    onChange("", "", "", UNKNOWN_FLAG_URL);
  }
}}
      renderOption={(props, option) => (
        <Box
         
          component="li"
          {...props}
          display="flex"
          alignItems="center"
          gap={1}
           key={option.id}
        >
          <Avatar
            src={option.flag_url || UNKNOWN_FLAG_URL}
            sx={{ width: 24, height: 16, borderRadius: 0 }}
            variant="square"
            key={option.flag_url}
          />
          {`${option.name_en} ${option.name_ro && `(${option.name_ro})`}`}
      
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={lang === "ro" ? "Etnie" : "Ethnicity"}
          placeholder={
            lang === "ro"
              ? "Selectează etnia"
              : "Select ethnicity"
          }
        />
      )}
    />
  );
};

export default EthnicitySelect;
