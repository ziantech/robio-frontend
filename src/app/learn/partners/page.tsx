/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Paper,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

import { useLanguage } from "@/context/LanguageContext";
import ImageViewer from "@/components/ImageViewer";

export default function PartnersPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // --------- Copy (fallback if t.learnPartners not present) ----------
  const ro = {
    title: "Portalul Partenerilor",
    desc:
      "Devino partener RoBio: încarci colecții, procesezi registre/fotografii și câștigi credite pentru munca ta.",
    s1: {
      title: "Ce este un partener & cum aplici",
      badge: "Pasul 1",
      p1:
        "Partenerii sunt colaboratori verificați ai RoBio. Ei pot încărca colecții (registre vechi, fotografii din cimitire, documente) și pot procesa surse pentru a extrage persoane și date utile.",
      p2:
        "Cum aplici: în bara de navigare apasă „Portalul Partenerilor”. Vei vedea un buton „Aplică”. Dă click, se deschide formularul (imaginea din stânga). Completezi numele complet și un număr de telefon la care poți fi contactat (WhatsApp sau altă metodă). Un administrator te va contacta și îți va aproba sau respinge aplicația.",
      image_alt: "Formular de aplicare partener (Apply)",
    },
    s2: {
      title: "Portalul partenerilor — prezentare",
      badge: "Pasul 2",
      p1:
        "După aprobare, intri în portal. În partea stângă vezi „My Processing” (ce procesezi acum). În dreapta vezi „Ultimele surse adăugate”.",
      p2:
        "Sus vei vedea câte surse neprocesate sunt în așteptare și un buton „Creează sursă”. Formularul este identic cu cel din portalul utilizatorului, cu diferența că elementele noi merg la aprobare: un administrator poate aproba sau respinge.",
      image_alt: "Portalul partenerilor (overview)",
    },
    s3: {
      title: "Câștiguri & Credite",
      badge: "Monetizare",
      p1:
        "Câștigi credite pentru două activități: 1) încărcare de pagini/imagini în surse; 2) procesare (creare de profile din surse). Rata curentă: 0.1 RON / credit.",
      upload_title: "Încărcare surse (2 credite/pagină)",
      examples: [
        "Încarci un PDF cu 10 imagini (pagini) → 20 credite = 2 RON.",
        "Încarci o colecție cu 150 de fotografii din cimitire → 300 credite = 30 RON.",
      ],
      processing_title: "Procesare (1 credit/profil creat)",
      p2:
        "Când procesezi o sursă, pentru fiecare profil creat din acea sursă primești 1 credit.",
      payout_title: "Retrageri & Stripe",
      p3:
        "Retragi banii din Setări → Financiar. Te conectezi la Stripe (partenerul nostru de plăți), completezi datele contului și încasezi prin Stripe.",
    },
    s4: {
      title: "Procesarea surselor — flux de lucru",
      badge: "Pas cu pas",
      p1:
        "Procesarea înseamnă să parcurgi sursa și să extragi persoane/date. Ai la dispoziție 5 zile pentru fiecare sursă începută; poți extinde o singură dată cu +5 zile.",
      steps_title: "Pașii principali",
      steps: [
        "Deschide sursa și apasă „Începe procesarea”.",
        "Citește paginile și creează profile pentru persoanele găsite (nașteri, căsătorii, decese etc.).",
        "Completează datele esențiale (nume, date, locuri) și atașează sursa la profil.",
        "La nevoie, folosește butoanele: EXTINDE (+5 zile), ELIBEREAZĂ (dacă nu poți continua), FINALIZEAZĂ (când ai terminat).",
      ],
      image1_alt: "Formular procesare — partea 1",
      image2_alt: "Formular procesare — partea 2",
    },
    s5: {
      title: "Reguli & anti-fraudă",
      badge: "Important",
      rules: [
        "Nu crea profile fictive. Verificăm aleatoriu și corelăm cu sursele. Frauda duce la revocare, ștergerea câștigurilor și ban.",
     
        "Calitate minimă: imaginile trebuie să fie lizibile; paginile corect ordonate; fișierele denumite clar.",
     
        "Evită dublurile: caută înainte de a crea profiluri noi. Leagă la profiluri existente când este cazul.",
        "Coordonate corecte la cimitire/morminte; dacă nu știi localitatea, e OK — dar lat/lon sunt obligatorii.",
        "Fără spam, fără „umflare” artificială a creditelor (ex.: fragmentări inutile).",
        "Un singur cont per persoană. Colaborarea neloială sau vânzarea contului sunt interzise.",
      ],
      penalties:
        "Încălcările pot duce la: suspendarea contului, pierderea calității de partener, anularea creditelor neplătite și/sau raportare către autorități (după caz).",
    },
    s6: {
      title: "Tutoriale & bune practici",
      badge: "Ghid",
      items: [
        "Registre vechi: notează structura (an, parohie, tip înregistrare). Transcrie fidel numele; marchează incertitudinile (circa, ?, [illegible]).",
        "Simboluri uzuale: † (deces), x (căsătorie), „≈” (botez). Latinisme: „filius/filia”, „uxor”, „vidua”, „natus/nata”, „anno domini”.",
        "Ortografie istorică: nume cu grafii diferite (ex. „Gheorghe”/„Gheorgheh”). Păstrează forma din document, dar adaugă și o variantă modernă.",
        "Date: convertește corect lunile (latină/maghiară/germană) și susține cu imaginea/pagina.",
        "Locuri: pentru sate dispărute sau redenumite, folosește câmpurile istorice și leagă la locul modern dacă se cunoaște.",
        "Cimitire: lat/lon obligatorii; numele și Place pot fi goale la morminte izolate.",
        "Verificare: înainte de FINALIZEAZĂ, parcurge cronologia profilurilor create și vezi dacă se leagă coerent (părinți, vârste, locuri).",
      ],
      more:
        "Vezi și ghidul „Surse” și „Locuri” din zona Learn pentru exemple ilustrate.",
    },
  };

  const en = {
    title: "Partners Portal",
    desc:
      "Become a RoBio partner: upload collections, process records/photos, and earn credits for your work.",
    s1: {
      title: "What is a partner & how to apply",
      badge: "Step 1",
      p1:
        "Partners are verified contributors. They can upload collections (old registers, cemetery photos, documents) and process sources to extract people and data.",
      p2:
        "How to apply: click “Partners Portal” in the navbar. You’ll see an “Apply” button. Click it to open the form (left image). Fill in your full name and a phone number (WhatsApp or other). An admin will contact you and approve/deny your application.",
      image_alt: "Partner apply form",
    },
    s2: {
      title: "Partners Portal — overview",
      badge: "Step 2",
      p1:
        "Once approved, the portal shows “My Processing” on the left and “Latest sources” on the right.",
      p2:
        "At the top you will see the count of unprocessed sources and a “Create source” button. The form matches the user portal, but new items here go to admin approval.",
      image_alt: "Partners portal (overview)",
    },
    s3: {
      title: "Earnings & Credits",
      badge: "Monetization",
      p1:
        "You earn credits for two activities: 1) uploading pages/images to sources; 2) processing (creating profiles from sources). Current rate: 0.1 RON / credit.",
      upload_title: "Uploading sources (2 credits/page)",
      examples: [
        "Upload a PDF with 10 images (pages) → 20 credits = 2 RON.",
        "Upload a collection with 150 cemetery photos → 300 credits = 30 RON.",
      ],
      processing_title: "Processing (1 credit/profile created)",
      p2:
        "While processing, each profile created from that source yields 1 credit.",
      payout_title: "Withdrawals & Stripe",
      p3:
        "Withdraw from Settings → Financial. Connect your Stripe account, complete details, and get paid via Stripe.",
    },
    s4: {
      title: "Processing workflow",
      badge: "Step by step",
      p1:
        "Processing means reading a source and extracting persons/data. You have 5 days per started source; you may extend once by +5 days.",
      steps_title: "Main steps",
      steps: [
        "Open the source and click “Start processing”.",
        "Read pages and create profiles for found persons (births, marriages, deaths, etc.).",
        "Fill key data (names, dates, places) and attach the source to each profile.",
        "Use actions when needed: EXTEND (+5 days), RELEASE (if you can’t continue), FINALIZE (when done).",
      ],
      image1_alt: "Processing form — part 1",
      image2_alt: "Processing form — part 2",
    },
    s5: {
      title: "Rules & anti-fraud",
      badge: "Important",
      rules: [
        "Do not create fictional profiles. We run random checks against sources. Fraud leads to revocation, forfeited earnings, and a ban.",
      
        "Quality minimums: readable images; correct page order; clear file naming.",

        "Avoid duplicates: search before creating new profiles. Link to existing ones where appropriate.",
        "Accurate coordinates for cemeteries/graves; if locality is unknown, it’s OK — lat/lon are mandatory.",
        "No spam or artificial credit inflation (e.g., unnecessary splitting).",
        "One account per person. Unfair collab or selling accounts is prohibited.",
      ],
      penalties:
        "Violations may result in suspension, loss of partner status, cancellation of unpaid credits, and/or legal escalation where applicable.",
    },
    s6: {
      title: "Tutorials & best practices",
      badge: "Guide",
      items: [
        "Old registers: note structure (year, parish, entry type). Transcribe faithfully; mark uncertainties (circa, ?, [illegible]).",
        "Common symbols: † (death), x (marriage), “≈” (baptism). Latinisms: filius/filia, uxor, vidua, natus/nata, anno domini.",
        "Historic orthography: alternate spellings. Keep original form but add a modern alternative.",
        "Dates: convert months correctly (Latin/Hungarian/German) and support with the image/page.",
        "Places: for renamed/vanished settlements, use historical fields and link to the modern place when known.",
        "Cemeteries: lat/lon required; name and Place can be empty for isolated graves.",
        "Checks: before FINALIZE, scan the created profiles’ timelines for coherence (parents, ages, places).",
      ],
      more: "See “Sources” and “Places” guides in Learn for illustrated examples.",
    },
  };

  const copy = useMemo(() => {
    const hasT = (t as any)?.learnPartners;
    if (hasT) return (t as any).learnPartners;
    return lang === "ro" ? ro : en;
  }, [t, lang, ro, en]);

  // -------------------- Scroll sync (?view=1..6) ---------------------
  const [view, setView] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setView(sp.get("view"));
  }, []);
  const sectionRefs = {
    s1: useRef<HTMLDivElement | null>(null),
    s2: useRef<HTMLDivElement | null>(null),
    s3: useRef<HTMLDivElement | null>(null),
    s4: useRef<HTMLDivElement | null>(null),
    s5: useRef<HTMLDivElement | null>(null),
    s6: useRef<HTMLDivElement | null>(null),
  } as const;
  const targetRef = useMemo(() => {
    if (view === "1") return sectionRefs.s1;
    if (view === "2") return sectionRefs.s2;
    if (view === "3") return sectionRefs.s3;
    if (view === "4") return sectionRefs.s4;
    if (view === "5") return sectionRefs.s5;
    if (view === "6") return sectionRefs.s6;
    return null;
  }, [view]);
  useEffect(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  // -------------------------- Images --------------------------
  const imageApply = `/learn/partners/apply-${lang === "ro" ? "ro" : "en"}.png`;
  const imagePortal = `/learn/partners/partners.png`;
  const imageProc1 = `/learn/partners/processing-1.png`;
  const imageProc2 = `/learn/partners/processing-2.png`;

  const [selectedImage, setSelectedImage] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  // Reusable: left image (smaller) + right text
  const TwoCol = ({
    img,
    alt,
    children,
  }: {
    img: string;
    alt: string;
    children: React.ReactNode;
  }) => (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ alignItems: { md: "center" } }}
    >
      <Box
        sx={{
          flex: { xs: "0 0 auto", md: "0 0 40%" },
          maxWidth: { xs: "100%", md: 420 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          mx: { xs: "auto", md: 0 },
        }}
      >
        <img
          src={img}
          alt={alt}
          style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
          onClick={() => {
            setSelectedImage(img);
            setImageViewerOpen(true);
          }}
        />
      </Box>
      <Box sx={{ flex: { xs: "1 1 auto", md: "1 1 60%" } }}>{children}</Box>
    </Stack>
  );

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {copy.desc}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* S1 — What & Apply */}
      <Box ref={sectionRefs.s1} id="apply" sx={{ scrollMarginTop: 84 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))" }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                {copy.s1.title}
              </Typography>
              <Chip size="small" label={copy.s1.badge} />
            </Stack>

            <TwoCol img={imageApply} alt={copy.s1.image_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">{copy.s1.p1}</Typography>
                <Typography variant="body2" color="text.secondary">{copy.s1.p2}</Typography>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* S2 — Portal Overview */}
      <Box ref={sectionRefs.s2} id="portal" sx={{ scrollMarginTop: 84 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))" }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                {copy.s2.title}
              </Typography>
              <Chip size="small" label={copy.s2.badge} />
            </Stack>

            <TwoCol img={imagePortal} alt={copy.s2.image_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">{copy.s2.p1}</Typography>
                <Typography variant="body2" color="text.secondary">{copy.s2.p2}</Typography>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* S3 — Earnings & Credits */}
      <Box ref={sectionRefs.s3} id="earnings" sx={{ scrollMarginTop: 84 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))" }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                {copy.s3.title}
              </Typography>
              <Chip size="small" label={copy.s3.badge} />
            </Stack>

            <TwoCol img={imagePortal} alt="Credits & payments overview">
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">{copy.s3.p1}</Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {copy.s3.upload_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {copy.s3.examples.map((e: string, i: number) => (
                    <Typography key={i} component="li" variant="body2">{e}</Typography>
                  ))}
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {copy.s3.processing_title}
                </Typography>
                <Typography variant="body2" color="text.secondary">{copy.s3.p2}</Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {copy.s3.payout_title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.s3.p3}{" "}
                  <Link href="/settings">
                    <strong>Settings</strong>
                  </Link>
                </Typography>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* S4 — Processing workflow */}
      <Box ref={sectionRefs.s4} id="processing" sx={{ scrollMarginTop: 84 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))" }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                {copy.s4.title}
              </Typography>
              <Chip size="small" label={copy.s4.badge} />
            </Stack>

            <TwoCol img={imageProc1} alt={copy.s4.image1_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">{copy.s4.p1}</Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {copy.s4.steps_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {copy.s4.steps.map((s: string, i: number) => (
                    <Typography key={i} component="li" variant="body2">{s}</Typography>
                  ))}
                </Stack>
              </Stack>
            </TwoCol>

            <TwoCol img={imageProc2} alt={copy.s4.image2_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {/* extra tip block */}
                  {lang === "ro"
                    ? "Sfat: completează întâi câmpurile sigure (nume, relații, date lizibile). Revino pentru detalii fine după ce parcurgi toată sursa."
                    : "Tip: add the sure facts first (names, relations, legible dates). Come back for fine details after scanning the entire source."}
                </Typography>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* S5 — Rules */}
      <Box ref={sectionRefs.s5} id="rules" sx={{ scrollMarginTop: 84 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))" }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                {copy.s5.title}
              </Typography>
              <Chip size="small" label={copy.s5.badge} />
            </Stack>

            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              {copy.s5.rules.map((r: string, i: number) => (
                <Typography key={i} component="li" variant="body2">{r}</Typography>
              ))}
            </Stack>

            <Typography variant="body2" color="text.secondary">{copy.s5.penalties}</Typography>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* S6 — Tutorials */}
      <Box ref={sectionRefs.s6} id="tutorials" sx={{ scrollMarginTop: 84 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))" }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                {copy.s6.title}
              </Typography>
              <Chip size="small" label={copy.s6.badge} />
            </Stack>

            <TwoCol img={imagePortal} alt="Guides preview">
              <Stack spacing={1}>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {copy.s6.items.map((it: string, i: number) => (
                    <Typography key={i} component="li" variant="body2">{it}</Typography>
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">{copy.s6.more}</Typography>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      {/* Image modal */}
      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage}
      />
    </Box>
  );
}
