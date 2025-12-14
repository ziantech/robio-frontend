/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Popper,
  Paper,
  ClickAwayListener,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Button,
  Collapse,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LanguageIcon from "@mui/icons-material/Language";

import LogoutIcon from "@mui/icons-material/Logout";

import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HandshakeIcon from "@mui/icons-material/Handshake";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import MapIcon from "@mui/icons-material/Map";

type SearchType = "profile" | "source" | "cemetery" | "place";

export function triggerGlobalSearch() {
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform || navigator.userAgent);
  const evt = new KeyboardEvent("keydown", {
    key: "k",
    code: "KeyK",
    ctrlKey: !isMac,
    metaKey: isMac,
    bubbles: true,
  });
  window.dispatchEvent(evt);
}

export default function Navbar() {
    const localProfileId =
    (typeof window !== "undefined" && localStorage.getItem("profileId")) ||
    "not-set";
  const localTreeId =
    (typeof window !== "undefined" && localStorage.getItem("treeId")) ||
    "not-set";

  const noProfile =
    !localProfileId ||
    localProfileId === "not-set" ||
    !localTreeId ||
    localTreeId === "not-set";
  const router = useRouter();
  const { setLang, t, lang } = useLanguage();
  const { logout, isAdmin, isModerator } = useAuth();

  // language menu
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const handleLangClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    setLangAnchor(e.currentTarget);
  const handleLangChange = (code: "ro" | "en") => {
    setLang(code);
    setLangAnchor(null);
  };

  const [openCreate, setOpenCreate] = useState(false);

  // username from localStorage (saved at login)
  const [username, setUsername] = useState<string>("");
  useEffect(() => {
    const u = localStorage.getItem("username") || "";
    setUsername(u);
  }, []);
  const initial = useMemo(
    () => username?.trim()?.[0]?.toUpperCase() || "U",
    [username]
  );

  // ===== Search dropdown state =====
  const [searchAnchorEl, setSearchAnchorEl] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const [searchType, setSearchType] = useState<SearchType>("profile");

  // simple inputs
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);


  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ name: string }>({ name: "" });
  const [adv, setAdv] = useState<{
    birthYear: string;
    deathYear: string;
    yearFrom: string;
    yearTo: string;
    cemetery: string;
    maiden: string;
    parentName: string;
    residence: string;
  }>({
    birthYear: "",
    deathYear: "",
    yearFrom: "",
    yearTo: "",
    cemetery: "",
    maiden: "",
    parentName: "",
    residence: "",
  });
  const [textQuery, setTextQuery] = useState("");

  // keep simple + advanced in sync for profile.name
  useEffect(() => {
    setProfileData((s) => ({ ...s, name }));
  }, [name]);

  // toggle popper
  const toggleSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    setSearchAnchorEl(e.currentTarget);
    setSearchOpen((v) => !v);
  };
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // autofocus when opening
  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [searchOpen, searchType, advancedOpen]);

  // shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;

      // Ctrl/⌘+P -> open CreateProfile
      if (isMeta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setOpenCreate(true);
        setSearchOpen(false);
        return;
      }

      // Ctrl/⌘+K -> open search
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Esc -> close search
      if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, closeSearch]);

  // labels
  const labels = {
    searchIn: lang === "ro" ? "Caută în" : "Search in",
    name: t.name ?? (lang === "ro" ? "Nume" : "Name"),
    placeHolderProfile: lang === "ro" ? "ex: Ioan Popa" : "e.g. Ioan Popa",
    placeHolderSource:
      lang === "ro"
        ? "Titlu / volum / pagină / an"
        : "Title / volume / page / year",
    placeHolderCemetery:
      lang === "ro"
        ? "Nume / coordonate / locație"
        : "Name / coordinates / location",
    placeHolderPlace:
      lang === "ro"
        ? "Țară / județ / localitate / adresă"
        : "Country / county / settlement / address",
    quickSearch: lang === "ro" ? "Căutare rapidă" : "Quick search",
    hint:
      lang === "ro"
        ? "Enter pentru a căuta • Esc pentru a închide • Ctrl/⌘+K pentru a deschide"
        : "Enter to search • Esc to close • Ctrl/⌘+K to open",
    searchButton: t.search_button || (lang === "ro" ? "Caută" : "Search"),
    searchAdvanced: t.search_advanced || (lang === "ro" ? "Căutare avansată" : "Advanced search"),
  };

  const singleFieldLabel =
    searchType === "source"
      ? labels.placeHolderSource
      : searchType === "cemetery"
      ? labels.placeHolderCemetery
      : labels.placeHolderPlace;

  // submit (merged simple + advanced)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    qs.set("type", searchType);

    if (searchType === "profile") {
      const useName = profileData.name.trim();
      const {
        birthYear,
        deathYear,
        yearFrom,
        yearTo,
        cemetery,
        maiden,
        parentName,
        residence,
      } = adv;

      if (useName) qs.set("name", useName);

      if (advancedOpen) {
        if (birthYear.trim()) qs.set("birth_year", birthYear.trim());
        if (deathYear.trim()) qs.set("death_year", deathYear.trim());
        if (yearFrom.trim()) qs.set("year_from", yearFrom.trim());
        if (yearTo.trim()) qs.set("year_to", yearTo.trim());
        if (cemetery.trim()) qs.set("cem_q", cemetery.trim());
        if (maiden.trim()) qs.set("maiden", maiden.trim());
        if (parentName.trim()) qs.set("parent_name", parentName.trim());
        if (residence.trim()) qs.set("residence_q", residence.trim());
        qs.set("adv", "1");
      }

      // nothing to send? do nothing
      if (!useName && !Array.from(qs.keys()).some((k) => k !== "type")) return;
    } else {
      const tq = textQuery.trim() || q.trim();
      if (!tq) return;
      qs.set("q", tq);
    }

    closeSearch();
    router.push(`/portal/search?${qs.toString()}`);
  };

  const canSubmit =
    searchType === "profile"
      ? profileData.name.trim().length >= 1 ||
        (advancedOpen && Object.values(adv).some((v) => v.trim() !== ""))
      : (textQuery.trim() || q.trim()).length >= 2;

  // placeholder by type
  const placeholder =
    searchType === "profile"
      ? labels.placeHolderProfile
      : singleFieldLabel;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          backdropFilter: "saturate(160%) blur(8px)",
          color: "inherit",
        }}
      >
        <Toolbar
          sx={{
            maxWidth: "1220px",
            mx: "auto",
            width: "100%",
            py: 1,
            px: { xs: 1.5, sm: 2 },
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          {/* Brand */}
          <Box
            display="flex"
            alignItems="center"
            sx={{ cursor: "pointer", columnGap: 1 }}
            onClick={() => router.push("/portal")}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(46,125,50,0.08)",
                border: "1px solid rgba(46,125,50,0.15)",
              }}
            >
              <Image src="/logo.svg" alt="RoBio Logo" width={72} height={72} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, letterSpacing: 0.2, lineHeight: 1 }}
              >
                {t.brand}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", lineHeight: 1 }}
              >
                {t?.brand_tagline || "Roots & Stories"}
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box
            display="flex"
            alignItems="center"
            sx={{
              gap: { xs: 0.5, sm: 1 },
              backgroundColor: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(0,0,0,0.06)",
              px: 1,
              py: 0.5,
              borderRadius: 999,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <Tooltip title={t.home || "Acasă"}>
              <IconButton size="small" onClick={() => router.push("/admin")}>
                <HomeIcon />
              </IconButton>
            </Tooltip>

            {/* SEARCH TOGGLE */}
            <Tooltip title={t.search}>
              <IconButton
                size="small"
                onClick={toggleSearch}
                aria-label="open-search"
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* DROPDOWN SEARCH */}
            <Popper
              open={searchOpen}
              anchorEl={searchAnchorEl}
              placement="bottom-end"
              sx={{ zIndex: (t) => t.zIndex.modal - 1 }}
              modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
            >
              <ClickAwayListener
                onClickAway={() => {
                  if (!selectOpen) closeSearch();
                }}
              >
                <Paper
                  elevation={6}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    minWidth: { xs: 300, sm: 420 },
                    maxWidth: 560,
                    border: "1px solid rgba(0,0,0,0.06)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1 }}>
                    <Typography variant="overline" sx={{ letterSpacing: 0.4 }}>
                      {lang === "ro" ? "Căutare" : "Search"}
                    </Typography>

                    {/* Search type */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="nav-search-type">{labels.searchIn}</InputLabel>
                      <Select<SearchType>
                        labelId="nav-search-type"
                        label={labels.searchIn}
                        value={searchType}
                        onChange={(e: SelectChangeEvent<SearchType>) => {
                          const val = e.target.value as SearchType;
                          setSearchType(val);
                          // reset fields when switching
                          if (val === "profile") {
                            setQ("");
                            setTextQuery("");
                          } else {
                            setName("");
                            setProfileData({ name: "" });
                            setAdvancedOpen(false);
                            setAdv({
                              birthYear: "",
                              deathYear: "",
                              yearFrom: "",
                              yearTo: "",
                              cemetery: "",
                              maiden: "",
                              parentName: "",
                              residence: "",
                            });
                          }
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                        onOpen={() => setSelectOpen(true)}
                        onClose={() => setSelectOpen(false)}
                        MenuProps={{
                          keepMounted: true,
                          slotProps: {
                            root: { sx: { zIndex: (t) => t.zIndex.tooltip } },
                          },
                        }}
                      >
                        <MenuItem value="profile">{lang === "ro" ? "Profile" : "Profiles"}</MenuItem>
                        <MenuItem value="source">{lang === "ro" ? "Surse" : "Sources"}</MenuItem>
                        <MenuItem value="cemetery">{lang === "ro" ? "Cimitire" : "Cemeteries"}</MenuItem>
                        <MenuItem value="place">{lang === "ro" ? "Locuri" : "Places"}</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Dynamic form */}
                    {searchType === "profile" ? (
                      <>
                        <TextField
                          inputRef={inputRef}
                          size="small"
                          label={labels.name}
                          placeholder={labels.placeHolderProfile}
                          value={profileData.name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setProfileData((s) => ({ ...s, name: e.target.value }));
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const form = (e.target as HTMLElement).closest("form") as HTMLFormElement | null;
                              form?.requestSubmit();
                            }
                          }}
                        />

                        <Box display="flex" gap={1} mt={0.5}>
                          <Button type="submit" variant="contained" disabled={!canSubmit}>
                            {labels.searchButton}
                          </Button>
                          <Button
                            type="button"
                            variant="text"
                            onClick={() => {
                              setAdvancedOpen((v) => !v);
                              setTimeout(() => inputRef.current?.focus(), 0);
                            }}
                          >
                            {labels.searchAdvanced}
                          </Button>
                        </Box>

                        <Collapse in={advancedOpen} unmountOnExit>
                          <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
                            <TextField
                              size="small"
                              label={lang === "ro" ? "An naștere" : "Birth year"}
                              value={adv.birthYear}
                              onChange={(e) => setAdv((s) => ({ ...s, birthYear: e.target.value }))}
                              placeholder="YYYY"
                              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                            />
                            <TextField
                              size="small"
                              label={lang === "ro" ? "An deces" : "Death year"}
                              value={adv.deathYear}
                              onChange={(e) => setAdv((s) => ({ ...s, deathYear: e.target.value }))}
                              placeholder="YYYY"
                              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                            />
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                              <TextField
                                size="small"
                                label={lang === "ro" ? "De la anul" : "From year"}
                                value={adv.yearFrom}
                                onChange={(e) => setAdv((s) => ({ ...s, yearFrom: e.target.value }))}
                                placeholder="YYYY"
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                              />
                              <TextField
                                size="small"
                                label={lang === "ro" ? "Până la anul" : "To year"}
                                value={adv.yearTo}
                                onChange={(e) => setAdv((s) => ({ ...s, yearTo: e.target.value }))}
                                placeholder="YYYY"
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                              />
                            </Box>

                            <TextField
                              size="small"
                              label={lang === "ro" ? "Cimitir" : "Cemetery"}
                              value={adv.cemetery}
                              onChange={(e) => setAdv((s) => ({ ...s, cemetery: e.target.value }))}
                              placeholder={lang === "ro" ? "ex: Belu" : "e.g. Belu"}
                            />
                            <TextField
                              size="small"
                              label={lang === "ro" ? "Nume la naștere (maiden)" : "Maiden name"}
                              value={adv.maiden}
                              onChange={(e) => setAdv((s) => ({ ...s, maiden: e.target.value }))}
                              placeholder={lang === "ro" ? "ex: Popescu" : "e.g. Popescu"}
                            />
                            <TextField
                              size="small"
                              label={lang === "ro" ? "Nume părinte (oricare)" : "Parent name (any)"}
                              value={adv.parentName}
                              onChange={(e) => setAdv((s) => ({ ...s, parentName: e.target.value }))}
                              placeholder={lang === "ro" ? "ex: Ion / Maria" : "e.g. Ion / Maria"}
                            />
                            <TextField
                              size="small"
                              label={lang === "ro" ? "Reședință (evenimente)" : "Residence (events)"}
                              value={adv.residence}
                              onChange={(e) => setAdv((s) => ({ ...s, residence: e.target.value }))}
                              placeholder={
                                lang === "ro" ? "oraș / județ / țară / adresă" : "city / county / country / address"
                              }
                            />
                          </Box>
                        </Collapse>

                        <button type="submit" style={{ display: "none" }} />
                      </>
                    ) : (
                      <>
                        <TextField
                          inputRef={inputRef}
                          size="small"
                          label={
                            searchType === "source"
                              ? lang === "ro"
                                ? "Caută în surse"
                                : "Search sources"
                              : searchType === "cemetery"
                              ? lang === "ro"
                                ? "Caută cimitir"
                                : "Search cemetery"
                              : lang === "ro"
                              ? "Caută loc"
                              : "Search place"
                          }
                          placeholder={singleFieldLabel}
                          value={textQuery || q}
                          onChange={(e) => {
                            setTextQuery(e.target.value);
                            setQ(e.target.value);
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const form = (e.target as HTMLElement).closest("form") as HTMLFormElement | null;
                              form?.requestSubmit();
                            }
                          }}
                        />
                        <Button type="submit" variant="contained" disabled={!canSubmit}>
                          {labels.searchButton}
                        </Button>
                      </>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      {labels.hint}
                    </Typography>
                  </Box>
                </Paper>
              </ClickAwayListener>
            </Popper>
                         <Tooltip title={t.map || (lang === "ro" ? "Hartă" : "Map")}>
              <IconButton
                size="small"
                onClick={() => router.push("/portal/map")}
                aria-label="map"
              >
                <MapIcon />
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 1, height: 28, mx: 0.5, bgcolor: "rgba(0,0,0,0.08)", borderRadius: 1 }} />

            {/* Partner / Admin */}
           {!noProfile && (
             <Tooltip title={t.partner_portal || "Partner Portal"}>
              <IconButton size="small" onClick={() => router.push("/partners")} aria-label="partner-portal">
                <HandshakeIcon />
              </IconButton>
            </Tooltip>
           )}

           
              <Tooltip title={t.user_portal || "User Portal"}>
                <IconButton size="small" onClick={() => router.push("/portal")} aria-label="admin-portal">
                  <SwitchAccountIcon />
                </IconButton>
              </Tooltip>
          

            {/* Language Selector */}
            <Tooltip title={t.changeLanguage}>
              <IconButton size="small" onClick={handleLangClick}>
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)}>
              <MenuItem onClick={() => handleLangChange("ro")}>Română</MenuItem>
              <MenuItem onClick={() => handleLangChange("en")}>English</MenuItem>
            </Menu>

            <Tooltip title={t.help}>
              <IconButton size="small" onClick={() => router.push("/learn")}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 1, height: 28, mx: 0.5, bgcolor: "rgba(0,0,0,0.08)", borderRadius: 1 }} />

          

            {/* Logout */}
            <Tooltip title={t.logout || "Deconectare"}>
              <IconButton size="small" onClick={() => logout()} aria-label="logout">
                <LogoutIcon />
              </IconButton>
            </Tooltip>

            {/* Avatar */}
            <Tooltip title={username || "Account"}>
              <Box
                sx={{
                  p: 0.2,
                  ml: 0.25,
                  borderRadius: "999px",
                  border: "1px solid rgba(46,125,50,0.25)",
                }}
              >
                <Avatar
                  sx={{ width: 34, height: 34, bgcolor: "#2e7d32", fontWeight: 700 }}
                  alt={username || "User"}
                >
                  {initial}
                </Avatar>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      
    </>
  );
}
