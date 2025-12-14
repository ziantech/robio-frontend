
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import FamilyTree from "@/lib/familytree";

import api from "@/lib/api";
import { formatDateObject } from "@/utils/formatDateObject";
import { useLanguage } from "@/context/LanguageContext";
import {
  AppBar,
  Toolbar,
  Stack,
  Typography,
  Box,
  Tooltip,
  IconButton,
  Chip,
  Popover,
  Slider,
  TextField,
} from "@mui/material";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import TuneIcon from "@mui/icons-material/Tune";
import IosShareIcon from "@mui/icons-material/IosShare";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import SelectOrCreateProfileModal from "@/components/CreateProfileModal";
import { useAuth } from "@/context/AuthContext";
import { formatName } from "@/utils/formatName";

export type NameObject = {
  title?: string;
  first?: string | string[];
  last?: string | string[];
  maiden?: string;
  suffix?: string;
  display?: string;
};

export type NodeIn = {
  id: string;
  profile_ref?: string;
  name: string | NameObject;
  birth?: any;
  death?: any;
  sex?: { value?: "male" | "female" | "unknown" } | any;
  picture_url?: string | null;
  mid?: string;
  fid?: string;
  pids?: string[];
  tags?: string[];
  owner_id?: string | null;
  deceased?: boolean;
};


const coerceNameArrays = (n: NameObject | undefined | null) => ({
  title: n?.title ?? "",
  first: Array.isArray(n?.first) ? n!.first : (n?.first ? [String(n.first)] : []),
  last: Array.isArray(n?.last) ? n!.last : (n?.last ? [String(n.last)] : []),
  maiden: n?.maiden ?? "",
  suffix: n?.suffix ?? "",
});

const toLabel = (n: string | NameObject, lang: "ro" | "en"): string => {
  if (typeof n === "string") return n || "N/A";
  if (n?.display && typeof n.display === "string") return n.display;

  // folosim formatName (maiden cu etichetă "born/născută", fără virgulă înainte de sufix)
  const label = formatName(coerceNameArrays(n), { lang, maidenStyle: "label" }).trim();
  return label || "N/A";
};

export default function FamilyTreePage() {
  const { tree_ref } = useParams<{ tree_ref: string }>();
  const search = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const { id: currentUserId } = useAuth();

  const [up, setUp] = useState<number>(Number(search.get("up")) || 5);
  const [down, setDown] = useState<number>(Number(search.get("down")) || 3);
  const [maxNodes, setMaxNodes] = useState<number>(
    Number(search.get("max_nodes")) || 2500
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    { root_id: string; nodes: NodeIn[]; meta?: any } | null
  >(null);

  const ftOwners = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const n of data?.nodes ?? []) m[n.id] = n.owner_id ?? null;
    return m;
  }, [data]);

  const [relModal, setRelModal] = useState<{
    open: boolean;
    subject?: string;
    mode?: "add_parent" | "add_spouse" | "add_child";
  }>({ open: false });


  
  const canEditNode = (id: string) =>
    !!currentUserId && ftOwners[id] === currentUserId;

  const openRel = (
    mode: "add_parent" | "add_spouse" | "add_child",
    subject: string
  ) => setRelModal({ open: true, mode, subject });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const uploadForRef = useRef<string | null>(null);
  const closeRel = () => setRelModal({ open: false });

  const reloadTree = () => {
    window.location.reload();
  };

  const { lang } = useLanguage();

  const shareTree = async (up: number, down: number, maxNodes: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("up", String(up));
    url.searchParams.set("down", String(down));
    url.searchParams.set("max_nodes", String(maxNodes));
    const shareUrl = url.toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Arbore genealogic", url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copiat în clipboard.");
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const ref = uploadForRef.current;
    if (!file || !ref) return;

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/profiles/upload_picture/${ref}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUrl = res?.data?.url;
      if (newUrl) {
        setData((prev) => {
          if (!prev) return prev as any;
          return {
            ...prev,
            nodes: prev.nodes.map((n) =>
             (n.profile_ref === ref || n.id === ref) ? { ...n, picture_url: newUrl } : n
            ),
          } as any;
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      uploadForRef.current = null;
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    async function run() {
      if (!tree_ref) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/tree/get/${tree_ref}` as const, {
          params: { up, down, max_nodes: maxNodes },
          signal: ctrl.signal as any,
        });
       
        if (!cancelled) setData(res.data);
      } catch (e: any) {
        if (!cancelled && e?.name !== "CanceledError")
          setError(e?.message ?? "Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
      try {
        ctrl.abort();
      } catch {}
    };
  }, [tree_ref, up, down, maxNodes]);

  const occCounts = useMemo(() => {
  const m = new Map<string, number>();
  for (const n of data?.nodes ?? []) {
    const ref = n.profile_ref || String(n.id);
    m.set(ref, (m.get(ref) || 0) + 1);
  }
  return m;
}, [data]);

  const ftNodes = useMemo(() => {
    if (!data?.nodes) return [] as any[];
    const rootId = data.root_id;
    return data.nodes.map((n) => {
    const ref = n.profile_ref || String(n.id);
    const occ = occCounts.get(ref) ?? 1;
    const badge_text = occ > 1 ? String(occ) : "";
    const badge_display = occ > 1 ? "block" : "none";

    const badge_tip =
      occ > 1
        ? (lang === "ro"
            ? `Apariții: ${occ}. Click pentru a sări între ele.`
            : `Appears ${occ} times. Click to hop between them.`)
        : "";
      const g =
        n?.sex?.value === "male"
          ? "male"
          : n?.sex?.value === "female"
          ? "female"
          : "unknown";
      const tags = new Set<string>(n.tags ?? []);
      tags.add(g);
      if (n.id === rootId) tags.add("root");

      const life = [
        formatDateObject?.(n.birth ? n.birth.date : null, lang, "birth"),
        formatDateObject?.(
          n.death ? n.death.date : null,
          lang,
          "death",
          n.deceased
        ),
      ]
        .filter(Boolean)
        .join(" – ");

      return {
        id: String(n.id),                 
      ref,  
        mid: (n as any).mid,
        fid: (n as any).fid,
        pids: n.pids,
        name: toLabel(n.name, lang),
        img: n.picture_url || undefined,
        life,
        tags: Array.from(tags),
         badge_text,
          badge_display,
          badge_tip,
         owner_id: n.owner_id ?? null,
      } as any;
    });
  }, [data, lang]);

const idToRef = useMemo(() => {
  const m: Record<string, string> = {};
  for (const n of ftNodes) m[n.id] = (n as any).ref || n.id;
  return m;
}, [ftNodes]);

// 2) owners by canonical ref (nu pe id-ul nodului, ca aliasurile au id-uri diferite)
// const ownersByRef = useMemo(() => {
//   const m: Record<string, string | null> = {};
//   for (const n of data?.nodes ?? []) {
//     const ref = (n as any).profile_ref || String(n.id);
//     m[ref] = n.owner_id ?? null;
//   }
//   return m;
// }, [data]);
  const appearancesMap = useMemo(() => {
  const m: Record<string, string[]> = {};
  for (const nn of ftNodes) {
    const r = (nn as any).ref;
    if (!m[r]) m[r] = [];
    m[r].push(nn.id);
  }
  // ordonare stabilă, dacă vrei
  for (const k of Object.keys(m)) m[k] = Array.from(new Set(m[k]));
  return m;
}, [ftNodes]);


const hopIdxRef = useRef<Record<string, number>>({});


  // Linii vizibile
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-ft-lines", "1");
    style.innerHTML = `
      #tree svg [data-l-id] path,
      #tree svg [data-m-id] path {
        stroke: #000 !important;
        stroke-opacity: 1 !important;
        stroke-width: 1.6 !important;
      }

          #tree svg g.occ_badge[data-tip=""] { display: none; }
    #tree svg g.occ_badge:not([data-tip=""]) { display: block; }
    `;
    document.head.appendChild(style);
    return () =>
      document.head.querySelector('style[data-ft-lines="1"]')?.remove();
  }, []);

  // Templates (design-ul tău, neschimbat)
  useEffect(() => {
    const W = 300, H = 140, PAD = 10, IMG = 56;
    const TEXT_X = PAD + IMG + 8, NAME_WIDTH = W - TEXT_X - PAD;

    const base = (src: any, stroke: string) => {
      const t = Object.assign({}, src);
      t.size = [W, H];
      t.node = `
  <rect x="0" y="0" height="{h}" width="{w}" rx="12" ry="12" fill="#ffffff" stroke="${stroke}" stroke-width="2"></rect>
  <rect data-ctrl-node-id="{id}" x="-1" y="-1" width="1" height="1" fill="transparent"></rect>`;
      t.img_0 = `
<g data-node-id="{id}" data-avatar="1" style="cursor:pointer">
  <clipPath id="img_clip_{id}">
    <rect x="${PAD}" y="${PAD}" rx="8" ry="8" height="${IMG}" width="${IMG}"></rect>
  </clipPath>
  <image preserveAspectRatio="xMidYMid slice" clip-path="url(#img_clip_{id})"
         xlink:href="{val}" x="${PAD}" y="${PAD}" height="${IMG}" width="${IMG}"
         style="pointer-events:none"></image>
  <rect x="${PAD}" y="${PAD}" width="${IMG}" height="${IMG}"
        fill="#000" fill-opacity="0.001" pointer-events="all" data-avatar-hit="1"></rect>
</g>`;
      t.field_0 = `<text class="field_0" data-text-overflow="multiline" data-width="${NAME_WIDTH}"
             style="font-size:13px;font-weight:600;line-height:1.2;"
             x="${TEXT_X}" y="${PAD + 20}" text-anchor="start">{val}</text>`
             
       t.field_1 = `<text class="field_1" data-text-overflow="multiline" data-width="${NAME_WIDTH}"
              style="font-size:11px;opacity:.75"
             x="${TEXT_X}" y="${PAD + 64}" text-anchor="start">{val}</text>`;
         
            // field_2 = grupul badge-ului; {val} controlează vizibilitatea (block/none)
   t.field_2 = `
<g class="occ_badge"
   data-tip="{val}"
   title="{val}"
   aria-label="{val}"
   transform="translate(${TEXT_X}, ${PAD + 88})"
   style="cursor:pointer">
  <image xlink:href="/tree-multiple.svg" x="0" y="-12" width="44" height="24"></image>
  <!-- strat de hit pentru click -->
  <rect class="occ_badge" x="0" y="-12" width="44" height="24" fill="transparent"></rect>
</g>`;

      // field_3 = numărul centrat peste SVG (pointer-events off ca să ia click grupul)
      t.field_3 = `<text class="occ_badge"
        x="${TEXT_X + 32}" y="${PAD + 89}"
        text-anchor="middle" dominant-baseline="middle"
        style="font-size:12px;font-weight:700;fill:#065F46;pointer-events:none">{val}</text>`;       

      t.nodeMenuButton = `<g style="cursor:pointer;" transform="matrix(1,0,0,1,${W - PAD - 20},${H - PAD - 18})" data-ctrl-n-menu-id="{id}">
         <rect x="-4" y="-10" fill="#000000" fill-opacity="0" width="22" height="22"></rect>
         <circle cx="0"  cy="0" r="1.8" fill="#6B7280"></circle>
         <circle cx="6"  cy="0" r="1.8" fill="#6B7280"></circle>
         <circle cx="12" cy="0" r="1.8" fill="#6B7280"></circle>
       </g>`;
      t.ripple = { radius: 0 };
      return t;
    };

    (FamilyTree as any).templates.z_male = base((FamilyTree as any).templates.tommy, "#3B82F6");
    (FamilyTree as any).templates.z_female = base((FamilyTree as any).templates.tommy, "#EC4899");
    (FamilyTree as any).templates.z_unknown = base((FamilyTree as any).templates.tommy, "#9CA3AF");
    (FamilyTree as any).templates.z_root = base((FamilyTree as any).templates.tommy, "#10B981");
    (FamilyTree as any).templates.z_alias = (FamilyTree as any).templates.z_unknown;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // cleanup
    if (instanceRef.current) {
      try { instanceRef.current.destroy?.(); } catch {}
      instanceRef.current = null;
      el.innerHTML = "";
    }

    if (!data || !ftNodes.length) return;

    const options: any = {
      template: "z_unknown",
      mouseScroll: (FamilyTree as any).action.zoom,
      enableSearch: false,
      toolbar: true,
      miniMap: false,
      lazyLoading: false,
      nodeMouseClick: (FamilyTree as any).action.menu,
       nodeBinding: { field_0: "name", field_1: "life", img_0: "img", field_2: "badge_tip", field_3: "badge_text" },
      tags: {
        male: { template: "z_male" },
        female: { template: "z_female" },
        unknown: { template: "z_unknown" },
        root: { template: "z_root" },
        alias: { template: "z_alias" },
      },
      // FamilyTree știe slinks în config; îl păstrăm + fallback mai jos
      
      nodeMenu: { 
    view_profile: { 
        text: lang === "ro" ? "Vezi profil" : "View profile", 
        icon: (FamilyTree as any).icon.add?.(18, 18, "#6B7280"), 
        onClick: (id: string) => {
          const ref = idToRef[id] || id;                                // <—
      window.open(`/portal/profile/${ref}`, "_blank");
        }, 
    }, 
    add_spouse: { 
        text: lang === "ro" ? "Adaugă soț/partener" : "Add spouse/partner", 
        icon: (FamilyTree as any).icon.add?.(18, 18, "#2563EB"), 
        disabled: (id: string) => !canEditNode(id), 
        tooltip: (id: string) => !canEditNode(id) ? lang === "ro" ? "Doar proprietarul acestui profil poate edita" : "Only this profile's owner can edit" : undefined, 
        onClick: (id: string) => {
          if (!canEditNode(id)) return;
          const n = (family as any).getNode?.(id);
          const ref = n?.ref || id;
          openRel("add_spouse", ref);
        }, 
    }, 
    add_child: { 
        text: lang === "ro" ? "Adaugă copil" : "Add child", 
        icon: (FamilyTree as any).icon.add?.(18, 18, "#2563EB"), 
        disabled: (id: string) => !canEditNode(id), 
        tooltip: (id: string) => !canEditNode(id) ? lang === "ro" ? "Doar proprietarul acestui profil poate edita" : "Only this profile's owner can edit" : undefined, 
         onClick: (id: string) => {
    if (!canEditNode(id)) return;
    const n = (family as any).getNode?.(id);
    const ref = n?.ref || id;
    openRel("add_child", ref);
  }
    }, 
    add_parent: { 
        text: lang === "ro" ? "Adaugă părinte" : "Add parent", 
        icon: (FamilyTree as any).icon.add?.(18, 18, "#2563EB"), 
        disabled: (id: string, node: any) => !canEditNode(id) || !!(node?.mid && node?.fid), 
        tooltip: (id: string, node: any) => !canEditNode(id) ? lang === "ro" ? "Doar proprietarul acestui profil poate edita" : "Only this profile's owner can edit" : node?.mid && node?.fid ? lang === "ro" ? "Are deja doi părinți" : "Already has two parents" : undefined, 
        onClick: (id: string) => { if (!canEditNode(id)) return; const n = (family as any).getNode?.(id); if (n?.mid && n?.fid) return; const ref = n?.ref || id; openRel("add_parent", ref); }, 
    }, 
},
      nodes: ftNodes,
    };

    const family = new (FamilyTree as any)(el, options);

    // // Fallback: addSlink dacă ai o versiune care nu citește opțiunea
    // try {
    //   const sl: Array<{ from: string; to: string; label?: string }> =
    //     Array.isArray(data?.meta?.slinks) ? data!.meta!.slinks : [];
    //   if (sl?.length && typeof (family as any).addSlink === "function") {
    //     for (const s of sl) {
    //       if (s?.from && s?.to && s.from !== s.to) {
    //         family.addSlink(String(s.from), String(s.to), s.label || "same");
    //       }
    //     }
    //     family.draw?.();
    //   }
    // } catch {}

    const rootId = data.root_id;
    family.on("init", () => {
      if (rootId) family.center(rootId, { padding: 60 });
    });

    // Avatar -> upload
  family.on("click", (_sender: any, args: any) => {
  const targetEl = args?.event?.target as Element | null;
  if (!targetEl) return;

  // 1) Avatar upload (păstrăm logica ta)
  const nodeId = args?.node?.id as string | undefined;
  if (!nodeId) return;

  const hitAvatar = targetEl.closest('[data-avatar="1"], [data-avatar-hit="1"]');
  if (hitAvatar) {
    if (!canEditNode(nodeId)) return;
    args.event?.preventDefault?.();
    args.event?.stopPropagation?.();

    const n = (family as any).getNode?.(nodeId);
    const ref = n?.ref || nodeId;                  // <— folosim profile_ref pentru upload
    uploadForRef.current = ref;
    fileRef.current?.click();
    return;
  }

  // 2) Badge ×N -> center următoarea apariție
  const hitBadge = targetEl.closest('.occ_badge');
  if (hitBadge) {
    const n = (family as any).getNode?.(nodeId);
    const ref = n?.ref || nodeId;
    const list = appearancesMap[ref] || [nodeId];
    if (list.length <= 1) return;

    const idx = (hopIdxRef.current[ref] = ((hopIdxRef.current[ref] ?? -1) + 1) % list.length);
    const pick = list[idx];
    try { instanceRef.current?.center?.(pick, { padding: 60 }); } catch {}
    return;
  }
});

    instanceRef.current = family;
    return () => {
      try { family.destroy?.(); } catch {}
      instanceRef.current = null;
      if (el) el.innerHTML = "";
    };
  }, [ftNodes, data]);

  const centerOn = React.useCallback((id: string) => {
    try { instanceRef.current?.center?.(id, { padding: 60 }); } catch {}
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          bgcolor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56, gap: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mr: 1 }}>
            <AccountTreeIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Arbore genealogic
            </Typography>
          </Stack>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFilePicked}
          />

          <AncestorsControl up={up} setUp={setUp} />
          <DescendantsControl down={down} setDown={setDown} />
          <PerformanceControl
            maxNodes={maxNodes}
            setMaxNodes={setMaxNodes}
            onReset={() => { setUp(12); setDown(6); setMaxNodes(2500); }}
          />

          <Box sx={{ flex: 1 }} />
          <NodeSearch nodes={ftNodes} onSelect={centerOn} />

          <Tooltip title="Share">
            <IconButton
              color="primary"
              onClick={() => shareTree(up, down, maxNodes)}
              size="small"
              sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", mr: 0.5 }}
            >
              <IosShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
    
        </Toolbar>
      </AppBar>

      {loading && <div className="p-4 text-sm text-gray-600">Se încarcă arborele…</div>}
      {error && <div className="p-4 text-sm text-red-600">Eroare: {error}</div>}
      {!loading && !error && data && ftNodes.length === 0 && (
        <div className="p-4 text-sm text-gray-600">Nu există noduri pentru acest arbore.</div>
      )}

      <div ref={containerRef} id="tree" className="flex-1 w-full" style={{ minHeight: "70vh" }} />

      {relModal.open && relModal.mode && relModal.subject && (
        <SelectOrCreateProfileModal
          open
          onClose={closeRel}
          subjectTreeRef={relModal.subject}
          mode={relModal.mode}
          onDone={reloadTree}
        />
      )}
    </div>
  );
}

function AncestorsControl({ up, setUp }: { up: number; setUp: (n: number) => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  return (
    <>
      <Chip
        clickable
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        variant="outlined"
        sx={{ borderRadius: 2, bgcolor: "background.paper" }}
        icon={<NorthIcon sx={{ fontSize: 16 }} />}
        label={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Sus</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{up}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>(până la {upKinship(up)})</Typography>
          </Stack>
        }
      />
      <Popover
        open={open}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, borderRadius: 2 } } }}
      >
        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>Strămoși (în sus)</Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 260 }}>
          <NorthIcon sx={{ color: "text.disabled" }} fontSize="small" />
          <Slider size="small" min={0} max={20} step={1} value={up} onChange={(_, v) => setUp(v as number)} valueLabelDisplay="auto" />
        </Stack>
        <Typography variant="caption" sx={{ mt: 1, color: "text.secondary" }}>
          Afișare până la <b>{upKinship(up)}</b>
        </Typography>
      </Popover>
    </>
  );
}

function DescendantsControl({ down, setDown }: { down: number; setDown: (n: number) => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  return (
    <>
      <Chip
        clickable
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        variant="outlined"
        sx={{ borderRadius: 2, bgcolor: "background.paper" }}
        icon={<SouthIcon sx={{ fontSize: 16 }} />}
        label={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Jos</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{down}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>(până la {downKinship(down)})</Typography>
          </Stack>
        }
      />
      <Popover
        open={open}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, borderRadius: 2 } } }}
      >
        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>Descendenți (în jos)</Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 260 }}>
          <SouthIcon sx={{ color: "text.disabled" }} fontSize="small" />
          <Slider size="small" min={0} max={15} step={1} value={down} onChange={(_, v) => setDown(v as number)} valueLabelDisplay="auto" />
        </Stack>
        <Typography variant="caption" sx={{ mt: 1, color: "text.secondary" }}>
          Afișare până la <b>{downKinship(down)}</b>
        </Typography>
      </Popover>
    </>
  );
}

const upKinship = (n: number) => {
  if (n <= 0) return "doar persoana";
  if (n === 1) return "părinți";
  if (n === 2) return "bunici";
  const prefix = Array(n - 2).fill("stră").join("-");
  return `${prefix}bunici`;
};
const downKinship = (n: number) => {
  if (n <= 0) return "fără descendenți";
  if (n === 1) return "copii";
  if (n === 2) return "nepoți";
  const prefix = Array(n - 2).fill("stră").join("-");
  return `${prefix}nepoți`;
};

function PerformanceControl({
  maxNodes,
  setMaxNodes,
  onReset,
}: { maxNodes: number; setMaxNodes: (n: number) => void; onReset: () => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  return (
    <>
      <Chip
        clickable
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        variant="outlined"
        sx={{ borderRadius: 2, bgcolor: "background.paper" }}
        icon={<TuneIcon sx={{ fontSize: 16 }} />}
        label={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Noduri</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{maxNodes}</Typography>
          </Stack>
        }
      />
      <Popover
        open={open}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, borderRadius: 2, minWidth: 280 } } }}
      >
        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>Limită noduri (performanță)</Typography>
        <Stack spacing={2}>
          <Slider size="small" min={50} max={5000} step={50} value={maxNodes} onChange={(_, v) => setMaxNodes(v as number)} valueLabelDisplay="auto" />
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <TextField size="small" type="number" inputProps={{ min: 50, max: 5000, step: 50 }}
              value={maxNodes} onChange={(e) => setMaxNodes(Number(e.target.value))} sx={{ width: 120 }} />
            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={onReset}><RestartAltIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => setAnchor(null)}><RefreshIcon fontSize="small" /></IconButton>
            </Stack>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}

function NodeSearch({ nodes, onSelect }: { nodes: Array<{ id: string; name?: string }>; onSelect: (id: string) => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [q, setQ] = React.useState("");
  const open = Boolean(anchor);
  const results = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const scored = nodes
      .map((n) => ({
        id: n.id,
        name: (n as any).name?.toString?.() ?? "",
        idx: ((n as any).name?.toString?.() ?? "").toLowerCase().indexOf(query),
      }))
      .filter((x) => x.idx >= 0)
      .sort((a, b) => a.idx - b.idx || a.name.length - b.name.length)
      .slice(0, 12);
    return scored;
  }, [nodes, q]);
  const handlePick = (id: string) => {
    onSelect(id);
    setAnchor(null);
    setQ("");
  };
  return (
    <>
      <Tooltip title="Caută persoană">
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", mr: 0.5 }}
        >
          <SearchIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 1.5, borderRadius: 2, width: 360 } } }}
      >
        <TextField
          autoFocus fullWidth size="small" placeholder="Caută după nume sau ID…"
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) handlePick(results[0].id);
            if (e.key === "Escape") setAnchor(null);
          }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
        />
        <List dense sx={{ mt: 1, maxHeight: 280, overflowY: "auto" }}>
          {q && results.length === 0 && (
            <ListItemText primaryTypographyProps={{ variant: "caption", color: "text.secondary" }} primary="Niciun rezultat" sx={{ px: 1 }} />
          )}
          {results.map((r) => (
            <ListItemButton key={r.id} onClick={() => handlePick(r.id)}>
              <ListItemText
                primaryTypographyProps={{ variant: "body2" }}
                secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                primary={r.name}
                secondary={r.id}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
}
