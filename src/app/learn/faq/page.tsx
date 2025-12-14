/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Paper,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { useLanguage } from "@/context/LanguageContext";

type FaqItem = { q: string; a: string; tags: string[] };

type FaqCopy = {
  title: string;
  desc: string;
  meta: { updated: string; contact: string };
  lead: string[];
  hint: string;
  empty: string;
  searchPlaceholder: string;
  chipAll: string;
  results: (n: number) => string;
  clear: string;
  contactCta: string;
  contactNote: string;
  tagsOrder: string[];
  faqs: FaqItem[];
};

export default function FaqPage() {
  const { lang } = useLanguage();
  const router = useRouter();

  // ----------------- COPY (BILINGUAL, FRIENDLY) -----------------
  const ro: FaqCopy = {
    title: "Întrebări Frecvente",
    desc:
      "Răspunsuri prietenoase despre conturi, profiluri, surse, locuri & cimitire și Programul de Parteneri.",
    meta: { updated: "Actualizat: 15 octombrie 2025", contact: "robioromania@gmail.com" },
    lead: [
      "RoBio (Romanian Biography) organizează informații istorice — în mare parte din surse publice — și conținut creat de comunitate.",
      "Folosește căsuța de căutare, apoi filtrează după etichete. Toate etichetele sunt afișate cu MAJUSCULE pentru claritate.",
    ],
    hint: "Sfat: începe cu termeni simpli (ex.: „profil”, „cimitir”, „credite”, „plăți”, „locuri istorice”).",
    empty: "N-am găsit nimic pe baza filtrului introdus.",
    searchPlaceholder: "Caută întrebări și răspunsuri…",
    chipAll: "TOATE",
    results: (n) => `${n} rezultate`,
    clear: "Resetează filtrele",
    contactCta: "Nu ai găsit răspunsul? Scrie-ne",
    contactNote: "Echipa răspunde, de regulă, în aceeași zi lucrătoare.",
    tagsOrder: [
      "GENERAL",
      "ACCOUNT",
      "PROFILES",
      "SOURCES",
      "PLACES",
      "CEMETERIES",
      "SEARCH",
      "MAP",
      "PARTNERS",
      "CREDITS",
      "PAYMENTS",
      "PRIVACY",
      "MODERATION",
      "LEGAL",
      "SUPPORT",
      "TROUBLESHOOTING",
      "TIPS"
    ],
    faqs: [
      // GENERAL (1–6)
      { q: "Ce Este RoBio?", a: "O platformă genealogică colaborativă: creezi profiluri, atașezi surse, definești locuri și cimitire (cu coordonate) și colaborezi cu comunitatea. Conținutul provine în principal din înregistrări publice și contribuții ale utilizatorilor.", tags: ["GENERAL"] },
      { q: "Este RoBio Gratuit?", a: "Da, funcțiile de bază sunt gratuite. Funcții avansate și câștigurile din Programul de Parteneri depind de regulile din portal. Nu garantăm un volum minim de lucru sau câștig.", tags: ["GENERAL", "PARTNERS"] },
      { q: "Ce Surse Folosiți?", a: "Preponderent surse publice: registre, arhive, ziare, imagini de cimitir realizate în spații publice, plus conținut de la utilizatori. Acuratețea poate varia; poți propune corecții.", tags: ["GENERAL", "SOURCES", "LEGAL"] },
      { q: "Cum Schimb Limba?", a: "Din bara de navigare comuți între Română și Engleză. Conținutul de pe paginile de Învățare (Learn) se adaptează automat.", tags: ["GENERAL"] },
      { q: "Unde Găsesc Ghiduri?", a: "Secțiunea Learn / Învățare acoperă Profiluri, Surse, Locuri & Cimitire, Parteneri și Căutare. Capturile de ecran te ghidează pas cu pas.", tags: ["GENERAL", "TIPS"] },
      { q: "Este Acurat Tot Conținutul?", a: "Nu. RoBio organizează și indexează; nu garantăm acuratețea fiecărui document. Te rugăm să verifici și să raportezi erorile.", tags: ["GENERAL", "LEGAL"] },

      // ACCOUNT (7–10)
      { q: "Cum Îmi Creez Cont?", a: "Intră la Înregistrare, completează email, nume utilizator și parolă, apoi confirmă emailul din link. Dacă nu primești emailul, verifică Spam/Promotions sau retrimite din portal.", tags: ["ACCOUNT"] },
      { q: "Nu Primesc Emailul De Verificare", a: "Așteaptă câteva minute, verifică toate folderele și folosește „Retrimite”. Dacă persistă, scrie la robioromania@gmail.com.", tags: ["ACCOUNT", "SUPPORT"] },
      { q: "Cum Resetez Parola?", a: "Folosește „Parolă uitată” și alege metoda (email principal sau de recuperare). După ce primești parola temporară, o poți schimba din Setări.", tags: ["ACCOUNT"] },
      { q: "Pot Șterge Contul?", a: "Momentan nu oferim ștergerea contului. Poți opri oricând folosirea platformei. Pentru întrebări despre date, scrie-ne.", tags: ["ACCOUNT", "PRIVACY"] },

      // PROFILES (11–15)
      { q: "Cum Funcționează Profilurile?", a: "Un profil reprezintă o persoană (în viață sau decedată). Adaugi nume, date, locuri, relații și surse. Deținătorul editează direct; ceilalți trimit sugestii.", tags: ["PROFILES"] },
      { q: "Pot Adăuga Persoane În Viață?", a: "Da, dar folosește date minimale și evită informații sensibile fără consimțământ. Respectă legea privind protecția datelor.", tags: ["PROFILES", "PRIVACY"] },
      { q: "Cum Reivindic Un Profil Care Îmi Aparține?", a: "Deschide profilul, apasă „Claim” și încarcă dovada (ID/mandat). După aprobare, devii deținător.", tags: ["PROFILES"] },
      { q: "Cum Evit Dublurile?", a: "Caută înainte de a crea. Sistemul propune posibile potriviri. Poți raporta dubluri sau solicita unificare.", tags: ["PROFILES", "MODERATION"] },
      { q: "Pot Colabora Cu Alții?", a: "Da. Poți propune modificări pe profilurile altora, iar deținătorii pot accepta sau respinge.", tags: ["PROFILES", "TIPS"] },

      // SOURCES (16–20)
      { q: "Cum Încarc O Sursă (PDF/Imagini)?", a: "Completezi formularul, adaugi titlu clar (ex.: „Cimitirul Bellu – Sector X”), apoi încarci fișiere. PDF-urile sunt împărțite automat pe pagini; imaginile sunt grupate în aceeași colecție, în ordine.", tags: ["SOURCES"] },
      { q: "Ce Formate Acceptați?", a: "PDF, JPG, PNG (uzual). Dacă dimensiunea e mare, comprimă sau împarte. Încarcă doar conținut pe care ai dreptul să-l distribui sau care e public.", tags: ["SOURCES", "LEGAL"] },
      { q: "Cum Atașez O Sursă La Un Profil?", a: "Deschide profilul, secțiunea „Surse” și atașează o sursă existentă sau adaugă una nouă (dacă ești Partener).", tags: ["SOURCES", "PROFILES"] },
      { q: "Cum Citez Corect O Sursă?", a: "Include titlul, autorul (dacă există), anul, volumul/pagina și linkul sau referința. Descrierile scurte ajută la verificare.", tags: ["SOURCES", "TIPS"] },
      { q: "Suportați GEDCOM Import/Export?", a: "Momentan nu. Este pe roadmap. Poți exporta manual datele esențiale din profile/surse.", tags: ["SOURCES", "GENERAL"] },

      // PLACES (21–24)
      { q: "Ce Sunt Locurile (Places)?", a: "Localități, regiuni sau țări — moderne sau istorice (ex.: Ghiris → Câmpia Turzii). Poți completa nume modern + nume istoric, regiune/țară modernă.", tags: ["PLACES"] },
      { q: "Cum Găsesc Un Loc Istoric?", a: "Caută atât denumirea veche, cât și varianta modernă. Dacă nu există, creează-l completând câmpurile istorice și moderne.", tags: ["PLACES", "SEARCH"] },
      { q: "Cum Corectez Un Loc?", a: "Propune o modificare. Moderatorii și deținătorii pot revizui și accepta.", tags: ["PLACES", "MODERATION"] },
      { q: "De Ce Nu Văd Un Loc Pe Hartă?", a: "Mărește zoom-ul. Pentru locuri istorice fără coordonate exacte, afișarea pe hartă poate fi limitată.", tags: ["PLACES", "MAP"] },

      // CEMETERIES (25–28)
      { q: "Ce Înseamnă „Cimitir” În RoBio?", a: "Orice loc de înhumare: cimitir organizat, curte de biserică/mănăstire, parcelă militară sau mormânt izolat.", tags: ["CEMETERIES"] },
      { q: "Coordonatele Sunt Obligatorii?", a: "Da, pentru cimitire și morminte izolate. Numele și localitatea pot fi opționale pentru morminte izolate fără apartenență clară.", tags: ["CEMETERIES", "PLACES"] },
      { q: "Pot Adăuga Un Mormânt Izolat Fără Nume/Locație?", a: "Da. Dacă știi coordonatele, îl poți înregistra chiar și fără nume sau Place.", tags: ["CEMETERIES"] },
      { q: "Markerul E Ușor Deplasat", a: "Editează coordonatele și salvează. Încearcă formate decimale și verifică pe hartă.", tags: ["CEMETERIES", "TROUBLESHOOTING"] },

      // SEARCH & MAP (29–33)
      { q: "Cum Caut Mai Bine?", a: "Începe simplu, apoi restrânge: nume + an aproximativ + loc. Încearcă variante istorice și ortografii alternative.", tags: ["SEARCH", "TIPS"] },
      { q: "De Ce Nu Găsesc O Persoană?", a: "Încearcă mai puține filtre, verifică ortografia, folosește intervale (ex.: 1880–1890) și adaugă locul nașterii/decesului aproximativ.", tags: ["SEARCH", "TROUBLESHOOTING"] },
      { q: "Cum Funcționează Harta?", a: "Harta arată densitatea profilelor și a locurilor/cimitirelor. Poți mări pentru detaliu și poți deschide rezultatele.", tags: ["MAP", "PLACES"] },
      { q: "Un Loc Lipsă Pe Hartă", a: "Adaugă sau completează coordonatele. Fără coordonate, afișarea poate fi imposibilă.", tags: ["MAP", "PLACES", "TROUBLESHOOTING"] },
      { q: "Pot Filtra După Cimitir?", a: "Da, în căutarea avansată poți folosi cimitirul ca filtru.", tags: ["SEARCH", "CEMETERIES"] },

      // PARTNERS (34–38)
      { q: "Ce Este Programul De Parteneri?", a: "Un mod de a încărca colecții (imagini/PDF) și de a procesa surse. Primești credite pentru activitățile eligibile.", tags: ["PARTNERS"] },
      { q: "Cum Aplic Ca Partener?", a: "Din navbar → Portalul Partenerilor → „Aplică”. Completezi numele complet și telefonul. Te contactăm pe WhatsApp/telefon.", tags: ["PARTNERS"] },
      { q: "Ce Înseamnă „Procesare”?", a: "Extragi persoane și creezi profiluri din sursa aleasă. O rundă are 5 zile și poate fi prelungită o singură dată.", tags: ["PARTNERS"] },
      { q: "Ce Se Întâmplă Dacă Depășesc Termenul?", a: "Sursa se eliberează pentru alți parteneri. Creditele pentru munca nefinalizată pot fi pierdute.", tags: ["PARTNERS", "TROUBLESHOOTING"] },
      { q: "Aveți Tutoriale Pentru Procesare?", a: "Da, în Learn > Parteneri explicăm pașii, bune practici, simboluri și exemple.", tags: ["PARTNERS", "TIPS"] },

      // CREDITS & PAYMENTS (39–44)
      { q: "Ce Sunt Creditele?", a: "Unități interne pe care le câștigi (ex.: per pagină încărcată, per profil creat în procesare). Ratele pot varia.", tags: ["CREDITS"] },
      { q: "Cum Fac Retragerea (Withdrawal)?", a: "Din Setări → „Retrage bani”. Poți cere retragerea soldului disponibil oricând. Tranzacția se face prin Stripe — fără verificare manuală a creditelor de către RoBio.", tags: ["PAYMENTS", "CREDITS"] },
      { q: "Care E Minim Pentru Retragere?", a: "Dacă apare o limită, o vei vedea în interfață. În mod uzual poți retrage orice sold disponibil.", tags: ["PAYMENTS"] },
      { q: "Cât Durează Să Ajungă Banii?", a: "Depinde de Stripe și de banca ta. De regulă, între câteva minute și câteva zile lucrătoare.", tags: ["PAYMENTS"] },
      { q: "Există Comisioane Sau Taxe?", a: "Stripe poate percepe comisioane. Poți avea obligații fiscale în funcție de jurisdicție; gestionezi raportările pe cont propriu.", tags: ["PAYMENTS", "LEGAL"] },
      { q: "Pot Seta Recurență La Retrageri?", a: "Momentan nu. inițiezi manual ori de câte ori vrei.", tags: ["PAYMENTS"] },

      // PRIVACY & MODERATION (45–48)
      { q: "Cum Protejați Viața Privată?", a: "Folosim măsuri tehnice/organizatorice rezonabile. Evită publicarea de date sensibile despre persoane în viață fără consimțământ.", tags: ["PRIVACY"] },
      { q: "Cum Raportez O Eroare Sau Un Abuz?", a: "Folosește butonul de raportare sau scrie la robioromania@gmail.com cu link și descriere. Răspundem rapid.", tags: ["MODERATION", "SUPPORT"] },
      { q: "Ce Se Întâmplă Cu Conținutul Ofensator?", a: "Îl înlăturăm sau limităm. Încălcările repetate duc la suspendare.", tags: ["MODERATION"] },
      { q: "Cum Devin Moderator?", a: "Scrie-ne și menționează experiența. Selectăm moderatori dintre contribuitorii activi.", tags: ["MODERATION", "SUPPORT"] },

      // TROUBLESHOOTING & TIPS (49–50)
      { q: "Upload Eșuat — Ce Fac?", a: "Încearcă o compresie ușoară, verifică conexiunea și reîncarcă. Pentru PDF, împarte în fișiere mai mici. Dacă persistă, scrie-ne.", tags: ["TROUBLESHOOTING", "SOURCES"] },
      { q: "Sfaturi Pentru Căutare Rapidă", a: "Folosește intervale de ani, variante istorice ale locurilor, orthografii alternative și filtrează treptat. Nu supraîncărca formularul din prima.", tags: ["TIPS", "SEARCH"] },
    ],
  };

  const en: FaqCopy = {
    title: "Frequently Asked Questions",
    desc:
      "Friendly answers about accounts, profiles, sources, places & cemeteries, and the Partners Program.",
    meta: { updated: "Updated: October 15, 2025", contact: "robioromania@gmail.com" },
    lead: [
      "RoBio (Romanian Biography) organizes historical information — mostly from public records — plus community contributions.",
      "Use the search box and filter by tags. All tags are shown in UPPERCASE for clarity.",
    ],
    hint: "Tip: start with simple terms (e.g., “profile”, “cemetery”, “credits”, “payouts”, “historical places”).",
    empty: "No results matched your filters.",
    searchPlaceholder: "Search questions and answers…",
    chipAll: "ALL",
    results: (n) => `${n} results`,
    clear: "Clear Filters",
    contactCta: "Still need help? Contact Support",
    contactNote: "We usually reply the same business day.",
    tagsOrder: [
      "GENERAL",
      "ACCOUNT",
      "PROFILES",
      "SOURCES",
      "PLACES",
      "CEMETERIES",
      "SEARCH",
      "MAP",
      "PARTNERS",
      "CREDITS",
      "PAYMENTS",
      "PRIVACY",
      "MODERATION",
      "LEGAL",
      "SUPPORT",
      "TROUBLESHOOTING",
      "TIPS"
    ],
    faqs: [
      // GENERAL (1–6)
      { q: "What Is RoBio?", a: "A collaborative genealogy platform: create profiles, attach sources, define places and cemeteries (with coordinates), and collaborate. Content comes primarily from public records and user contributions.", tags: ["GENERAL"] },
      { q: "Is RoBio Free?", a: "Yes, core features are free. Advanced features and Partners earnings depend on portal rules. We don’t guarantee a minimum workload or earnings.", tags: ["GENERAL", "PARTNERS"] },
      { q: "What Sources Do You Use?", a: "Mostly public records: registers, archives, newspapers, cemetery photos shot in public spaces, plus user-generated content. Accuracy varies; please suggest corrections.", tags: ["GENERAL", "SOURCES", "LEGAL"] },
      { q: "How Do I Change The Language?", a: "Use the navbar to switch between Romanian and English. Learn pages adapt automatically.", tags: ["GENERAL"] },
      { q: "Where Are The Guides?", a: "The Learn section covers Profiles, Sources, Places & Cemeteries, Partners, and Search. Screenshots guide you step by step.", tags: ["GENERAL", "TIPS"] },
      { q: "Is Everything Accurate?", a: "No. RoBio organizes and indexes; we do not guarantee the accuracy of each record. Please verify and report issues.", tags: ["GENERAL", "LEGAL"] },

      // ACCOUNT (7–10)
      { q: "How Do I Create An Account?", a: "Go to Register, enter email, username, password, then confirm via the verification link. If you don’t receive it, check Spam/Promotions or resend from the portal.", tags: ["ACCOUNT"] },
      { q: "I Didn’t Receive The Verification Email", a: "Wait a few minutes, check all folders, and use “Resend.” If it still fails, email robioromania@gmail.com.", tags: ["ACCOUNT", "SUPPORT"] },
      { q: "How Do I Reset My Password?", a: "Use “Forgot password” and choose delivery (primary or recovery email). After receiving the temporary password, change it in Settings.", tags: ["ACCOUNT"] },
      { q: "Can I Delete My Account?", a: "We currently don’t offer account deletion. You may stop using the platform at any time. For data questions, contact us.", tags: ["ACCOUNT", "PRIVACY"] },

      // PROFILES (11–15)
      { q: "How Do Profiles Work?", a: "A profile represents a person (living or deceased). Add names, dates, places, relationships, and attach sources. Owners edit directly; others submit suggestions.", tags: ["PROFILES"] },
      { q: "May I Add Living Persons?", a: "Yes, but use minimal data and avoid sensitive info without consent. Follow data-protection laws.", tags: ["PROFILES", "PRIVACY"] },
      { q: "How Do I Claim My Own Profile?", a: "Open the profile, click “Claim,” and submit proof (ID/mandate). After approval, you become the owner.", tags: ["PROFILES"] },
      { q: "How Do I Avoid Duplicates?", a: "Search first. The system suggests potential matches. You can report duplicates or request a merge.", tags: ["PROFILES", "MODERATION"] },
      { q: "Can I Collaborate With Others?", a: "Yes. Propose changes on profiles you don’t own; owners can accept or reject.", tags: ["PROFILES", "TIPS"] },

      // SOURCES (16–20)
      { q: "How Do I Upload A Source (PDF/Images)?", a: "Fill the form, add a clear title (e.g., “Bellu Cemetery – Sector X”), then upload files. PDFs are auto-split into pages; multiple images are grouped under the same collection, in order.", tags: ["SOURCES"] },
      { q: "Which Formats Are Supported?", a: "PDF, JPG, PNG (common). If size is large, compress or split. Upload only content you’re allowed to share or that’s public.", tags: ["SOURCES", "LEGAL"] },
      { q: "How Do I Attach A Source To A Profile?", a: "Open the profile → “Sources”, and attach an existing source or add a new one (if you’re a Partner).", tags: ["SOURCES", "PROFILES"] },
      { q: "How Do I Cite A Source Correctly?", a: "Include title, author (if any), year, volume/page, and link or reference. Short descriptions help verification.", tags: ["SOURCES", "TIPS"] },
      { q: "Do You Support GEDCOM Import/Export?", a: "Not yet. It’s on our roadmap. You can manually export essential details from profiles/sources.", tags: ["SOURCES", "GENERAL"] },

      // PLACES (21–24)
      { q: "What Are Places?", a: "Localities, regions, or countries — modern or historical (e.g., Ghiris → Câmpia Turzii). You can set modern + historical names and modern region/country.", tags: ["PLACES"] },
      { q: "How Do I Find A Historical Place?", a: "Search both the old and the modern names. If missing, create it by filling historical and modern fields.", tags: ["PLACES", "SEARCH"] },
      { q: "How Do I Correct A Place?", a: "Propose an edit. Moderators and owners can review and approve.", tags: ["PLACES", "MODERATION"] },
      { q: "Why Isn’t A Place On The Map?", a: "Zoom in. For historical places without exact coordinates, map display can be limited.", tags: ["PLACES", "MAP"] },

      // CEMETERIES (25–28)
      { q: "What Counts As A Cemetery?", a: "Any burial site: organized cemetery, church/monastery grounds, military plot, or isolated grave.", tags: ["CEMETERIES"] },
      { q: "Are Coordinates Required?", a: "Yes, for cemeteries and isolated graves. Name and Place may be optional for isolated graves without a clear locality.", tags: ["CEMETERIES", "PLACES"] },
      { q: "Can I Add An Isolated Grave Without Name/Place?", a: "Yes. If you have coordinates, you can register it even without a name or Place.", tags: ["CEMETERIES"] },
      { q: "My Marker Is Slightly Off", a: "Edit the coordinates and save. Use decimal formats and double-check on the map.", tags: ["CEMETERIES", "TROUBLESHOOTING"] },

      // SEARCH & MAP (29–33)
      { q: "How Can I Search Better?", a: "Start simple, then narrow: name + approximate year + place. Try historical variants and alternative spellings.", tags: ["SEARCH", "TIPS"] },
      { q: "Why Can’t I Find A Person?", a: "Use fewer filters, check spelling, try year ranges (e.g., 1880–1890), and add a rough birth/death place.", tags: ["SEARCH", "TROUBLESHOOTING"] },
      { q: "How Does The Map Work?", a: "It shows density of profiles and places/cemeteries. Zoom for detail and open results.", tags: ["MAP", "PLACES"] },
      { q: "A Place Is Missing On The Map", a: "Add or complete coordinates. Without coordinates, we may not display it.", tags: ["MAP", "PLACES", "TROUBLESHOOTING"] },
      { q: "Can I Filter By Cemetery?", a: "Yes, advanced search supports filtering by cemetery.", tags: ["SEARCH", "CEMETERIES"] },

      // PARTNERS (34–38)
      { q: "What Is The Partners Program?", a: "A way to upload collections (images/PDFs) and process sources. You earn credits for eligible activities.", tags: ["PARTNERS"] },
      { q: "How Do I Apply As A Partner?", a: "Navbar → Partners Portal → “Apply”. Provide full name and phone. We’ll contact you via WhatsApp/phone.", tags: ["PARTNERS"] },
      { q: "What Does “Processing” Mean?", a: "Extracting persons and creating profiles from the chosen source. A round lasts 5 days, extendable once.", tags: ["PARTNERS"] },
      { q: "What If I Miss The Deadline?", a: "The source is released to others. Credits for unfinished work may be lost.", tags: ["PARTNERS", "TROUBLESHOOTING"] },
      { q: "Do You Have Processing Tutorials?", a: "Yes — Learn > Partners covers steps, best practices, symbols, and examples.", tags: ["PARTNERS", "TIPS"] },

      // CREDITS & PAYMENTS (39–44)
      { q: "What Are Credits?", a: "Internal units you earn (e.g., per uploaded page, per profile created during processing). Rates may vary.", tags: ["CREDITS"] },
      { q: "How Do Withdrawals Work?", a: "Settings → “Withdraw Money”. You can request withdrawal of your available balance anytime. Payouts run via Stripe — no manual credit verification by RoBio.", tags: ["PAYMENTS", "CREDITS"] },
      { q: "Is There A Minimum Withdrawal?", a: "If a limit applies, it will be shown in the UI. Usually, you can withdraw any available balance.", tags: ["PAYMENTS"] },
      { q: "How Long Until Funds Arrive?", a: "Depends on Stripe and your bank — typically minutes to a few business days.", tags: ["PAYMENTS"] },
      { q: "Are There Fees Or Taxes?", a: "Stripe may charge fees. You’re responsible for any taxes and reporting in your jurisdiction.", tags: ["PAYMENTS", "LEGAL"] },
      { q: "Can I Schedule Automatic Withdrawals?", a: "Not yet. You initiate withdrawals manually whenever you like.", tags: ["PAYMENTS"] },

      // PRIVACY & MODERATION (45–48)
      { q: "How Do You Protect Privacy?", a: "We use reasonable technical/organizational measures. Avoid posting sensitive data about living persons without consent.", tags: ["PRIVACY"] },
      { q: "How Do I Report An Error Or Abuse?", a: "Use the report button or email robioromania@gmail.com with the exact link and details. We respond quickly.", tags: ["MODERATION", "SUPPORT"] },
      { q: "What About Offensive Content?", a: "We remove or limit it. Repeated violations may lead to suspension.", tags: ["MODERATION"] },
      { q: "How Can I Become A Moderator?", a: "Email us with your experience. We select moderators from active contributors.", tags: ["MODERATION", "SUPPORT"] },

      // TROUBLESHOOTING & TIPS (49–50)
      { q: "Upload Failed — What Now?", a: "Compress slightly, check connection, retry. For PDFs, split into smaller files. If it persists, contact us.", tags: ["TROUBLESHOOTING", "SOURCES"] },
      { q: "Quick Search Tips", a: "Use year ranges, historical place variants, alternative spellings, and layer filters gradually. Don’t overload the form at first.", tags: ["TIPS", "SEARCH"] },
    ],
  };

  const copy = useMemo<FaqCopy>(() => (lang === "ro" ? ro : en), [lang]);

  // ----------------- SEARCH / FILTER UI -----------------
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("ALL");

  const tagsFromData = useMemo(() => {
    const s = new Set<string>();
    copy.faqs.forEach((f) => f.tags.forEach((tg) => s.add(tg)));
    return Array.from(s);
  }, [copy]);

  const orderedTags = useMemo(() => {
    const upperAll = copy.chipAll.toUpperCase();
    const rest = copy.tagsOrder.filter((t) => tagsFromData.includes(t));
    const remaining = tagsFromData.filter((t) => !rest.includes(t)).sort();
    return [upperAll, ...rest, ...remaining];
  }, [copy, tagsFromData]);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return copy.faqs.filter((f) => {
      const tagOK = activeTag === copy.chipAll.toUpperCase() || f.tags.includes(activeTag);
      if (!q) return tagOK;
      const hay = (f.q + " " + f.a + " " + f.tags.join(" ")).toLowerCase();
      return tagOK && hay.includes(q);
    });
  }, [copy, query, activeTag]);

  const clearAll = () => {
    setQuery("");
    setActiveTag(copy.chipAll.toUpperCase());
  };

  // ----------------- UI -----------------
  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* HERO */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(25,118,210,0.08) 0%, rgba(156,39,176,0.08) 100%)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={1.25} alignItems="center" textAlign="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
              {copy.title}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {copy.desc}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {copy.meta.updated}
          </Typography>
          <Divider flexItem sx={{ my: 1 }} />
          <Stack spacing={0.75}>
            {copy.lead.map((p, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                {p}
              </Typography>
            ))}
            <Typography variant="caption" color="text.secondary">
              <em>{copy.hint}</em>
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* SEARCH + TAGS BAR */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title={copy.clear}>
              <span>
                <Button
                  onClick={clearAll}
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {copy.clear}
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {/* TAGS */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {orderedTags.map((tg) => (
              <Chip
                key={tg}
                label={tg}
                color={activeTag === tg ? "primary" : "default"}
                variant={activeTag === tg ? "filled" : "outlined"}
                size="small"
                onClick={() => setActiveTag(tg)}
                sx={{ fontWeight: 700, letterSpacing: 0.5 }}
              />
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {copy.results(filteredFaqs.length)}
          </Typography>
        </Stack>
      </Paper>

      {/* FAQ LIST */}
      <Stack spacing={1.25}>
        {filteredFaqs.length === 0 && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2">{copy.empty}</Typography>
          </Paper>
        )}

        {filteredFaqs.map((f, idx) => (
          <Accordion
            key={`${f.q}-${idx}`}
            disableGutters
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              "&::before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack spacing={0.5} sx={{ width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                  {f.q}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {f.tags.map((tg) => (
                    <Chip key={tg} label={tg.toUpperCase()} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {f.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      {/* CONTACT STRIP */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 3,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(33,150,243,0.08) 100%)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Stack direction="row" spacing={1} alignItems="center">
            <HelpOutlineIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {copy.contactCta}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {copy.meta.contact} • {copy.contactNote}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
