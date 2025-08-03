"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import AuthNavbar from "@/components/Auth/AuthNavbar";
import { Box, Card, Typography, Container, TextField } from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import { NewUser } from "@/types/user";
import Grid from "@mui/material/Grid";
import UsernameTextField from "@/components/Auth/UsernameField";
import PasswordField from "@/components/Auth/PasswordField";

type RegisterStep = 1 | 2 | 3;

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>(1);
  const [user, setUser] = useState<NewUser>({
    email: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/portal");
    }
  }, [isAuthenticated, router]);

  const handleChange =
    (field: keyof NewUser) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setUser({ ...user, [field]: event.target.value });
    };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/auth-background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AuthNavbar />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "background.paper",
              textAlign: "center",
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {t.create_account}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t.register_description}
            </Typography>

            {step === 1 && (
              <Grid container direction="column" gap={2}>
                <Grid>
                  <TextField
                    fullWidth
                    label={t.email}
                    variant="outlined"
                    type="email"
                    value={user.email}
                    onChange={handleChange("email")}
                    error={
                      !!user.email &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
                    }
                    helperText={
                      !!user.email &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
                        ? t.invalid_email || "Invalid email format"
                        : ""
                    }
                  />
                </Grid>

                <Grid>
                  <UsernameTextField
                    value={user.username}
                    onChange={handleChange("username")}
                  />
                </Grid>

                <Grid>
                  <PasswordField
                    value={user.password}
                    onChange={handleChange("password")}
                  />
                </Grid>

          
              </Grid>
            )}
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
