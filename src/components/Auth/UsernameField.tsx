import { useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";

const ONLY = /^[a-z0-9]+$/;

export default function UsernameTextField({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useLanguage();
  const [availability, setAvailability] = useState<null | boolean>(null);

  // sanitize as user types: keep a-z0-9, force lowercase
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target as HTMLInputElement;
    const sanitized = el.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (el.value !== sanitized) {
      el.value = sanitized; // mutate target before passing up
    }
    onChange(e);
  };

  useEffect(() => {
    // don't hit API for empty or invalid
    if (!value || !ONLY.test(value)) {
      setAvailability(null);
      return;
    }

    const delay = setTimeout(() => {
      api
        .get("/users/check-username", { params: { username: value } })
        .then((res) => setAvailability(Boolean(res.data?.available)))
        .catch(() => setAvailability(null));
    }, 500);

    return () => clearTimeout(delay);
  }, [value]);

  return (
    <TextField
      fullWidth
      type="text"
      label={t.username}
      variant="outlined"
      value={value}
      onChange={handleChange}
      error={availability === false}
      helperText={
        !value
          ? ""
          : !ONLY.test(value)
          ? (t.username_rules as string) || "Use only a–z and 0–9."
          : availability === false
          ? t.username_taken
          : availability === true
          ? t.username_available
          : ""
      }
      color={availability === true ? "success" : undefined}
      inputProps={{
        inputMode: "text",
        pattern: "[a-z0-9]*",
        autoComplete: "off",
        spellCheck: false,
      }}
    />
  );
}
