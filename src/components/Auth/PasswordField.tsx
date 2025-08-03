import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useLanguage } from '@/context/LanguageContext';
import { getPasswordStrength } from '@/utils/helper-methods';

export default function PasswordTextField({ value, onChange }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(value) as 'weak' | 'moderate' | 'strong';


  const helperText = {
    weak: t.password_strength_weak,
    moderate: t.password_strength_moderate,
    strong: t.password_strength_strong
  }[strength];

  return (
    <TextField
      fullWidth
      type={showPassword ? 'text' : 'password'}
      label={t.password}
      variant="outlined"
      value={value}
      onChange={onChange}
      helperText={helperText}
      color={strength === 'strong' ? 'success' : strength === 'moderate' ? 'warning' : 'error'}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
              aria-label={showPassword ? t.hide_password : t.show_password}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
