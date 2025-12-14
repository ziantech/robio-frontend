/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @next/next/no-img-element */
"use client";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";
import {
  Typography,
  Stack,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

function formatName(n: any): string {
  if (!n) return "";
  const first = Array.isArray(n?.first) ? n.first.join(" ") : (n?.first || "");
  const last  = Array.isArray(n?.last)  ? n.last.join(" ")  : (n?.last  || "");
  const maiden = n?.maiden ? ` (${n.maiden})` : "";
  return `${first} ${last}`.trim() + maiden;
}
function yearSpan(b: any, d: any): string {
  const by = b?.date?.year || "";
  const dy = d?.date?.year || "";
  if (!by && !dy) return "";
  return `${by || "?"} – ${dy || "?"}`;
}

type ProfileHit = { id: string; name?: any; birth?: any; death?: any; picture_url?: string | null; };
type PlaceHit   = { id: string; settlement_name?: string | null; region_name?: string | null; country_name?: string | null; };
type CemeteryHit= { id: string; name: string; place?: { city?: string|null; county?: string|null; country?: string|null }|null; };

function SearchModal({
  open, onClose, query, forceTab, onOpenResult
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  forceTab?: number;
  onOpenResult: (dest: string) => void; // ce facem când user dă click pe un rezultat
}) {
  const [tab, setTab] = useState(forceTab ?? 0);
  useEffect(() => setTab(forceTab ?? 0), [forceTab]);

  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<ProfileHit[]>([]);
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [cems, setCems]     = useState<CemeteryHit[]>([]);
  const [err, setErr]       = useState<string | null>(null);

  useEffect(() => {
    if (!open || !query?.trim()) return;
    let active = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const [pr, pl, ce] = await Promise.allSettled([
          api.get("/search/profiles", { params: { q: query, limit: 50 } }),
          api.get("/search/places",   { params: { q: query, limit: 50 } }),
          api.get("/search/cemeteries",{ params:{ q: query, limit: 50 } }),
        ]);
        if (!active) return;
        setPeople(pr.status==="fulfilled" ? (pr.value.data?.items || pr.value.data || []) : []);
        setPlaces(pl.status==="fulfilled" ? (pl.value.data?.items || []) : []);
        setCems(  ce.status==="fulfilled" ? (ce.value.data?.items || []) : []);
      } catch (e:any) {
        if (active) setErr(e?.message || "Search failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, query]);

  const Empty = (
    <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
      <Typography variant="body2">Nu am găsit rezultate.</Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx:{ borderRadius:3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="h6">Rezultate pentru “{query}”</Typography>
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ minHeight:36, height:36 }}>
            <Tab label={<Stack direction="row" gap={1}><span>Persoane</span><Chip size="small" label={people.length}/></Stack>} sx={{ minHeight:36, height:36 }}/>
            <Tab label={<Stack direction="row" gap={1}><span>Locații</span><Chip size="small" label={places.length}/></Stack>} sx={{ minHeight:36, height:36 }}/>
            <Tab label={<Stack direction="row" gap={1}><span>Cimitire</span><Chip size="small" label={cems.length}/></Stack>} sx={{ minHeight:36, height:36 }}/>
          </Tabs>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ py: 6, display: "grid", placeItems: "center" }}><CircularProgress/></Box>
        ) : err ? (
          <Box sx={{ py: 4, color: "error.main" }}>{err}</Box>
        ) : (
          <>
            {tab===0 && (
              people.length ? (
                <List dense>
                  {people.map(p=>{
                    const title = formatName(p.name) || "—";
                    const years = yearSpan(p.birth,p.death);
                    return (
                      <ListItem key={p.id}
                        onClick={()=>onOpenResult(`/profile/${p.id}`)}
                        secondaryAction={
                          <Tooltip title="Deschide">
                            <IconButton edge="end" onClick={()=>onOpenResult(`/profile/${p.id}`)}>
                              <OpenInNewIcon/>
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{ borderRadius:1, '&:hover':{ bgcolor:'action.hover' } }}
                      >
                        <ListItemAvatar><Avatar src={p.picture_url || undefined} alt={title}/></ListItemAvatar>
                        <ListItemText primary={<Typography variant="subtitle2" noWrap>{title}</Typography>}
                                      secondary={<Typography variant="caption" color="text.secondary" noWrap>{years}</Typography>}/>
                      </ListItem>
                    );
                  })}
                </List>
              ):Empty
            )}
            {tab===1 && (
              places.length ? (
                <List dense>
                  {places.map(pl=>{
                    const label = [pl.settlement_name,pl.region_name,pl.country_name].filter(Boolean).join(", ");
                    return (
                      <ListItem key={pl.id} onClick={()=>onOpenResult(`/locations/${pl.id}`)}
                        sx={{ borderRadius:1, '&:hover':{ bgcolor:'action.hover' } }}>
                        <ListItemAvatar><Avatar>{(pl.settlement_name||pl.country_name||"?").slice(0,1)}</Avatar></ListItemAvatar>
                        <ListItemText primary={<Typography variant="subtitle2" noWrap>{label||"—"}</Typography>} />
                      </ListItem>
                    );
                  })}
                </List>
              ):Empty
            )}
            {tab===2 && (
              cems.length ? (
                <List dense>
                  {cems.map(c=>{
                    const place = c.place ? [c.place.city,c.place.county,c.place.country].filter(Boolean).join(", ") : "";
                    return (
                      <ListItem key={c.id} onClick={()=>onOpenResult(`/cemeteries/${c.id}`)}
                        sx={{ borderRadius:1, '&:hover':{ bgcolor:'action.hover' } }}>
                        <ListItemAvatar><Avatar>{(c.name||"?").slice(0,1)}</Avatar></ListItemAvatar>
                        <ListItemText primary={<Typography variant="subtitle2" noWrap>{c.name}</Typography>}
                                      secondary={place}/>
                      </ListItem>
                    );
                  })}
                </List>
              ):Empty
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- People (ordinea păstrată) ---------------- */
type Person = { name: string; years: string; img: string };
const PEOPLE: Person[] = [
  { name: "Burebista", years: "82 î.Hr. – 44 î.Hr.", img: "/people/burebista.png" },
  { name: "Decebal", years: "cca. 87 – 106", img: "/people/decebal.png" },
  { name: "Mircea cel Bătrân", years: "1355 – 1418", img: "/people/mircea.png" },
  { name: "Vlad Țepeș", years: "1431 – 1476", img: "/people/vlad.png" },
  { name: "Radu cel Frumos", years: "1435 – 1475", img: "/people/radu.png" },
  { name: "Ștefan cel Mare", years: "cca. 1433 – 1504", img: "/people/stefan.png" },
  { name: "Matei Corvin", years: "1443 – 1490", img: "/people/matei.png" },
  { name: "Mihai Viteazul", years: "1558 – 1601", img: "/people/mihai.png" },
  { name: "Tudor Vladimirescu", years: "1780 – 1821", img: "/people/tudor.png" },
  { name: "Alexandru Ioan Cuza", years: "1820 – 1873", img: "/people/cuza.png" },
  { name: "Vasile Alecsandri", years: "1821 – 1890", img: "/people/alecsandri.png" },
  { name: "Nicolae Grigorescu", years: "1838 – 1907", img: "/people/grigorescu.png" },
  { name: "Ion Creangă", years: "1837 – 1889", img: "/people/creanga.png" },
  { name: "Ion Luca Caragiale", years: "1852 – 1912", img: "/people/caragiale.png" },
  { name: "Mihai Eminescu", years: "1850 – 1889", img: "/people/eminescu.png" },
  { name: "Nicolae Iorga", years: "1871 – 1940", img: "/people/iorga.png" },
  { name: "Constantin Brâncuși", years: "1876 – 1957", img: "/people/brancusi.png" },
  { name: "Aurel Vlaicu", years: "1882 – 1913", img: "/people/vlaicu.png" },
  { name: "George Enescu", years: "1881 – 1955", img: "/people/enescu.png" },
  { name: "George Bacovia", years: "1881 – 1957", img: "/people/bacovia.png" },
  { name: "Liviu Rebreanu", years: "1885 – 1944", img: "/people/rebreanu.png" },
  { name: "Ecaterina Teodoroiu", years: "1894 – 1917", img: "/people/ecaterina.png" },
  { name: "Lucian Blaga", years: "1895 – 1961", img: "/people/blaga.png" },
  { name: "Emil Racoviță", years: "1868 – 1947", img: "/people/racovita.png" },
  { name: "Iuliu Maniu", years: "1873 – 1953", img: "/people/maniu.png" },
  { name: "Regele Carol I", years: "1839 – 1914", img: "/people/carol1.png" },
  { name: "Regele Mihai I", years: "1921 – 2017", img: "/people/mihai1.png" },
  { name: "General Ion Antonescu", years: "1882 – 1946", img: "/people/antonescu.png" },
  { name: "Gheorghe Gheorghiu-Dej", years: "1901 – 1965", img: "/people/dej.png" },
  { name: "Nicolae Ceaușescu", years: "1918 – 1989", img: "/people/ceausescu.png" },
];

/* ---------------- helpers ---------------- */
const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/* ---------------- Avatar “node” ---------------- */
function AvatarNode({ p, size = 64 }: { p: Person; size?: number }) {
  return (
    <div className="nodeWrap" tabIndex={0}>
      <img className="nodeImg" src={p.img} alt={p.name} style={{ width: size, height: size }} />
      <div className="nodeTip" style={{zIndex:"99999999"}}>
        <strong>{p.name}</strong>
        <span className="yrs">{p.years}</span>
      </div>
    </div>
  );
}

/* ---------------- Bandă orizontală conectată ---------------- */
function BranchRow({ list, curved = false }: { list: Person[]; curved?: boolean }) {
  return (
    <div className="branchRow" role="group" aria-label="Personalități conectate">
      {list.map((p, i) => (
        <div className="chainItem" key={p.name}>
          <AvatarNode p={p} size={i % 3 === 0 ? 72 : i % 3 === 1 ? 62 : 56} />
          {i < list.length - 1 && (
            curved ? (
              <svg className="curveLink" width="72" height="28" viewBox="0 0 72 28" aria-hidden>
                {/* alternează ușor convex/concav */}
                <path
                  d={i % 2 === 0 ? "M0,14 Q36,-4 72,14" : "M0,14 Q36,32 72,14"}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </svg>
            ) : (
              <span className="chainLink" aria-hidden />
            )
          )}
        </div>
      ))}
    </div>
  );
}


/* --------------------------------- PAGE --------------------------------- */
export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const pathname = usePathname();

  useEffect(() => { 
    if (!isAuthenticated) return;
      if (pathname?.startsWith("/learn")) return;
       router.push("/portal");
    }, [isAuthenticated,pathname, router]);

  // search
  const [q, setQ] = useState("");
const [modalOpen, setModalOpen] = useState(false);
const [forceTab, setForceTab] = useState<number | undefined>(undefined);

const handleSearchSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!q.trim()) return;
  setForceTab(undefined);   // tab implicit: Persoane
  setModalOpen(true);       // 👉 deschide modalul
};

  // stats
  const [stats, setStats] = useState<{profiles?: number; sources?: number; cemeteries?: number}>({});
  useEffect(() => { (async () => {
    try { const r = await api.get("/users/stats/public"); setStats(r.data?.totals || r.data || {}); } catch {}
  })(); }, []);
  const fmt = (n?: number) => typeof n === "number" ? n.toLocaleString() : "—";

  // 4 benzi: 8 / 8 / 8 / rest
  const groups = useMemo(() => {
    const chunks = chunk(PEOPLE, 8);
    return chunks;
  }, []);
const redirectToAuth = (dest?: string) => {
  const next = dest ? `?next=${encodeURIComponent(dest)}` : "";
  router.push(`/register${next}`);
};

  return (
    <div className="lp-wrap">
      <Navbar />

      <main className="flow">
        {/* BAND 1 */}
        <BranchRow list={groups[0] || []} curved />

        {/* HERO */}
        <section className="card glass hero">
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-.02em" }} align="center">
            {t.landing_hero_title || "Construiește-ți Arborele Genealogic — Conectează-te cu Istoria"}
          </Typography>
          <Typography variant="body1" sx={{ opacity: .9, mt: 1.5 }} align="center">
            {t.landing_hero_sub || "Adaugă membrii familiei și poveștile lor. Completezi nume, ani și locuri — noi conectăm punctele în arhive."}
          </Typography>

          <form onSubmit={handleSearchSubmit} className="searchbar">
            <TextField
              fullWidth
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.landing_search_placeholder || "Caută un strămoș, o localitate sau un cimitir..."}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" aria-label="Caută"><SearchIcon /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} justifyContent="center" sx={{ mt: 1.5 }}>
              <Button variant="contained" type="submit">{t.search || "Caută"}</Button>
              <Button variant="outlined" onClick={() => router.push("/register")}>{t.start_your_tree || "Pornește arborele"}</Button>
            </Stack>
          </form>

          <Stack direction="row" spacing={1.2} justifyContent="center" sx={{ mt: 1 }}>
            <Chip label={`${fmt(stats.profiles)} profile`} />
            <Chip label={`${fmt(stats.sources)} colecții`} />
            <Chip label={`${fmt(stats.cemeteries)} cimitire`} />
          </Stack>
        </section>

        {/* BAND 2 */}
        <BranchRow list={groups[1] || []} curved />

        {/* LEARN */}
        <section className="card">
          <h2>Nu știi de unde să începi?</h2>
          <p>
            Ghiduri scurte, practice: cum adaugi prima persoană, cum cauți după nume sau loc,
            cum atașezi surse și cum verifici potrivirile. Îți arătăm pașii, capcanele frecvente
            și exemple reale — astfel progresul vine rapid, fără bătăi de cap.
          </p>
          <div className="cta-row">
            <button className="btnPrimary" onClick={() => router.push("/forum")}>Vezi ghiduri</button>
          </div>
        </section>

        {/* BAND 3 */}
        <BranchRow list={groups[2] || []} curved />

        {/* PARTNERS */}
        <section className="card">
          <h2>Devino partener RoBio – câștigă bani</h2>
          <p>
            Recomandă RoBio prietenilor, comunității sau publicului tău și primești comision
            pentru fiecare abonament activ. Îți oferim link-uri de tracking, materiale promo,
            statistici live și suport. Transformă pasiunea pentru istorie într-un venit recurent.
          </p>
          <div className="cta-row">
            <button className="btnPrimary" onClick={() => router.push("/register")}>
              Află cum poți începe
            </button>
          </div>
        </section>

        {/* BAND 4 (rest) */}
        <BranchRow list={groups[3] || []} curved />
      </main>

      <Footer />

      {/* ---------------- STYLES ---------------- */}
      <style jsx global>{`
        :root {
          --bg: #f6f7fb;
          --card: #ffffff;
          --line: rgba(17,17,17,0.10);
          --glass: rgba(255,255,255,0.72);
          --shadow: 0 18px 36px rgba(16,24,40,0.08);
          --tip: rgba(17,17,17,0.98);
        }
        .lp-wrap { background: var(--bg); color: #111; }

        /* flux vertical compact + axă de “arbore” pe mijloc */
        .flow {
          position: relative;
          width: min(1100px, 94vw);
          margin: 0 auto;
          padding: 28px 0 64px;
        }
        .flow::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;               /* linie continuă până jos */
          width: 2px;
          background-image: linear-gradient(to bottom, var(--line) 60%, transparent 0);
          background-size: 2px 14px; /* punctată */
          background-repeat: repeat-y;
          transform: translateX(-50%);
          z-index: 0;
        }

       .branchRow {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 12px 10px;
  margin: 18px 0;
  /* 👉 banda e peste oricare card */
  z-index: 50;
}
.curveLink {
  color: var(--line); /* folosește aceeași culoare ca liniile punctate */
  flex: 0 0 auto;
}
        .chainItem {
          display: inline-flex;
          align-items: center;
          gap: 14px;
        }
        .chainLink {
          display: inline-block;
          width: clamp(24px, 5vw, 60px);
          height: 2px;
          background-image: linear-gradient(90deg, var(--line) 60%, transparent 0);
          background-size: 10px 2px;
          background-repeat: repeat-x;
        }

        /* carduri secțiuni (centrate pe axă) */
        .card {
  position: relative;
  background: var(--card);
  border: 1px solid #eee;
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 24px 20px;
  text-align: center;
  margin: 10px auto;
  width: min(920px, 92vw);
  /* 👉 cardurile sub avataruri & tooltipuri */
  z-index: 10;
}
        .glass {
          backdrop-filter: saturate(160%) blur(6px);
          background: var(--glass);
          border: 1px solid rgba(255,255,255,0.7);
        }
        .hero { margin-top: 10px; }

        .cta-row { display: flex; justify-content: center; gap: 12px; margin-top: 14px; }
        .btnPrimary { background: #111; color: #fff; border: 0; padding: 10px 16px; border-radius: 12px; cursor: pointer; }

        /* Search */
        .searchbar { margin-top: 10px; }

        /* Avatar node + tooltip */
        .nodeWrap { position: relative; }
        .nodeImg {
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 10px 24px rgba(0,0,0,.12);
          display: block;
          transition: transform .12s ease;
          
        }
        .nodeWrap:hover .nodeImg { transform: translateY(-1px) scale(1.02); }

        .nodeTip {
          position: absolute;
          left: 50%;
          top: calc(100% + 8px);
          transform: translateX(-50%);
          background: var(--tip);
          color: #fff;
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.2;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity .15s ease, transform .15s ease;
          z-index: 2147483647;
          box-shadow: 0 18px 40px rgba(0,0,0,.35);
          text-align: center;
        }
        .nodeTip strong { display: block; font-weight: 800; letter-spacing: .1px; z-index: 2147483647; }
        .nodeTip .yrs { display: block; opacity: .9; margin-top: 2px; z-index: 2147483647;}
        .nodeWrap:hover .nodeTip, .nodeWrap:focus-within .nodeTip {
          opacity: 1; transform: translateX(-50%) translateY(-2px);z-index: 2147483647;
        }

        /* spații mai scurte între secțiuni pe desktop */
        @media (min-width: 900px) {
          .card { padding: 26px 24px; }
          .branchRow { margin: 14px 0; }
        }

        /* mobil: avatarurile pot “curge” pe două rânduri, păstrăm legături scurte */
        @media (max-width: 640px) {
          .branchRow { flex-wrap: wrap; gap: 10px; }
          .chainItem { gap: 10px; }
          .chainLink { width: 28px; }
          .flow::before { left: 20px; transform: none; opacity: .6; } /* axă discretă la margine */
        }
      `}</style>

      <SearchModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  query={q}
  forceTab={forceTab}
  onOpenResult={(dest) => redirectToAuth(dest)}
/>
    </div>
  );
}
