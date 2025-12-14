/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Stack,
  Divider,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import HandshakeIcon from "@mui/icons-material/Handshake";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
import MapIcon from "@mui/icons-material/Map";
import CollectionsIcon from "@mui/icons-material/Collections";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ForumIcon from "@mui/icons-material/Forum";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
type SearchType = "profile" | "source" | "cemetery" | "place";

export default function Navbar({ onOpenCreateSource, onOpenCreateQuestion }: { onOpenCreateSource?: () => void; onOpenCreateQuestion?: () => void; }) {
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

  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const handleLangClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    setLangAnchor(e.currentTarget);
  const handleLangChange = (code: "ro" | "en") => {
    setLang(code);
    setLangAnchor(null);
  };

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

  const [searchType, setSearchType] = useState<SearchType>("profile");
  const [name, setName] = useState("");
  const [q, setQ] = useState(""); // legacy; îl păstrăm în caz că îl folosești în alte părți
  const [textQuery, setTextQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ name: string }>({ name: "" });
  const [adv, setAdv] = useState({
    birthYear: "",
    deathYear: "",
    yearFrom: "",
    yearTo: "",
    cemetery: "",
    maiden: "",
    parentName: "",
    residence: "",
  });

  useEffect(() => {
    setProfileData((s) => ({ ...s, name }));
  }, [name]);

  const toggleSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    setSearchAnchorEl(e.currentTarget);
    setSearchOpen((v) => !v);
  };
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [searchOpen, searchType, advancedOpen]);

  // Ctrl/⌘+K -> deschide Create Source modal; Esc -> închide search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenCreateSource?.();
        setSearchOpen(false);
      }
      if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, closeSearch, onOpenCreateSource]);

  const labels = {
    searchIn: lang === "ro" ? "Caută în" : "Search in",
    name: t.name ?? (lang === "ro" ? "Nume" : "Name"),
    placeHolderProfile: lang === "ro" ? "ex: Ioan Popa" : "e.g. Ioan Popa",
    placeHolderSource:
      lang === "ro" ? "Titlu / volum / pagină / an" : "Title / volume / page / year",
    placeHolderCemetery:
      lang === "ro" ? "Nume / coordonate / locație" : "Name / coordinates / location",
    placeHolderPlace:
      lang === "ro" ? "Țară / județ / localitate / adresă" : "Country / county / settlement / address",
    quickSearch: lang === "ro" ? "Căutare rapidă" : "Quick search",
    hint:
      lang === "ro"
        ? "Enter pentru a căuta • Esc pentru a închide • Ctrl/⌘+K pentru Creare Sursă"
        : "Enter to search • Esc to close • Ctrl/⌘+K to Create Source",
    searchButton: t.search_button || (lang === "ro" ? "Caută" : "Search"),
    searchAdvanced: t.search_advanced || (lang === "ro" ? "Căutare avansată" : "Advanced search"),
  };

  const singleFieldLabel =
    searchType === "source"
      ? labels.placeHolderSource
      : searchType === "cemetery"
      ? labels.placeHolderCemetery
      : labels.placeHolderPlace;

  const canSubmit =
    searchType === "profile"
      ? profileData.name.trim().length >= 1 ||
        (advancedOpen &&
          Object.values(adv).some((v) => (v as string).trim() !== ""))
      : (textQuery.trim() || q.trim()).length >= 2;

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
      } = adv as any;

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
      if (!useName && !Array.from(qs.keys()).some((k) => k !== "type")) return;
    } else {
      const tq = textQuery.trim() || q.trim();
      if (!tq) return;
      qs.set("q", tq);
    }

    closeSearch();
    // 🆕 deschide în filă nouă
    window.open(`/portal/search?${qs.toString()}`, "_blank", "noopener,noreferrer");
  };

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
              <IconButton size="small" onClick={() => router.push("/partners")}>
                <HomeIcon />
              </IconButton>
            </Tooltip>

            {/* Map */}
            <Tooltip title={lang === "ro" ? "Hartă parohii & cimitire" : "Parishes & Cemeteries Map"}>
              <IconButton size="small" onClick={() => router.push("/partners/map")} aria-label="map">
                <MapIcon />
              </IconButton>
            </Tooltip>

            {/* Search */}
            <Tooltip title={labels.quickSearch}>
              <IconButton
                size="small"
                onClick={toggleSearch}
                aria-label="quick-search"
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={lang === "ro" ? "Creează întrebare" : "Create question"}>
  <IconButton
    size="small"
    onClick={() => onOpenCreateQuestion?.()}
    aria-label="create-question"
  >
    <LiveHelpIcon />
  </IconButton>
</Tooltip>

<Tooltip title="Forum">
  <IconButton
    size="small"
    onClick={() => router.push("/partners/forum")}
    aria-label="forum"
  >
    <ForumIcon />
  </IconButton>
</Tooltip>

            {/* Create Source */}
            <Tooltip
              title={
                lang === "ro"
                  ? "Creează sursă (Ctrl/⌘+K)"
                  : "Create source (Ctrl/⌘+K)"
              }
            >
              <IconButton
                size="small"
                onClick={() => onOpenCreateSource?.()}
                aria-label="create-source"
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>

            {/* My Sources */}
            <Tooltip title="My Sources">
              <IconButton
                size="small"
                onClick={() => router.push("/partners/my-sources")}
                aria-label="my-sources"
              >
                <CollectionsIcon />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                width: 1,
                height: 28,
                mx: 0.5,
                bgcolor: "rgba(0,0,0,0.08)",
                borderRadius: 1,
              }}
            />

            <Tooltip title={t.user_portal || "User Portal"}>
              <IconButton
                size="small"
                onClick={() => router.push("/portal")}
                aria-label="user-portal"
              >
                <SwitchAccountIcon />
              </IconButton>
            </Tooltip>

            {/* Language */}
            <Tooltip title={t.changeLanguage}>
              <IconButton size="small" onClick={handleLangClick}>
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={() => setLangAnchor(null)}
            >
              <MenuItem onClick={() => handleLangChange("ro")}>Română</MenuItem>
              <MenuItem onClick={() => handleLangChange("en")}>English</MenuItem>
            </Menu>

            <Tooltip title={t.help}>
              <IconButton size="small" onClick={() => router.push("/learn")}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                width: 1,
                height: 28,
                mx: 0.5,
                bgcolor: "rgba(0,0,0,0.08)",
                borderRadius: 1,
              }}
            />

            {/* Logout */}
            <Tooltip title={t.logout || "Deconectare"}>
              <IconButton
                size="small"
                onClick={() => logout()}
                aria-label="logout"
              >
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

      {/* ===== Search Popper ===== */}
      <Popper
        open={searchOpen}
        anchorEl={searchAnchorEl}
        placement="bottom-end"
        style={{ zIndex: 1500 }}
      >
        <ClickAwayListener onClickAway={closeSearch}>
          <Paper
            sx={{
              p: 2,
              width: 420,
              maxWidth: "calc(100vw - 24px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              borderRadius: 2,
            }}
          >
            <form onSubmit={handleSubmit}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2">{labels.quickSearch}</Typography>

                <FormControl size="small" fullWidth>
                  <InputLabel id="search-type-label">{labels.searchIn}</InputLabel>
                  <Select
                    labelId="search-type-label"
                    label={labels.searchIn}
                    value={searchType}
                    onChange={(e: SelectChangeEvent<SearchType>) =>
                      setSearchType(e.target.value as SearchType)
                    }
                  >
                    <MenuItem value="profile">{lang === "ro" ? "Profile" : "Profiles"}</MenuItem>
                    <MenuItem value="source">{lang === "ro" ? "Surse" : "Sources"}</MenuItem>
                    <MenuItem value="cemetery">{lang === "ro" ? "Cimitire" : "Cemeteries"}</MenuItem>
                    <MenuItem value="place">{lang === "ro" ? "Locuri" : "Places"}</MenuItem>
                  </Select>
                </FormControl>

                {searchType === "profile" ? (
                  <>
                    <TextField
                      inputRef={inputRef}
                      size="small"
                      label={labels.name}
                      placeholder={labels.placeHolderProfile}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                    <Button
                      size="small"
                      onClick={() => setAdvancedOpen((v) => !v)}
                    >
                      {labels.searchAdvanced}
                    </Button>

                    <Collapse in={advancedOpen} unmountOnExit>
                      <Stack spacing={1} sx={{ pt: 0.5 }}>
                        <TextField
                          size="small"
                          label={lang === "ro" ? "An naștere" : "Birth year"}
                          value={adv.birthYear}
                          onChange={(e) =>
                            setAdv((s) => ({ ...s, birthYear: e.target.value }))
                          }
                        />
                        <TextField
                          size="small"
                          label={lang === "ro" ? "An deces" : "Death year"}
                          value={adv.deathYear}
                          onChange={(e) =>
                            setAdv((s) => ({ ...s, deathYear: e.target.value }))
                          }
                        />
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            label={lang === "ro" ? "An de la" : "Year from"}
                            value={adv.yearFrom}
                            onChange={(e) =>
                              setAdv((s) => ({ ...s, yearFrom: e.target.value }))
                            }
                            fullWidth
                          />
                          <TextField
                            size="small"
                            label={lang === "ro" ? "An până la" : "Year to"}
                            value={adv.yearTo}
                            onChange={(e) =>
                              setAdv((s) => ({ ...s, yearTo: e.target.value }))
                            }
                            fullWidth
                          />
                        </Stack>
                        <TextField
                          size="small"
                          label={lang === "ro" ? "Cimitir (text)" : "Cemetery (text)"}
                          value={adv.cemetery}
                          onChange={(e) =>
                            setAdv((s) => ({ ...s, cemetery: e.target.value }))
                          }
                        />
                        <TextField
                          size="small"
                          label={lang === "ro" ? "Nume fată" : "Maiden name"}
                          value={adv.maiden}
                          onChange={(e) =>
                            setAdv((s) => ({ ...s, maiden: e.target.value }))
                          }
                        />
                        <TextField
                          size="small"
                          label={lang === "ro" ? "Părinte" : "Parent name"}
                          value={adv.parentName}
                          onChange={(e) =>
                            setAdv((s) => ({ ...s, parentName: e.target.value }))
                          }
                        />
                        <TextField
                          size="small"
                          label={lang === "ro" ? "Reședință (text)" : "Residence (text)"}
                          value={adv.residence}
                          onChange={(e) =>
                            setAdv((s) => ({ ...s, residence: e.target.value }))
                          }
                        />
                      </Stack>
                    </Collapse>
                  </>
                ) : (
                  <TextField
                    inputRef={inputRef}
                    size="small"
                    label={lang === "ro" ? "Căutare" : "Search"}
                    placeholder={singleFieldLabel}
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                )}

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ flex: 1, color: "text.secondary" }}>
                    <Typography variant="caption">{labels.hint}</Typography>
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit}
                  >
                    {labels.searchButton}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
