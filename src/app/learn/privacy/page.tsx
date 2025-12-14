/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();

  // -------- Localized copy (fallback). If t.legal.privacy exists, it overrides this.
  const ro = {
    title: "Politica de confidențialitate",
    desc:
      "Cum colectăm, folosim, partajăm și protejăm datele personale în Romanian Biography (RoBio).",
    meta: {
      effective: "15 octombrie 2025",
      controller: "UFJ LLC (Romanian Biography / RoBio)",
      office: "Phoenix, AZ, SUA",
      email: "robioromania@gmail.com"
    },
    sections: [
      {
        title: "1) Scop & domeniu",
        badge: "Acoperire",
        body: [
          "Această Politică explică cum RoBio colectează, utilizează, partajează și protejează datele cu caracter personal atunci când accesați site-ul, creați conturi, încărcați conținut, vă alăturați Programului de Parteneri, folosiți locuri/cimitire și primiți plăți prin Stripe.",
          "RoBio agregă predominant informații din surse publice și conținut generat de utilizatori, oferind instrumente de căutare, verificare și organizare.",
        ],
      },
      {
        title: "2) Ce date colectăm",
        badge: "Colectare",
        bullets: [
          "Cont & profil: nume/username, email, email de recuperare (opțional), hash parolă, setări, limbă.",
          "Conținut genealogic: nume, date (naștere/deces/căsătorie), locuri (inclusiv denumiri istorice), relații, etnie (dacă este furnizată), cimitire și coordonate, fișiere încărcate (fotografii, PDF-uri, scanuri) + metadate.",
          "Program Parteneri: date aplicație (nume complet, telefon/handle), activitate de procesare (surse revendicate, termene, prelungiri, credite).",
          "Plăți: status retrageri prin Stripe (nu stocăm date complete de plată; Stripe poate colecta KYC/AML).",
          "Tehnic & utilizare: IP, identificatori cookie, timpi și pagini accesate, evenimente tehnice, jurnal erori, aproximare locație din IP.",
          "Asistență & comunicări: conversații de suport, notificări, feedback.",
        ],
        note:
          "Categorii speciale: descurajăm încărcarea datelor sensibile despre persoane în viață. Dacă includeți etnie/religie în scop istoric, asigurați temei legal și tratați cu respect.",
      },
      {
        title: "3) Cum folosim datele",
        badge: "Utilizare",
        bullets: [
          "Furnizare și îmbunătățire serviciu (căutare, hărți, cronologii, surse).",
          "Operare Program Parteneri (eligibilitate, management surse, credite, anti-fraudă, plăți).",
          "Moderare și aplicarea Termenilor; gestionare cereri de retragere/raportare.",
          "Securitate (detectarea abuzurilor, prevenirea fraudei, protejarea conturilor).",
          "Comunicări de serviciu și suport; anunțuri privind modificări majore.",
          "Analitice (agregate/de-identificate când posibil) pentru calitatea produsului.",
          "Conformitate legală (obligații fiscale/contabile, răspuns către autorități).",
        ],
      },
      {
        title: "4) Baze legale (UE/SEE/UK, dacă se aplică)",
        badge: "Temeiuri",
        bullets: [
          "Contract (prestarea serviciului).",
          "Interes legitim (siguranță, prevenirea fraudei, îmbunătățiri).",
          "Consimțământ (marketing, câmpuri opționale).",
          "Obligații legale (KYC/AML Stripe, fiscalitate).",
        ],
      },
      {
        title: "5) Partajare & persoane împuternicite",
        badge: "Procesatori",
        bullets: [
          "Stripe pentru plăți.",
          "Găzduire, stocare, CDN, analitice, livrare email.",
          "Moderatori/administratori pentru revizuiri și anti-fraudă.",
          "Autorități când ni se cere prin lege.",
        ],
        body: [
          "Solicităm procesatorilor să protejeze datele și să le proceseze doar conform instrucțiunilor noastre.",
        ],
      },
      {
        title: "6) Transferuri internaționale",
        badge: "SUA & altele",
        body: [
          "Datele pot fi procesate în Statele Unite și alte jurisdicții. Când este necesar, folosim garanții adecvate (ex.: clauze contractuale standard).",
        ],
      },
      {
        title: "7) Retenție",
        badge: "Păstrare",
        body: [
          "Păstrăm datele cât timp contul este activ și cât este necesar pentru scopurile menționate (inclusiv backup, audit, soluționare dispute).",
          "Puteți solicita ștergerea; unele contribuții deja publice sau supuse obligațiilor legale pot fi exceptate ori întârziate (de ex., copii de siguranță).",
        ],
      },
      {
        title: "8) Drepturile dvs.",
        badge: "Drepturi",
        body: [
          "În funcție de regiune, puteți solicita acces, rectificare, ștergere, restricționare, portabilitate sau opoziție; puteți retrage consimțământul acolo unde se bazează pe consimțământ.",
          `Pentru solicitări: ${"robioromania@gmail.com"}. Putem verifica identitatea înainte de a acționa.`,
        ],
      },
      {
        title: "9) Copii",
        badge: "Sub 13",
        body: [
          "RoBio nu este destinat copiilor sub 13 ani. Dacă aflăm că am colectat date de la un copil sub 13 ani, le vom șterge.",
        ],
      },
      {
        title: "10) Securitate",
        badge: "Măsuri",
        body: [
          "Folosim măsuri tehnice și organizatorice rezonabile (criptare în tranzit, controale de acces, backup). Niciun sistem nu este 100% sigur.",
        ],
      },
      {
        title: "11) Cookie-uri & semnalizatori",
        badge: "Cookies",
        body: [
          "Folosim cookie-uri necesare (autentificare, preferințe) și analitice. Le puteți controla din browser; fără cookie-urile necesare, unele funcții pot să nu funcționeze.",
        ],
      },
      {
        title: "12) Conținut public & vizibilitate",
        badge: "Public",
        body: [
          "Conținutul încărcat (profiluri, surse, locuri, cimitire/coord.) poate fi vizibil public. Aveți grijă la datele despre persoane în viață; folosiți minimele necesare și asigurați temei legal.",
          "RoBio poate afișa extrase, miniaturi și indexări pentru facilitarea căutării și verificării istorice.",
        ],
      },
      {
        title: "13) Program Parteneri & plăți",
        badge: "Monetizare",
        body: [
          "Prelucrăm datele aplicației (nume, telefon/handle) pentru eligibilitate. Pentru plăți, partajăm către Stripe informațiile strict necesare. Calculul creditelor, aprobările și verificările anti-fraudă fac parte din operare.",
        ],
      },
      {
        title: "14) Modificări ale Politicii",
        badge: "Actualizări",
        body: [
          "Putem actualiza această Politică; modificările semnificative vor fi comunicate (banner, email).",
          "Continuarea utilizării după intrarea în vigoare a modificărilor înseamnă acceptarea noii versiuni.",
        ],
      },
      {
        title: "15) Contact",
        badge: "Privacy",
        body: [
          `Contact confidențialitate/cereri: ${"robioromania@gmail.com"}`,
          "Operator: UFJ LLC (Romanian Biography / RoBio), Phoenix, AZ, SUA.",
        ],
      },
    ],
  };

  const en = {
    title: "Privacy Policy",
    desc:
      "How Romanian Biography (RoBio) collects, uses, shares, and protects personal data.",
    meta: {
      effective: "October 15, 2025",
      controller: "UFJ LLC (Romanian Biography / RoBio)",
      office: "Phoenix, AZ, USA",
      email: "robioromania@gmail.com"
    },
    sections: [
      {
        title: "1) Scope & Purpose",
        badge: "Coverage",
        body: [
          "This Policy explains how RoBio collects, uses, shares, and protects personal data when you access the site, create accounts, upload content, join the Partners Program, use places/cemeteries, and receive payouts via Stripe.",
          "RoBio aggregates primarily public sources and user-generated content, providing tools for search, verification, and organization.",
        ],
      },
      {
        title: "2) Data We Collect",
        badge: "Collection",
        bullets: [
          "Account & profile: name/username, email, recovery email (optional), password hash, settings, language.",
          "Genealogical content: names, dates (birth/death/marriage), places (including historical names), relationships, ethnicity (if provided), cemeteries and coordinates, uploaded files (photos, PDFs, scans) plus metadata.",
          "Partners Program: application data (full name, phone/messaging handle), processing activity (claimed sources, deadlines, extensions, credits).",
          "Payments: payout status via Stripe (we do not store full payment details; Stripe may collect KYC/AML).",
          "Technical & usage: IP, cookie identifiers, timestamps and visited pages, technical events, error logs, approximate location from IP.",
          "Support & communications: support conversations, notifications, feedback.",
        ],
        note:
          "Special categories: we discourage uploading sensitive data about living persons. If you include ethnicity/religion in a historical context, ensure a lawful basis and treat it respectfully.",
      },
      {
        title: "3) How We Use Data",
        badge: "Use",
        bullets: [
          "Provide and improve the service (search, maps, timelines, sources).",
          "Operate the Partners Program (eligibility, source management, credits, anti-fraud, payouts).",
          "Moderation and enforcement of Terms; handling removal/report requests.",
          "Security (abuse detection, fraud prevention, account protection).",
          "Service communications and support; notices about material changes.",
          "Analytics (aggregated/de-identified where possible) to improve quality.",
          "Legal compliance (tax/accounting obligations, responses to authorities).",
        ],
      },
      {
        title: "4) Legal Bases (EEA/UK where applicable)",
        badge: "Bases",
        bullets: [
          "Contract (to provide the service).",
          "Legitimate interests (safety, fraud prevention, improvements).",
          "Consent (marketing, optional fields).",
          "Legal obligations (Stripe KYC/AML, tax).",
        ],
      },
      {
        title: "5) Sharing & Processors",
        badge: "Processors",
        bullets: [
          "Stripe for payouts.",
          "Hosting, storage, CDN, analytics, and email providers.",
          "Moderators/administrators for reviews and anti-fraud.",
          "Authorities when legally required.",
        ],
        body: [
          "We require processors to protect data and process it only under our instructions.",
        ],
      },
      {
        title: "6) International Transfers",
        badge: "US & Beyond",
        body: [
          "Data may be processed in the United States and other jurisdictions. Where required, we use appropriate safeguards (e.g., Standard Contractual Clauses).",
        ],
      },
      {
        title: "7) Retention",
        badge: "Retention",
        body: [
          "We keep data while your account is active and as needed for the purposes described (including backup, audits, dispute resolution).",
          "You may request deletion; some contributions already public or subject to legal obligations may be exempt or delayed (e.g., backups).",
        ],
      },
      {
        title: "8) Your Rights",
        badge: "Rights",
        body: [
          "Depending on your region, you may request access, rectification, deletion, restriction, portability, or object; you may also withdraw consent where applicable.",
          `To exercise rights: ${"robioromania@gmail.com"}. We may verify your identity before acting.`,
        ],
      },
      {
        title: "9) Children",
        badge: "Under 13",
        body: [
          "RoBio is not intended for children under 13. If we learn that we collected data from a child under 13, we will delete it.",
        ],
      },
      {
        title: "10) Security",
        badge: "Security",
        body: [
          "We use reasonable technical and organizational measures (encryption in transit, access controls, backups). No system is 100% secure.",
        ],
      },
      {
        title: "11) Cookies & Signals",
        badge: "Cookies",
        body: [
          "We use necessary cookies (authentication, preferences) and analytics cookies. You can control cookies in your browser; without necessary cookies some features may not function.",
        ],
      },
      {
        title: "12) Public Content & Visibility",
        badge: "Public",
        body: [
          "Content you upload (profiles, sources, places, cemeteries/coords) may be publicly visible. Be mindful about living persons; provide minimal data and ensure a lawful basis.",
          "RoBio may display excerpts, thumbnails, and indexes to enable search and historical verification.",
        ],
      },
      {
        title: "13) Partners Program & Payments",
        badge: "Monetization",
        body: [
          "We process application data (name, phone/handle) to evaluate eligibility. For payouts, we share necessary info with Stripe. Credit calculations, approvals, and anti-fraud checks are part of program operation.",
        ],
      },
      {
        title: "14) Changes to this Policy",
        badge: "Updates",
        body: [
          "We may update this Policy; material changes will be announced (banner, email).",
          "Continuing to use the service after the effective date means you accept the updated Policy.",
        ],
      },
      {
        title: "15) Contact",
        badge: "Privacy",
        body: [
          `Privacy contact/requests: ${"robioromania@gmail.com"}`,
          "Controller: UFJ LLC (Romanian Biography / RoBio), Phoenix, AZ, USA.",
        ],
      },
    ],
  };

  const copy = useMemo(() => {
    const hasI18n = (t as any)?.legal?.privacy;
    if (hasI18n) return (t as any).legal.privacy;
    return lang === "ro" ? ro : en;
  }, [t, lang]);

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

        <Typography variant="caption" color="text.secondary">
          {lang === "ro" ? "Dată aplicabilă" : "Effective date"}:{" "}
          <strong>{copy.meta.effective}</strong> • {lang === "ro" ? "Operator" : "Controller"}:{" "}
          {copy.meta.controller} • {copy.meta.office}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Sections */}
      <Stack spacing={2}>
        {copy.sections.map((sec: any, idx: number) => (
          <Paper
            key={idx}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              background:
                "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
            }}
          >
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ justifyContent: "space-between" }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
                >
                  {sec.title}
                </Typography>
                <Chip size="small" label={sec.badge} />
              </Stack>

              {sec.body?.map((p: string, i: number) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  {p}
                </Typography>
              ))}

              {sec.bullets && (
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {sec.bullets.map((b: string, i: number) => (
                    <Typography key={i} component="li" variant="body2">
                      {b}
                    </Typography>
                  ))}
                </Stack>
              )}

              {sec.note && (
                <Typography variant="caption" color="text.secondary">
                  {sec.note}
                </Typography>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
        {lang === "ro"
          ? "Notă: acest document este informativ și nu reprezintă consultanță juridică."
          : "Note: this document is informational and does not constitute legal advice."}
      </Typography>
    </Box>
  );
}
