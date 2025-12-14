
"use client";

import { Box } from "@mui/material";

import Footer from "@/components/Footer";
import AuthNavbar from "@/components/Auth/AuthNavbar";


export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthNavbar />
      <Box component="main" sx={{ minHeight: "80vh", p: 3 }}>
        {children}
      </Box>
      <Footer />
    </>
  );
}
