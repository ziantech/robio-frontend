"use client";

import { Grid, TextField, Typography } from "@mui/material";
import { NewUser } from "@/types/user";
import UsernameTextField from "../UsernameField";
import PasswordField from "../PasswordField";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  user: NewUser;
  onChange: (field: keyof NewUser) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Step1LoginInfo: React.FC<Props> = ({ user, onChange }) => {
  const { t } = useLanguage();

  return (
    <Grid container direction="column" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {t.login_info}
      </Typography>

      <Grid>
        <TextField
          fullWidth
          label={t.email}
          variant="outlined"
          type="email"
          value={user.email}
          onChange={onChange("email")}
          error={!!user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)}
          helperText={
            !!user.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
              ? t.invalid_email
              : ""
          }
        />
      </Grid>

      <Grid>
        <UsernameTextField value={user.username} onChange={onChange("username")} />
      </Grid>

      <Grid>
        <PasswordField value={user.password} onChange={onChange("password")} />
      </Grid>

      <Typography variant="body2" color="text.secondary">
        {t.current_address}
      </Typography>

      <Grid>
        <TextField
          fullWidth
          label={t.current_address}
          variant="outlined"
          value={user.address}
          onChange={onChange("address")}
        />
      </Grid>
    </Grid>
  );
};

export default Step1LoginInfo;
