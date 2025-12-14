
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Box, CircularProgress } from "@mui/material";

import Footer from "@/components/Footer";
import Navbar from "@/components/Admin/Navbar";


export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token, isAdmin, isModerator, flagsLoaded } = useAuth();
  const router = useRouter();


  useEffect(() => {
    // așteaptă bootstrap-ul tokenului
    if (token === null) return;

    // dacă nu e logat
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // așteaptă până vin rolurile
    if (!flagsLoaded) return;

    // dacă NU e admin ȘI NU e moderator => redirect
    if (!(isAdmin || isModerator)) {
      router.replace("/portal");
      return;
    }
  }, [token, isAuthenticated, flagsLoaded, isAdmin, isModerator, router]);
if (token === null || !isAuthenticated || !flagsLoaded) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <>
      <Navbar />
      <Box component="main" sx={{ minHeight: "80vh", p: 3 }}>
        {children}
      </Box>

      <Footer />
    </>
  );
}
