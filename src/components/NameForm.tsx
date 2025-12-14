/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Autocomplete, Box, Chip, TextField } from "@mui/material";
import { useRef, useState } from "react";
import { NameObject, SexEnum } from "@/types/user";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  name: NameObject;
  sex?: SexEnum;
  onChange: (updatedName: NameObject) => void;
}

const NameForm: React.FC<Props> = ({ name, sex, onChange }) => {
  const { t } = useLanguage();

  // input text controlat pt. fiecare câmp (first/last)
  const [firstInput, setFirstInput] = useState("");
  const [lastInput, setLastInput] = useState("");

  const firstRef = useRef<HTMLInputElement | null>(null);
  const lastRef = useRef<HTMLInputElement | null>(null);

  const handleSimpleChange =
    (field: keyof NameObject) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...name, [field]: e.target.value });
    };

  const handleListChange =
    (field: "first" | "last") =>
    (_: any, value: string[]) => {
      onChange({
        ...name,
        [field]: value.map((v) => v.trim()).filter(Boolean),
      });
    };

  // separatori: spațiu, virgulă, punct, ; : / |
  const splitTokens = (raw: string) =>
    raw
      .split(/[,\.\s;:\/|]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

  const addTokensToField = (field: "first" | "last", raw: string) => {
    const tokens = splitTokens(raw);
    if (tokens.length === 0) return;

    const current = (name[field] || []) as string[];
    const next = [...current];

    tokens.forEach((tok) => {
      if (!next.includes(tok)) next.push(tok);
    });

    onChange({ ...name, [field]: next });
  };

  // Acceptă textul rămas în input la Enter/Tab/Blur
  const acceptPending = (field: "first" | "last") => {
    const raw = field === "first" ? firstInput : lastInput;
    if (!raw.trim()) return;
    addTokensToField(field, raw);
    if (field === "first") setFirstInput("");
    else setLastInput("");
  };

  const handleKeyDown =
    (field: "first" | "last") =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        acceptPending(field);
      } else if (e.key === "Tab") {
        // nu blocăm Tab, doar acceptăm inputul înainte să pierdem focusul
        acceptPending(field);
      }
    };

  const handleBlur =
    (field: "first" | "last") =>
    () => {
      // la click în afara câmpului
      acceptPending(field);
    };

  const handleInputChange =
    (field: "first" | "last") =>
    (_: any, value: string, reason: string) => {
      // "input" când tastezi, "reset"/"clear" când se modifică din alte motive
      if (field === "first") setFirstInput(value);
      else setLastInput(value);
    };

  return (
    <Box display="grid" gap={2}>
      <TextField
        fullWidth
        label={t.name_title}
        size="small"
        value={name.title || ""}
        onChange={handleSimpleChange("title")}
      />

      {/* Prenume */}
      <Autocomplete
        multiple
        freeSolo
        size="small"
        options={[]}
        value={name.first as string[]}
        inputValue={firstInput}
        onInputChange={handleInputChange("first")}
        onChange={handleListChange("first")}
        renderTags={(value: string[], getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option}
              variant="outlined"
              {...getTagProps({ index })}
              key={`${option}-${index}`}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t.name_first}
            placeholder={t.name_multi_hint}
            inputRef={firstRef}
            onKeyDown={handleKeyDown("first")}
            onBlur={handleBlur("first")}
          />
        )}
      />

      {/* Nume de familie */}
      <Autocomplete
        multiple
        freeSolo
        size="small"
        options={[]}
        value={name.last as string[]}
        inputValue={lastInput}
        onInputChange={handleInputChange("last")}
        onChange={handleListChange("last")}
        renderTags={(value: string[], getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option}
              variant="outlined"
              {...getTagProps({ index })}
              key={`${option}-${index}`}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t.name_last}
            placeholder={t.name_multi_hint2}
            inputRef={lastRef}
            onKeyDown={handleKeyDown("last")}
            onBlur={handleBlur("last")}
          />
        )}
      />

      {sex === "female" && (
        <TextField
          fullWidth
          size="small"
          label={t.name_maiden}
          value={name.maiden || ""}
          onChange={handleSimpleChange("maiden")}
        />
      )}

      <TextField
        fullWidth
          size="small"
        label={t.name_suffix}
        value={name.suffix || ""}
        onChange={handleSimpleChange("suffix")}
      />
    </Box>
  );
};

export default NameForm;
