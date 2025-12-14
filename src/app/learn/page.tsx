"use client";

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Card,
  CardActionArea,
  CardContent,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GavelIcon from "@mui/icons-material/Gavel";
import PolicyIcon from "@mui/icons-material/Policy";
import LoginIcon from "@mui/icons-material/Login";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";            
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";      
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined"; 

import { useLanguage } from "@/context/LanguageContext";
type Article = {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  important?: boolean;
};



export default function LearnHomePage() {
  const [q, setQ] = useState("");
  const {t} = useLanguage();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault(); // intenționat: încă nu căutăm
  };
const ARTICLES: Article[] = [
    {
      title: t.learn.articles.terms.title,
      desc: t.learn.articles.terms.desc,
      href: "/learn/terms",
      icon: <GavelIcon />,
      important: true,
    },
    {
title: t.learn.articles.partners_processing_guide.title,
desc: t.learn.articles.partners_processing_guide.desc,
href: "/learn/partners-processing-guide",
icon: <HandshakeOutlinedIcon />,
important:true
    },
    {
      title: t.learn.articles.privacy.title,
      desc: t.learn.articles.privacy.desc,
      href: "/learn/privacy",
      icon: <PolicyIcon />,
      important: true,
    },
    {
  title: t.learn.articles.faq.title,
  desc: t.learn.articles.faq.desc,
  href: "/learn/faq",
  icon: <HelpOutlineIcon />,
  important: true,
},
    {
      title: t.learn.articles.auth.title,
      desc: t.learn.articles.auth.desc,
      href: "/learn/auth",
      icon: <LoginIcon />,
    },
    {
      title: t.learn.articles.portal_home.title,
      desc: t.learn.articles.portal_home.desc,
      href: "/learn/portal-home",
      icon: <HomeOutlinedIcon />,
    },
 {
  title: t.learn.articles.profiles.title,
  desc: t.learn.articles.profiles.desc,
  href: "/learn/profiles",
  icon: <PersonOutlineIcon />
},
 // NEW — Search
  {
    title: t.learn.articles.search.title,
    desc: t.learn.articles.search.desc,
    href: "/learn/search",
    icon: <SearchIcon />,
  },
  // NEW — Sources
  {
    title: t.learn.articles.sources.title,
    desc: t.learn.articles.sources.desc,
    href: "/learn/sources",
    icon: <SourceOutlinedIcon />,
  },
  // NEW — Places & Cemeteries
  {
    title: t.learn.articles.places.title,
    desc: t.learn.articles.places.desc,
    href: "/learn/places",
    icon: <MapOutlinedIcon />,
  },
  // NEW — Partners
  {
    title: t.learn.articles.partners.title,
    desc: t.learn.articles.partners.desc,
    href: "/learn/partners",
    icon: <HandshakeOutlinedIcon />,
  },
  ];
  // Filtrare vizuală locală (opțional; nu declanșează navigare)
  const filtered = ARTICLES.filter((a) => {
    if (!q.trim()) return true;
    const t = (a.title + " " + a.desc).toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", py: 2 }}>
      {/* HERO */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
           <Typography
          variant="h4"
          sx={{ fontWeight: 800, letterSpacing: "-.02em" }}
          dangerouslySetInnerHTML={{ __html: t.learn.hero_title }}   // ⬅️ include <br />
        />

       <Typography variant="body2" color="text.secondary">
          {t.learn.hero_p1}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learn.hero_p2}
        </Typography>

        <Box component="form" onSubmit={onSearch} sx={{ mt: 0.5 }}>
          <TextField
            fullWidth
            size="small"
             placeholder={t.learn.search_placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" aria-label="Caută">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

   <Typography variant="overline" color="text.secondary">
        {t.learn.overline_articles}
      </Typography>

      <Box
        sx={{
          mt: 1,
          display: "grid",
          gap: 16 / 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          alignItems: "stretch",
        }}
      >
        {filtered.map((a) => (
          <Card
            key={a.title}
            variant="outlined"
            sx={{
              borderRadius: 2,
              ...(a.important
                ? {
                    borderColor: "warning.main",
                    boxShadow: (t) => `0 0 0 1px ${t.palette.warning.main} inset`,
                    background:
                      "linear-gradient(0deg, rgba(255,193,7,0.04), rgba(255,193,7,0.04))",
                  }
                : {}),
              transition: "transform .15s ease, box-shadow .15s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardActionArea href={a.href}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 22,
                      }}
                    >
                      {a.icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                      {a.title}
                    </Typography>
                    {a.important && (
                      <Chip
                        size="small"
                        color="warning"
                        label="Important"
                        sx={{ ml: "auto", fontWeight: 700 }}
                      />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {a.desc}
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
