/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import { NewUser } from "@/types/user";
import UsernameTextField from "../UsernameField";
import PasswordField from "../PasswordField";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  user: NewUser;
  onChange: (
    field: keyof NewUser
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Step1LoginInfo: React.FC<Props> = ({ user, onChange }) => {
  const { t } = useLanguage();

  const isEmailInvalid =
    !!user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email);

  return (
    <Box display="grid" gap={3}>
      {/* Title */}
      <Box>
        <Typography variant="h5" fontWeight={600}>
          {t.create_account}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.register_description}
        </Typography>
      </Box>

      {/* Login Info */}
      <Box display="grid" gap={2}>
        <Typography variant="subtitle1" fontWeight={500}>
          {t.login_info}
        </Typography>

        <TextField
          fullWidth
          label={t.email}
          variant="outlined"
          type="email"
          value={user.email}
          onChange={onChange("email")}
          error={isEmailInvalid}
          helperText={isEmailInvalid ? t.invalid_email : ""}
        />

        <UsernameTextField
          value={user.username}
          onChange={onChange("username")}
        />

        <PasswordField value={user.password} onChange={onChange("password")} />
      </Box>



      {/* Recovery Info */}
      <Box display="grid" gap={1} mt={2}>
        <Typography variant="subtitle1" fontWeight={500}>
          {t.recovery_info}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.recovery_description}
        </Typography>

        <TextField
          fullWidth
          label={t.recovery_email}
          variant="outlined"
          type="email"
          value={user.recoveryEmail || ""}
          onChange={onChange("recoveryEmail")}
        />
      </Box>

   
    </Box>
  );
};

export default Step1LoginInfo;
