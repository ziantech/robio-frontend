"use client";

import { Box, Container, Typography, Link, Stack } from "@mui/material";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ borderTop: "1px solid #eee", py: 3, mt: 4, bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            © {year} {t.brand}. {t.rights}
          </Typography>

          <Stack direction="row" spacing={2}>
            <Link href="/learn/terms" underline="hover" color="text.secondary" variant="body2">
              Terms
            </Link>
            <Link href="/learn/privacy" underline="hover" color="text.secondary" variant="body2">
              Privacy
            </Link>
            <Link href="/learn" underline="hover" color="text.secondary" variant="body2">
              {t.help}
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
