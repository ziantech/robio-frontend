"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import AuthNavbar from "@/components/Auth/AuthNavbar";
import { Box, Card, Container, Button, Stack } from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import { NewUser } from "@/types/user";
import Step1LoginInfo from "@/components/Auth/Register/Step1LoginInfo";
import Step2Profile from "@/components/Auth/Register/Step2Profile";

type RegisterStep = 1 | 2;

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>(1);
  const [user, setUser] = useState<NewUser>({
    email: "",
    username: "",
    password: "",
    address: "",
    sex: undefined,
    name: {
      title: "",
      first: [],
      alternative: [],
      last: "",
      suffix: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/portal");
  }, [isAuthenticated, router]);

  const handleChange =
    (field: keyof NewUser) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setUser({ ...user, [field]: e.target.value });

  const goToStep = (newStep: number) => {
    if (newStep >= 1 && newStep <= 3) {
      setStep(newStep as RegisterStep);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/auth-background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
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
            sx={{ p: 4, borderRadius: 4, bgcolor: "background.paper" }}
          >
            {step === 1 && (
              <Step1LoginInfo user={user} onChange={handleChange} />
            )}
            {step === 2 && <Step2Profile user={user} setUser={setUser} />}

            <Stack direction="row" spacing={2} justifyContent="center" mt={4}>
              {step > 1 && (
                <Button variant="outlined" onClick={() => goToStep(step - 1)}>
                  {t.previous || "Back"}
                </Button>
              )}
              {step < 2 && (
                <Button variant="contained" onClick={() => goToStep(step + 1)}>
                  {t.next || "Next"}
                </Button>
              )}
            </Stack>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
