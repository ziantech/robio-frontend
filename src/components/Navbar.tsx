/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Menu, MenuItem } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LanguageIcon from '@mui/icons-material/Language';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
          <IconButton onClick={handleLangClick}>
            <LanguageIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => handleLangChange('ro')}>Română</MenuItem>
            <MenuItem onClick={() => handleLangChange('en')}>English</MenuItem>
          </Menu>

          <IconButton>
            <HelpOutlineIcon />
          </IconButton>

          <Button variant="outlined" onClick={() => router.push('/register')}>
            {t.register}
          </Button>
          <Button variant="contained" onClick={() => router.push('/login')}>
            {t.login}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
