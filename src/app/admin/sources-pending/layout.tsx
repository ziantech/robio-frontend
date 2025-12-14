// app/admin/sources-pending/layout.tsx
"use client";

import { Box } from "@mui/material";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>{children}</Box>;
}
