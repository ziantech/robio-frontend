/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Autocomplete,
  Box,
  Chip,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import { useRef } from "react";
import { SexEnum, NewUser } from "@/types/user";

interface Props {
  user: NewUser;
  setUser: (data: NewUser) => void;
}

const Step2Profile: React.FC<Props> = ({ user, setUser }) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, sex: e.target.value as SexEnum });
  };

  const handleSimpleNameChange =
    (field: keyof NewUser["name"]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUser({
        ...user,
        name: { ...user.name, [field]: e.target.value },
      });
    };

  const handleNameListChange =
    (field: "first" |  "alternative") =>
    (_: any, value: string[]) => {
      setUser({
        ...user,
        name: {
          ...user.name,
          [field]: value.map((s) => s.trim()).filter(Boolean),
        },
      });
    };

const handleCommaInput =
  (field: "first"  | "alternative") =>
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    if (e.key === "Enter" && val?.trim()) {
      e.preventDefault();
      const cleanVal = val.trim().replace(/,$/, "");
      const currentList = user.name[field];
      if (!currentList?.includes(cleanVal)) {
        handleNameListChange(field)(null, [...currentList!, cleanVal]);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.value = "";
        }, 10);
      }
    }
  };

  return (
    <Box display="grid" gap={2}>
      <Typography variant="h5" fontWeight={600}>
        {t.step2_title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t.step2_description}
      </Typography>

      <TextField
        select
        label={t.sex_label}
        fullWidth
        value={user.sex || ""}
        onChange={handleSexChange}
      >
        <MenuItem value="male">{t.sex_male}</MenuItem>
        <MenuItem value="female">{t.sex_female}</MenuItem>
        <MenuItem value="unknown">{t.sex_unknown}</MenuItem>
      </TextField>

      <TextField
        fullWidth
        label={t.name_title}
        value={user.name.title}
        onChange={handleSimpleNameChange("title")}
      />

      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={user.name.first}
        onChange={handleNameListChange("first")}
        renderTags={(value: string[], getTagProps) =>
          value.map((option, index) => (
            <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t.name_first}
            placeholder={t.name_multi_hint}
            inputRef={inputRef}
            onKeyDown={handleCommaInput("first")}
          />
        )}
      />

    
      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={user.name.alternative}
        onChange={handleNameListChange("alternative")}
        renderTags={(value: string[], getTagProps) =>
          value.map((option, index) => (
            <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t.name_alternative}
            placeholder={t.name_multi_hint}
            onKeyDown={handleCommaInput("alternative")}
          />
        )}
      />

      <TextField
        fullWidth
        label={t.name_last}
        value={user.name.last}
        onChange={handleSimpleNameChange("last")}
      />

      {user.sex === "female" && (
        <TextField
          fullWidth
          label={t.name_maiden}
          value={user.name.maiden || ""}
          onChange={handleSimpleNameChange("maiden")}
        />
      )}

      <TextField
        fullWidth
        label={t.name_suffix}
        value={user.name.suffix}
        onChange={handleSimpleNameChange("suffix")}
      />
    </Box>
  );
};

export default Step2Profile;
