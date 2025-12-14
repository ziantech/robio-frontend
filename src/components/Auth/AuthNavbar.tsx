'use client';

import { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LanguageIcon from '@mui/icons-material/Language';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import ro from '@/locales/ro.json';
import en from '@/locales/en.json';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/navigation';
const languages = { ro, en };

export default function AuthNavbar() {
  const { lang, setLang } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const t = languages[lang];
  const router = useRouter();

  const handleLangClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLangChange = (code: 'ro' | 'en') => {
    setLang(code);
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#f5f5f5', color: 'black' }} elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <Image src="/logo.svg" alt="RoBio Logo" width={40} height={40} />
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
            {t.brand}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>

         <Tooltip title={t.home}>
           <IconButton onClick={() => router.push("/")}>
            <HomeIcon />
          </IconButton>
          </Tooltip>
         <Tooltip title={t.select_language}>
           <IconButton onClick={handleLangClick}>
            <LanguageIcon />
          </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => handleLangChange('ro')}>Română</MenuItem>
            <MenuItem onClick={() => handleLangChange('en')}>English</MenuItem>
          </Menu>

         <Tooltip title={t.help}>
           <IconButton onClick={() => router.push("/learn")}>
            <HelpOutlineIcon />
          </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
