"use client";

import React from "react";
import {
  Box,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";

interface DateObject {
  day?: number;
  month?: number;
  year: number;
  circa: boolean;
}

interface Props {
  label?: string;
  value: DateObject;
  onChange: (val: DateObject) => void;
}

const daysInMonth = (month: number): number => {
  const thirtyDays = [4, 6, 9, 11];
  if (month === 2) return 29; // Max for leap years
  return thirtyDays.includes(month) ? 30 : 31;
};

const SelectDate: React.FC<Props> = ({ value, onChange, label }) => {
  const { t } = useLanguage();

  const handleFieldChange =
    (field: keyof DateObject) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val =
        field === "year"
          ? parseInt(e.target.value || "0", 10)
          : parseInt(e.target.value || "", 10);

      onChange({ ...value, [field]: isNaN(val) ? undefined : val });
    };

  const handleCircaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, circa: e.target.checked });
  };

  const monthNames = [
    t.month_january,
    t.month_february,
    t.month_march,
    t.month_april,
    t.month_may,
    t.month_june,
    t.month_july,
    t.month_august,
    t.month_september,
    t.month_october,
    t.month_november,
    t.month_december,
  ];

  return (
    <Box display="grid" gap={2}>
      {label && (
        <Typography fontWeight={600} variant="body1">
          {label}
        </Typography>
      )}

      <TextField
        fullWidth
        type="number"
        label={t.year}
        value={value.year || ""}
        onChange={handleFieldChange("year")}
      />

      <TextField
        fullWidth
        select
        label={t.month}
        value={value.month || ""}
        onChange={handleFieldChange("month")}
      >
        {monthNames.map((name, index) => (
          <MenuItem key={index + 1} value={index + 1}>
            {name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        select
        label={t.day}
        value={value.day || ""}
        onChange={handleFieldChange("day")}
        disabled={!value.month}
      >
        {[...Array(value.month ? daysInMonth(value.month) : 31).keys()].map((d) => (
          <MenuItem key={d + 1} value={d + 1}>
            {d + 1}
          </MenuItem>
        ))}
      </TextField>

      <FormControlLabel
        control={
          <Checkbox
            checked={value.circa}
            onChange={handleCircaChange}
          />
        }
        label={t.circa}
      />
    </Box>
  );
};

export default SelectDate;
