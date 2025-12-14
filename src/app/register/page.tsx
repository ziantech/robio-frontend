/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import AuthNavbar from "@/components/Auth/AuthNavbar";
import {
  Box,
  Card,
  Container,
  Button,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";
import { NewUser } from "@/types/user";
import Step1LoginInfo from "@/components/Auth/Register/Step1LoginInfo";

import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";

type RegisterStep = 1 | 2 ;

export default function RegisterPage() {
  const { isAuthenticated, login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);


  const [step, setStep] = useState<RegisterStep>(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<NewUser>({
    email: "",
    username: "",
    password: "",
    agreeTerms: false,
    recoveryEmail: "",
   
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/portal");
  }, [isAuthenticated, router]);


  useEffect(() => {
    // după schimbarea pasului, revino la începutul containerului
    // folosim rAF ca să fim siguri că noul conținut e montat
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [step]);
  const handleChange =
    (field: keyof NewUser) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setUser({ ...user, [field]: e.target.value });

  const goToStep = (newStep: number) => {
    if (newStep >= 1 && newStep <= 2) {
      setStep(newStep as RegisterStep);
    }
  };
  const createUser = async () => {
    // validare campuri obligatorii
    if (!user.email.trim()) {
      notify("Email-ul este obligatoriu", "error");
      return;
    }
    if (!user.username.trim()) {
      notify("Username-ul este obligatoriu", "error");
      return;
    }
    if (!user.password.trim()) {
      notify("Parola este obligatorie", "error");
      return;
    }
   
    if (!user.agreeTerms) {
      notify("Trebuie să accepți termenii și condițiile", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = user

      const res = await api.post("/users/", payload);
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;

        login(data.token, {
          isPartner: !!data.is_partner,
          isAdmin: !!data.is_admin,
          isModerator: !!data.is_moderator,
        }); // 🔹 actualizăm contextul instant
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("profileId", "not-set");
        localStorage.setItem("username", data.username);
        localStorage.setItem("treeId", "not-set");

        notify("Utilizator creat cu succes!", "success");
        router.push("/portal");
      } else {
        notify("A apărut o problemă la crearea utilizatorului", "error");
      }
      // aici poți face redirect
    } catch (err: any) {
      notify(
        err.response?.data?.detail || "Eroare la crearea utilizatorului",
        "error"
      );
    } finally {
      setLoading(false);
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
            ref={scrollRef}
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "background.paper",
              height: { xs: "80vh", sm: "75vh" }, // Adjust based on screen size
              overflowY: "auto", // Scroll only inside the card
              display: "flex",
              flexDirection: "column",
            }}
          >
            {step === 1 && (
              <Step1LoginInfo user={user} onChange={handleChange} />
            )}
        

            {step === 2 && (
              <Box display="grid" gap={3}>
                <Typography variant="h5" fontWeight={600}>
                  {t.step5_title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {t.step5_description}
                </Typography>

                {/* Rules / Code of Conduct */}
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {t.rules_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    {t.rules_intro}
                  </Typography>

                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                  
                    <li>
                      <Typography variant="body2">
                        {t.rule_no_harassment}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        {t.rule_accurate_sources}
                      </Typography>
                    </li>
              
                    <li>
                      <Typography variant="body2">
                        {t.rule_be_respectful}
                      </Typography>
                    </li>
                  </Box>
                </Box>

             

                {/* Terms + Register */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={user.agreeTerms}
                      onChange={(e) =>
                        setUser({ ...user, agreeTerms: e.target.checked })
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t.agree_terms}{" "}
                      <Box
                        component="span"
                        sx={{
                          color: "primary.main",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => alert("Show terms modal here later")}
                      >
                        {t.terms_and_conditions}
                      </Box>
                    </Typography>
                  }
                />

                <Button
                  variant="contained"
                  disabled={!user.agreeTerms || loading}
                  onClick={createUser}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    t.register_button
                  )}
                </Button>
              </Box>
            )}

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
