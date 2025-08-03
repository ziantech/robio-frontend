import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';

export default function UsernameTextField({ value, onChange }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useLanguage();
  const [availability, setAvailability] = useState<null | boolean>(null);

  useEffect(() => {
    if (!value) {
      setAvailability(null);
      return;
    }

    const delay = setTimeout(() => {
      api
        .get('/users/check-username', { params: { username: value } })
        .then((res) => {
          setAvailability(res.data.available);
        })
        .catch(() => {
          setAvailability(null); // or show an error
        });
    }, 500); // 500ms after last keystroke

    return () => clearTimeout(delay);
  }, [value]);

  return (
    <TextField
      fullWidth
      type="text"
      label={t.username}
      variant="outlined"
      value={value}
      onChange={onChange}
      error={availability === false}
      helperText={
        availability === false
          ? t.username_taken
          : availability === true
            ? t.username_available
            : ''
      }
      color={availability === true ? 'success' : undefined}
    />
  );
}
