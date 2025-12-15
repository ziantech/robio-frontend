/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Avatar,
  Divider,
  Tooltip,
  CircularProgress,
  Stack,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { formatDateObject } from "@/utils/formatDateObject";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";
import ImageViewer from "@/components/ImageViewer";
import ImageIcon from "@mui/icons-material/Image";
import { useAuth } from "@/context/AuthContext";
// 🖼️ imagine preview cu zoom etc.
import IconButton from "@mui/material/IconButton";
import ShareIcon from "@mui/icons-material/Share";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import StarIcon from "@mui/icons-material/Star";
import FlagIcon from "@mui/icons-material/Flag";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import RedditIcon from "@mui/icons-material/Reddit";
import { EthnicityDTO, Profile } from "@/types/profiles";
import { useProfile } from "@/context/ProfileContext";
import { useNotify } from "@/context/NotifyContext";
import StarBorderIcon from "@mui/icons-material/StarBorder";
// importuri noi
import Badge from "@mui/material/Badge";
import ContentCopyIcon from "@mui/icons-material/ContentCopy"; // "Sugerează copie"
import VisibilityIcon from "@mui/icons-material/Visibility"; // "Vezi copii"
import SelectOrCreateProfileModal from "@/components/CreateProfileModal";
import { formatName } from "@/utils/formatName";

const tabs = {
  en: [
    { label: "About", value: "about" },
    { label: "Family", value: "family" },
    { label: "Sources", value: "sources" },
    { label: "Timeline", value: "timeline" },
  ],
  ro: [
    { label: "Despre", value: "about" },
    { label: "Familie", value: "family" },
    { label: "Surse", value: "sources" },
    { label: "Cronologie", value: "timeline" },
  ],
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/");
  const id = pathSegments[3];
  const currentTab = pathSegments[4] || "about";
  const [isHovered, setIsHovered] = useState(false);
  const notify = useNotify();

  const { profile, setProfile, setEthnicity, ethnicity } = useProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id: currentUserId } = useAuth();
  const { lang } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const { isAdmin } = useAuth();
  const [promoting, setPromoting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [familyCount, setFamilyCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);

  const [claimOpen, setClaimOpen] = useState(false);
  const [claimUploading, setClaimUploading] = useState(false);
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimUrl, setClaimUrl] = useState<string>("");
  const claimInputRef = useRef<HTMLInputElement>(null);

  const [suggestCopyOpen, setSuggestCopyOpen] = useState(false);
  const [viewCopiesOpen, setViewCopiesOpen] = useState(false);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [copiesDetails, setCopiesDetails] = useState<any[]>([]);

  const [viewPersonalitiesOpen, setViewPersonalitiesOpen] = useState(false);
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [personalitiesCount, setPersonalitiesCount] = useState<number>(0);
  const [personalitiesLoading, setPersonalitiesLoading] = useState(false);

  const publicUrl = profile
    ? `${window.location.origin}/portal/profile/${profile.tree_ref}`
    : "";

  const iframeCode = `<iframe 
  src="${publicUrl}/embed" 
  width="400" 
  height="180" 
  frameborder="0" 
  style="border:1px solid #ccc;border-radius:8px;" 
  title="Robio profile preview">
</iframe>`;

  useEffect(() => {
    const fetchProfile = async () => {
      const identifier = id || localStorage.getItem("treeId");
      if (!identifier) return;

      try {
        const res = await api.get(`profiles/${identifier}`);
        if (
          res.data.owner_id &&
          currentUserId &&
          res.data.owner_id === currentUserId
        ) {
          setCanEdit(true);
        }
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, [currentUserId, id, setProfile]);

  useEffect(() => {
    if (!profile?.ethnicity?.ethnicity_id) {
      setEthnicity(null);
      return;
    }
    (async () => {
      try {
        const res = await api.get(
          `/profiles/ethnicities/${profile.ethnicity.ethnicity_id}`
        );
        setEthnicity(res.data as EthnicityDTO);
      } catch (e) {
        console.error("Failed to fetch ethnicity", e);
        setEthnicity(null);
      }
    })();
  }, [profile, setEthnicity]);

  useEffect(() => {
    // avem nevoie de tree_ref ca să cerem contorul
    if (!profile?.tree_ref) return;

    let cancelled = false;
    const fetchCount = async () => {
      try {
        setIsCountLoading(true);
        setPersonalitiesLoading(true);
        // folosește endpointul existent de tree; ia doar meta.count
        // poți ajusta up/down dacă vrei să fie mai ieftin; default e ok, dar vezi secțiunea „Backend (opțional)”
        const res = await api.get(`/tree/get/${profile.tree_ref}`);
        if (!cancelled) {
          setFamilyCount(res?.data?.meta?.count ?? null);
          const rawPers = res?.data?.meta?.personalities ?? [];
          const filteredPers = Array.isArray(rawPers)
            ? rawPers.filter((p: any) => p?.tree_ref !== profile.tree_ref)
            : [];
          setPersonalitiesCount(filteredPers.length);
          setPersonalities(filteredPers);
        }
      } catch (e) {
        console.error("Failed to fetch family count", e);
        if (!cancelled) setFamilyCount(null);
      } finally {
        if (!cancelled) {
          setIsCountLoading(false);
          setPersonalitiesLoading(false);
        }
      }
    };

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [profile?.tree_ref]);

  useEffect(() => {
    return () => {
      // când componenta se unmount-ează
      setProfile(null);
    };
  }, [setProfile]);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.type === "click" && e.button === 0) {
      // Left click
      fileInputRef.current?.click();
    } else if (e.type === "contextmenu") {
      // Right click
      e.preventDefault();
      setIsModalOpen(true);
    }
  };
const handleDeleteProfile = async () => {
  if (!profile || deleting) return;

  const msg =
    lang === "ro"
      ? "Sigur vrei să ștergi acest profil? Acțiunea este ireversibilă."
      : "Are you sure you want to delete this profile? This action is irreversible.";
  if (!confirm(msg)) return;

  try {
    setDeleting(true);

    const res = await api.delete<{
      removed_profile_tree_ref: string;
      unset_current_user_profile: boolean;
    }>(`/profiles/${profile.tree_ref}`);

    if (res?.data?.unset_current_user_profile) {
      localStorage.setItem("treeId", "not-set");
    } else if (localStorage.getItem("treeId") === profile.tree_ref) {
      localStorage.setItem("treeId", "not-set");
    }

    notify(
      lang === "ro"
        ? "Profilul a fost șters."
        : "The profile has been deleted.",
      "success"
    );

    window.location.href = "/portal";
  } catch (e: any) {
    console.error("Failed to delete profile", e);
    notify(
      lang === "ro"
        ? "Ștergerea a eșuat. Încearcă din nou."
        : "Deletion failed. Please try again.",
      "error"
    );
  } finally {
    setDeleting(false);
  }
};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tree_ref", id); // dacă backend-ul are nevoie
    setIsUploading(true);
    try {
      await api.post(`/profiles/upload_picture/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // sau ce trimite backend-ul
      window.location.reload();
    } catch (err) {
      console.error("Upload failed", err);
      // poți afișa o notificare
    } finally {
      setIsUploading(false);
    }
  };

  function formatNameSafe(n: Profile["name"], lang: "ro" | "en"): string {
    // Normalizează sigur la array
    const first = Array.isArray(n?.first)
      ? n!.first
      : n?.first
      ? [String(n.first)]
      : [];
    const last = Array.isArray(n?.last)
      ? n!.last
      : n?.last
      ? [String(n.last)]
      : [];

    return formatName(
      {
        title: n?.title ?? "",
        first,
        last,
        maiden: n?.maiden ?? "",
        suffix: n?.suffix ?? "",
      },
      {
        lang,
        maidenStyle: "label", // (născută/born X)
        // IMPORTANT: nu există și nu setăm vreo opțiune cu virgulă înainte de sufix
      }
    );
  }

  const birthStr = formatDateObject(profile?.birth?.date, lang, "birth");
  const deathStr = formatDateObject(
    profile?.death?.date,
    lang,
    "death",
    profile?.deceased
  );
  const calcAge = (
    b?: {
      year?: number | string;
      month?: number | string;
      day?: number | string;
    },
    d?: {
      year?: number | string;
      month?: number | string;
      day?: number | string;
    }
  ): number | null => {
    if (!b?.year || !d?.year) return null;
    let age = Number(d.year) - Number(b.year);
    // if we have full month+day for both, adjust precisely
    if (b.month && b.day && d.month && d.day) {
      const birthDate = new Date(
        Number(b.year),
        Number(b.month) - 1,
        Number(b.day)
      );
      const deathDate = new Date(
        Number(d.year),
        Number(d.month) - 1,
        Number(d.day)
      );
      const hadBirthday =
        deathDate.getMonth() > birthDate.getMonth() ||
        (deathDate.getMonth() === birthDate.getMonth() &&
          deathDate.getDate() >= birthDate.getDate());
      if (!hadBirthday) age -= 1;
    }
    return age;
  };

  const ageYears =
    profile?.birth?.date && profile?.death?.date
      ? calcAge(profile.birth?.date as any, profile.death?.date as any)
      : null;

const ageUnit =
  ageYears === 1
    ? lang === "ro"
      ? "an"
      : "year"
    : lang === "ro"
    ? "ani"
    : "years";

const ageText =
  profile?.birth?.date && profile?.death?.date
    ? `${ageYears ?? "?"} ${ageUnit}`
    : profile?.birth?.date || profile?.death?.date
    ? `? ${lang === "ro" ? "ani" : "years"}`
    : "";
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: "1300px", mx: "auto" }}>
      {profile && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          {/* Dacă are voie să editeze, arătăm Tooltip + icon hover */}
          {canEdit ? (
            <Tooltip
              title={
                <Box>
                  <Typography variant="body2">
                    {lang === "ro"
                      ? "Click stânga: schimbă poza"
                      : "Left click: change picture"}
                  </Typography>
                  <Typography variant="body2">
                    {lang === "ro"
                      ? "Click dreapta: mărește poza"
                      : "Right click: enlarge"}
                  </Typography>
                </Box>
              }
              placement="top"
            >
              <Box
                sx={{ position: "relative", width: 72, height: 72, mr: 2 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleAvatarClick}
                onContextMenu={handleAvatarClick}
              >
                <Avatar
                  src={profile.picture_url || undefined}
                  alt="Profile picture"
                  sx={{ width: 72, height: 72, mr: 2, cursor: "pointer" }}
                />
                {isHovered ||
                  (isUploading && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 72,
                        height: 72,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      {isUploading ? (
                        <CircularProgress size={28} sx={{ color: "white" }} />
                      ) : (
                        <ImageIcon sx={{ color: "white" }} />
                      )}
                    </Box>
                  ))}
              </Box>
            </Tooltip>
          ) : (
            // Dacă nu are voie, arătăm doar imaginea și deschidem modalul la click
            <Box
              sx={{ width: 72, height: 72, mr: 2, cursor: "pointer" }}
              onContextMenu={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
              }}
            >
              <Tooltip
                title={
                  <Typography variant="body2">
                    {lang === "ro"
                      ? "Click dreapta: mărește poza"
                      : "Right click: enlarge"}
                  </Typography>
                }
              >
                <Avatar
                  src={profile.picture_url || undefined}
                  alt="Profile picture"
                  sx={{ width: 72, height: 72 }}
                />
              </Tooltip>
            </Box>
          )}

          {/* Inputul e activ doar dacă are voie să editeze */}
          {canEdit && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          )}

          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.5 }}
              title={
                ethnicity
                  ? lang === "ro"
                    ? ethnicity.name_ro
                    : ethnicity.name_en
                  : undefined
              }
            >
              <Typography variant="h5">
                {formatNameSafe(profile.name, lang)}
              </Typography>
              {profile?.personality && (
                <Tooltip
                  title={lang === "ro" ? "Personalitate" : "Personality"}
                >
                  <StarIcon fontSize="small" sx={{ color: "#f5c518" }} />
                </Tooltip>
              )}
              {!profile?.personality && isAdmin && (
                <Tooltip
                  title={lang === "ro" ? "Fă vedetă" : "Make personality"}
                >
                  <span>
                    <IconButton
                      size="small"
                      disabled={promoting}
                      onClick={async () => {
                        const ok = confirm(
                          lang === "ro"
                            ? "Sigur vrei să marchezi acest profil ca vedetă?"
                            : "Are you sure you want to mark this profile as a personality?"
                        );
                        if (!ok || !profile?.tree_ref) return;

                        try {
                          setPromoting(true);
                          await api.patch(`/profiles/${profile.tree_ref}`, {
                            personality: true,
                          });
                          // update local instant, fără reload
                          setProfile(
                            profile
                              ? { ...profile, personality: true }
                              : profile
                          );
                          notify(
                            lang === "ro"
                              ? "Profil marcat ca vedetă."
                              : "Profile marked as personality.",
                            "success"
                          );
                        } catch (e: any) {
                          console.error(
                            "Set personality failed",
                            e?.response?.data || e
                          );
                          notify(
                            e?.response?.data?.detail ||
                              (lang === "ro"
                                ? "Operațiunea a eșuat."
                                : "Operation failed."),
                            "error"
                          );
                        } finally {
                          setPromoting(false);
                        }
                      }}
                    >
                      <StarBorderIcon
                        fontSize="large"
                        sx={{ color: "#f5c518" }}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {ethnicity && ethnicity?.flag_url && (
                <Box
                  component="img"
                  src={ethnicity.flag_url}
                  alt={lang === "ro" ? ethnicity.name_ro : ethnicity.name_en}
                  sx={{
                    width: 32,
                    height: 20,
                    objectFit: "cover",
                    borderRadius: "2px",
                    boxShadow: 1,
                  }}
                />
              )}
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {birthStr} – {deathStr}
              <span style={{ marginLeft: "5px" }}>
                {ageText && <> ({ageText})</>}
              </span>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "flex", flexDirection: "row" }}
            >
              Tree Ref: {profile.tree_ref}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 1, my: 0.2 }}
              />
              <Tooltip
                title={
                  isCountLoading
                    ? lang === "ro"
                      ? "Se calculează..."
                      : "Calculating..."
                    : lang === "ro"
                    ? "Membri în familie"
                    : "Family members"
                }
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/tree.svg"
                    alt="Tree"
                    width={20}
                    height={20}
                    loading="lazy"
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {isCountLoading ? "…" : familyCount ?? "—"}
                  </Typography>
                </Box>
              </Tooltip>
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              {/* View Tree */}
              <Tooltip
                title={lang === "ro" ? "Vizualizează arborele" : "View Tree"}
              >
                <IconButton
                  size="small"
                  onClick={() =>
                    router.push(`/portal/tree/${profile.tree_ref}`)
                  }
                >
                  <AccountTreeIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>

              {/* Share */}
              <Tooltip title={lang === "ro" ? "Distribuie" : "Share"}>
                <IconButton
                  size="small"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <ShareIcon fontSize="small" color="success" />
                </IconButton>
              </Tooltip>
              {!canEdit && (
                <Tooltip
                  title={
                    lang === "ro"
                      ? "Cere dreptul de proprietate"
                      : "Claim this profile"
                  }
                >
                  <IconButton size="small" onClick={() => setClaimOpen(true)}>
                    <FlagIcon fontSize="small" color="warning" />
                  </IconButton>
                </Tooltip>
              )}

              {canEdit && (
               <Tooltip
  title={lang === "ro" ? "Șterge profilul" : "Delete profile"}
>
  <span>
    <IconButton
      size="small"
      onClick={handleDeleteProfile}
      disabled={deleting}
    >
      {deleting ? (
        <CircularProgress size={16} />
      ) : (
        <DeleteForeverIcon fontSize="small" color="error" />
      )}
    </IconButton>
  </span>
</Tooltip>

              )}

              <Tooltip
                title={
                  lang === "ro"
                    ? "Sugerează copie posibilă"
                    : "Suggest possible duplicate"
                }
              >
                <IconButton
                  size="small"
                  onClick={() => setSuggestCopyOpen(true)}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Vezi copii (cu badge) */}
              <Tooltip
                title={
                  lang === "ro"
                    ? "Vezi copii posibile"
                    : "View possible duplicates"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (!profile?.possible_copies?.length) {
                        notify(
                          lang === "ro"
                            ? "Nu există copii posibile."
                            : "No possible duplicates.",
                          "info"
                        );
                        return;
                      }
                      try {
                        setViewCopiesOpen(true);
                        setCopiesLoading(true);
                        const items = await Promise.all(
                          (profile.possible_copies || []).map(
                            async (tr: string) => {
                              const r = await api.get(`/profiles/${tr}`);
                              return r.data;
                            }
                          )
                        );
                        setCopiesDetails(items);
                      } catch (e) {
                        console.error(e);
                        notify(
                          lang === "ro"
                            ? "Încărcarea a eșuat."
                            : "Failed to load.",
                          "error"
                        );
                        setCopiesDetails([]);
                      } finally {
                        setCopiesLoading(false);
                      }
                    }}
                  >
                    <Badge
                      badgeContent={profile?.possible_copies?.length || 0}
                      color="secondary"
                    >
                      <VisibilityIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  lang === "ro"
                    ? "Personalități înrudite"
                    : "Related personalities"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!personalitiesCount) {
                        notify(
                          lang === "ro"
                            ? "Nu există personalități înrudite."
                            : "No related personalities.",
                          "info"
                        );
                        return;
                      }
                      setViewPersonalitiesOpen(true);
                    }}
                  >
                    <Badge
                      badgeContent={personalitiesCount || 0}
                      color="warning"
                    >
                      <StarIcon fontSize="small" sx={{ color: "#f5c518" }} />
                    </Badge>
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      <Tabs
        value={currentTab}
        onChange={(_, val) => router.push(`/portal/profile/${id}/${val}`)}
        sx={{ mb: 3 }}
      >
        {tabs[lang].map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      {children}

      <ImageViewer
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={profile?.picture_url || ""}
      />

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {lang === "ro" ? "Distribuie profilul" : "Share Profile"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="subtitle2">
            {lang === "ro"
              ? "Distribuie pe rețele sociale:"
              : "Share on social media:"}
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              component="a"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                publicUrl
              )}`}
              target="_blank"
            >
              <FacebookIcon color="primary" />
            </IconButton>

            <IconButton
              component="a"
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                publicUrl
              )}`}
              target="_blank"
            >
              <WhatsAppIcon sx={{ color: "#25D366" }} />
            </IconButton>

            <IconButton
              component="a"
              href={`https://reddit.com/submit?url=${encodeURIComponent(
                publicUrl
              )}&title=${encodeURIComponent("Check out this Robio profile")}`}
              target="_blank"
            >
              <RedditIcon sx={{ color: "#FF5700" }} />
            </IconButton>
          </Box>

          <Divider />

          <Typography variant="subtitle2">
            {lang === "ro" ? "Link direct:" : "Direct link:"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              value={publicUrl}
              InputProps={{ readOnly: true }}
            />
            <Tooltip
              title={copied ? (lang === "ro" ? "Copiat!" : "Copied!") : ""}
            >
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider />

          <Typography variant="subtitle2">
            {lang === "ro"
              ? "Cod embed pentru site-uri/bloguri:"
              : "Embed code for websites/blogs:"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              multiline
              fullWidth
              minRows={4}
              value={iframeCode}
              InputProps={{ readOnly: true }}
            />
            <Tooltip
              title={copied ? (lang === "ro" ? "Copiat!" : "Copied!") : ""}
            >
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(iframeCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            {lang === "ro" ? "Închide" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {lang === "ro" ? "Cere dreptul de proprietate" : "Claim this profile"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {lang === "ro"
              ? "Încarcă o dovadă (poză a unui act de identitate). Un moderator va verifica solicitarea. Imaginea va fi ștearsă automat după decizie."
              : "Upload a proof image (ID photo). A moderator will review your request. The image will be deleted automatically after the decision."}
          </Typography>

          <input
            ref={claimInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const f = e.target.files?.[0] || null;
              setClaimFile(f);
              if (!f) return;
              try {
                setClaimUploading(true);
                const form = new FormData();
                form.append("file", f);
                const up = await api.post("/claims/upload", form, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                setClaimUrl(up.data?.url || "");
              } catch (err) {
                console.error("Claim upload failed", err);
                notify(
                  lang === "ro" ? "Încărcarea a eșuat." : "Upload failed.",
                  "error"
                );
                setClaimUrl("");
                setClaimFile(null);
              } finally {
                setClaimUploading(false);
              }
            }}
          />

          <Stack direction="row" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              onClick={() => claimInputRef.current?.click()}
              disabled={claimUploading}
            >
              {claimFile
                ? lang === "ro"
                  ? "Schimbă imaginea"
                  : "Change image"
                : lang === "ro"
                ? "Selectează imagine"
                : "Select image"}
            </Button>
            {claimUploading && <CircularProgress size={18} />}
          </Stack>

          {claimUrl && (
            <Box
              sx={{
                border: (t) => `1px solid ${t.palette.divider}`,
                borderRadius: 1,
                p: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={claimUrl}
                alt="proof"
                style={{ maxWidth: "100%", display: "block", borderRadius: 8 }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setClaimOpen(false)}>
            {lang === "ro" ? "Anulează" : "Cancel"}
          </Button>
          <Button
            variant="contained"
            disabled={!claimUrl}
            onClick={async () => {
              try {
                if (!profile?.tree_ref || !claimUrl) return;
                await api.post("/claims/create", {
                  profile_tree_ref: profile.tree_ref,
                  proof_url: claimUrl,
                });
                notify(
                  lang === "ro"
                    ? "Cerererea a fost trimisă. Vei fi notificat după procesare."
                    : "Claim submitted. You will be notified after review.",
                  "success"
                );
                setClaimOpen(false);
                setClaimFile(null);
                setClaimUrl("");
              } catch (e: any) {
                console.error("Create claim failed", e?.response?.data || e);
                notify(
                  e?.response?.data?.message ||
                    (lang === "ro"
                      ? "Trimiterea cererii a eșuat."
                      : "Claim submission failed."),
                  "error"
                );
              }
            }}
          >
            {lang === "ro" ? "Trimite cererea" : "Submit claim"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewCopiesOpen}
        onClose={() => setViewCopiesOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {lang === "ro"
            ? "Copii posibile ale profilului"
            : "Possible duplicates for this profile"}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 1 }}>
          {copiesLoading ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : copiesDetails.length === 0 ? (
            <Typography color="text.secondary">
              {lang === "ro"
                ? "Nu există copii salvate."
                : "No saved possible duplicates."}
            </Typography>
          ) : (
            copiesDetails.map((p, idx) => (
              <Box
                key={p.tree_ref}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  ...(idx % 2 === 1
                    ? { backgroundColor: (t) => t.palette.action.hover }
                    : null),
                }}
              >
                <Avatar
                  src={p.picture_url || undefined}
                  sx={{ width: 32, height: 32 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                    title={formatNameSafe(p?.name, lang)}
                  >
                    {formatNameSafe(p?.name, lang)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1.3 }}
                  >
                    {formatDateObject(p?.birth?.date, lang, "birth")} —{" "}
                    {formatDateObject(
                      p?.death?.date,
                      lang,
                      "death",
                      p?.deceased
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      window.open(`/portal/profile/${p.tree_ref}`, "_blank")
                    }
                  >
                    {lang === "ro" ? "Deschide" : "Open"}
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    onClick={async () => {
                      const ok = confirm(
                        lang === "ro"
                          ? "Elimini această legătură de copii posibile?"
                          : "Remove this possible-duplicate link?"
                      );
                      if (!ok) return;
                      try {
                        await api.post("/profiles/possible_copies/unlink", {
                          a_tree_ref: profile?.tree_ref,
                          b_tree_ref: p.tree_ref,
                        });
                        // reîncarcă lista
                        const ref = await api.get(
                          `profiles/${profile?.tree_ref}`
                        );
                        setProfile(ref.data);
                        setCopiesDetails((prev) =>
                          prev.filter((x) => x.tree_ref !== p.tree_ref)
                        );
                        notify(
                          lang === "ro"
                            ? "Legătură eliminată."
                            : "Link removed.",
                          "success"
                        );
                      } catch (e: any) {
                        console.error(e?.response?.data || e);
                        notify(
                          e?.response?.data?.detail ||
                            (lang === "ro"
                              ? "Operațiunea a eșuat."
                              : "Operation failed."),
                          "error"
                        );
                      }
                    }}
                  >
                    {lang === "ro" ? "Elimină" : "Remove"}
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewCopiesOpen(false)}>
            {lang === "ro" ? "Închide" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Sugerează copie — folosește SelectOrCreateProfileModal în modul "pick_people" */}
      {profile && (
        <SelectOrCreateProfileModal
          open={suggestCopyOpen}
          onClose={() => setSuggestCopyOpen(false)}
          subjectTreeRef={profile.tree_ref}
          mode="pick_people"
          suggestion
          selectionOnly
          titleOverride={
            lang === "ro"
              ? "Sugerează copie posibilă"
              : "Suggest possible duplicate"
          }
          onPicked={async (hit: any) => {
            const sure = confirm(
              lang === "ro"
                ? `Confirmați legarea ca "posibile copii" între \n${profile.tree_ref} și ${hit.tree_ref}?`
                : `Confirm linking as "possible copies" between \n${profile.tree_ref} and ${hit.tree_ref}?`
            );
            if (!sure) return;

            try {
              await api.post("/profiles/possible_copies/link", {
                a_tree_ref: profile.tree_ref,
                b_tree_ref: hit.tree_ref,
              });
              // refresh profil ca să vedem badge-ul actualizat
              const ref = await api.get(`profiles/${profile.tree_ref}`);
              setProfile(ref.data);
              notify(
                lang === "ro" ? "Legătură adăugată." : "Link added.",
                "success"
              );
            } catch (e: any) {
              console.error(e?.response?.data || e);
              notify(
                e?.response?.data?.detail ||
                  (lang === "ro"
                    ? "Operațiunea a eșuat."
                    : "Operation failed."),
                "error"
              );
            } finally {
              setSuggestCopyOpen(false);
            }
          }}
          onDone={() => {}}
        />
      )}
      <Dialog
        open={viewPersonalitiesOpen}
        onClose={() => setViewPersonalitiesOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {lang === "ro" ? "Personalități înrudite" : "Related personalities"}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 1 }}>
          {personalitiesLoading ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : personalities.length === 0 ? (
            <Typography color="text.secondary">
              {lang === "ro"
                ? "Nu există personalități înrudite."
                : "No related personalities."}
            </Typography>
          ) : (
            personalities.map((p, idx) => (
              <Box
                key={p.tree_ref}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  ...(idx % 2 === 1
                    ? { backgroundColor: (t) => t.palette.action.hover }
                    : null),
                }}
              >
                <Avatar
                  src={p.picture_url || undefined}
                  sx={{ width: 32, height: 32 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    noWrap
                    title={formatNameSafe(p?.name, lang)}
                  >
                    {formatNameSafe(p?.name, lang)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1.3 }}
                  >
                    {formatDateObject(p?.birth?.date, lang, "birth")} —{" "}
                    {formatDateObject(
                      p?.death?.date,
                      lang,
                      "death",
                      p?.deceased
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      window.open(`/portal/profile/${p.tree_ref}`, "_blank")
                    }
                  >
                    {lang === "ro" ? "Deschide" : "Open"}
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPersonalitiesOpen(false)}>
            {lang === "ro" ? "Închide" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
