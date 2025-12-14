/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DateObject } from "@/types/common";

interface Props {
  value: DateObject;
  onChange: (val: DateObject) => void;
  label?: string;
  inlineControls: boolean; // REQUIRED
}

const SelectDate: React.FC<Props> = ({ value, onChange, label, inlineControls }) => {
  const { t, lang } = useLanguage();
  const [days, setDays] = useState<number[]>([]);

  const monthKeys = [
    "month_january","month_february","month_march","month_april","month_may","month_june",
    "month_july","month_august","month_september","month_october","month_november","month_december",
  ];

  const getMonthLabel = (index: number) =>
    (t as unknown as Record<string, string>)[monthKeys[index]] || (index + 1).toString();

  const getDaysInMonth = (month?: number, year?: number): number[] => {
    if (!month || !year) return [];
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysPerMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return Array.from({ length: daysPerMonth[month - 1] }, (_, i) => i + 1);
  };

  useEffect(() => {
    setDays(getDaysInMonth(value.month, value.year));
  }, [value.month, value.year]);

  const handleChange = (field: keyof DateObject) => (e: any) => {
    const raw = e.target.value;
    const num = typeof raw === "number" ? raw : parseInt(raw, 10);
    const updated: DateObject = { ...value, [field]: isNaN(num) ? undefined : num };

    if (field === "month" || field === "year") {
      const validDays = getDaysInMonth(updated.month, updated.year);
      updated.day =
        updated.day && validDays.includes(updated.day)
          ? updated.day
          : undefined;
    }
    onChange(updated);
  };

  const toggle =
    (field: "circa" | "bc" | "before" | "after") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [field]: e.target.checked });

  // mici helperi pentru stiluri consistente
  const inputSx = { minWidth: 120, flex: "1 1 140px" };
  const checkboxLabelSx = { ".MuiFormControlLabel-label": { fontSize: 13 } };

  const Inputs = (
    <Box display="flex" gap={1} flexWrap="nowrap">
      <TextField
        type="number"
        size="small"
        label={t.year}
        value={value.year ?? ""}
        onChange={handleChange("year")}
        sx={inputSx}
      />
      <Select
        displayEmpty
        size="small"
        value={value.month ?? ""}
        onChange={handleChange("month")}
        renderValue={(val) => (val ? getMonthLabel((val as number) - 1) : t.month)}
        sx={inputSx}
      >
        <MenuItem value="">{t.month}</MenuItem>
        {monthKeys.map((key, i) => (
          <MenuItem key={key} value={i + 1}>
            {(t as unknown as Record<string, string>)[key]}
          </MenuItem>
        ))}
      </Select>
      <Select
        displayEmpty
        size="small"
        value={value.day ?? ""}
        onChange={handleChange("day")}
        renderValue={(val) => (val ? (val as number) : t.day)}
        sx={inputSx}
      >
        <MenuItem value="">{t.day}</MenuItem>
        {days.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );

  const Checks = (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      <FormControlLabel
        sx={checkboxLabelSx}
        control={<Checkbox size="small" checked={!!value.circa} onChange={toggle("circa")} />}
        label={t.circa}
      />
      <FormControlLabel
        sx={checkboxLabelSx}
        control={<Checkbox size="small" checked={!!value.bc} onChange={toggle("bc")} />}
        label={t.bc}
      />
      <FormControlLabel
        sx={checkboxLabelSx}
        control={<Checkbox size="small" checked={!!value.before} onChange={toggle("before")} />}
        label={lang === "ro" ? "în." : "bef."}
      />
      <FormControlLabel
        sx={checkboxLabelSx}
        control={<Checkbox size="small" checked={!!value.after} onChange={toggle("after")} />}
        label={lang === "ro" ? "d." : "aft."}
      />
    </Box>
  );

  return (
    <Box display="grid" gap={1.5}>
      {label && <Typography fontWeight={500}>{label}</Typography>}

      {inlineControls ? (
        // 1) inline: un singur container flex; dacă nu încape, Checks trece dedesubt automat
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
          {/* grupul de inputs ca prim item */}
          <Box display="flex" gap={1} flexWrap="nowrap">
            {Inputs}
          </Box>
          {/* grupul de checkbox-uri ca al doilea item; va „cădea” pe rândul 2 dacă nu încape */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {Checks}
          </Box>
        </Box>
      ) : (
        // 2) non-inline: prima linie = inputs, a doua linie = checks (full width)
        <>
          <Box display="flex" gap={1} flexWrap="nowrap">
            {Inputs}
          </Box>
          <Box>{Checks}</Box>
        </>
      )}
    </Box>
  );
};

export default SelectDate;
