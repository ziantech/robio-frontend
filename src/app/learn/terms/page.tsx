/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

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

export default function TermsPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();

  // -------- Localized copy (fallback). If t.legal.terms exists, it overrides this.
  const ro = {
    title: "Termeni și Condiții",
    desc:
      "Contractul care guvernează utilizarea Romanian Biography (RoBio). Vă rugăm citiți cu atenție.",
    meta: {
      effective: "15 octombrie 2025",
      entity: "UFJ LLC",
      dba: "Romanian Biography / RoBio",
      site: "www.romanian-biography.com",
      office: "Phoenix, AZ, SUA",
      email: "robioromania@gmail.com",
    },
    lead: [
      "Acești Termeni reprezintă un acord între dvs. („Utilizatorul”) și UFJ LLC, care operează sub denumirea Romanian Biography / RoBio („RoBio”). Prin accesarea sau utilizarea serviciului, acceptați acești Termeni.",
      "RoBio este o platformă genealogică colaborativă ce agregă, indexează și organizează informații istorice — în mare parte din surse publice (registre, ziare, arhive, fotografii de cimitir) — și conținut generat de utilizatori.",
    ],
    sections: [
      {
        title: "1) Descrierea serviciului",
        badge: "Prezentare",
        body: [
          "Pe RoBio puteți crea profile de persoane, atașa surse (documente, imagini, linkuri), gestiona locuri și cimitire (inclusiv coordonate geografice) și colabora cu alți utilizatori.",
          "RoBio oferă un Program de Parteneri pentru contribuitori aprobați care pot încărca colecții și procesa surse (indexare, extragere de persoane) în schimbul creditelor răscumpărabile.",
          "Scopul nostru este organizarea conținutului genealogic și istoric, facilitând căutarea, verificarea și contextul (de ex. vizualizări pe hartă, cronologii).",
        ],
      },
      {
        title: "2) Eligibilitate, conturi & securitate",
        badge: "Acces",
        bullets: [
          "Vârsta minimă: 13 ani (sau vârsta consimțământului digital în regiunea dvs.; 16+ în unele state UE/SEE).",
          "Un singur cont per persoană; păstrați credențialele în siguranță; anunțați-ne prompt dacă bănuiți acces neautorizat.",
          "Putem suspenda sau închide conturi pentru încălcări ale Termenilor, fraudă, abuz sau risc legal.",
        ],
      },
      {
        title: "3) Conținutul utilizatorului & licențe",
        badge: "Drepturi",
        body: [
          "Dețineți drepturile asupra conținutului pe care îl încărcați (texte, imagini, scanuri).",
          "Ne acordați o licență mondială, neexclusivă, transferabilă, sublicențiabilă, fără redevențe de a găzdui, stoca, indexa, reproduce, adapta, traduce, afișa și distribui conținutul dvs., numai pentru a opera, promova și îmbunătăți serviciul (inclusiv căutare, miniaturi, previzualizări, copii de siguranță, moderare, afișare publică).",
          "Prin încărcare declarați că aveți dreptul să folosiți conținutul (sau acesta este în domeniul public) și că nu încalcă drepturile altora.",
        ],
        notes: [
          "Dacă trimiteți corecții/sumarizări ale unor documente protejate, asigurați-vă că respectați drepturile de autor și citez corespunzător.",
          "Putem elimina, dez-indexa sau restricționa conținutul la cererea deținătorilor de drepturi sau pentru încălcări ale Termenilor.",
        ],
      },
      {
        title: "4) Înregistrări publice, acuratețe & responsabilitate",
        badge: "Surse publice",
        body: [
          "O parte substanțială a materialelor din RoBio provine din înregistrări publice, fotografii făcute în spații publice, arhive istorice sau resurse aflate în domeniul public sau utilizate sub licențe adecvate.",
          "Astfel de înregistrări pot conține erori, transcrieri imperfecte sau informații învechite. RoBio oferă platforma de căutare și organizare, dar nu garantează acuratețea, completitudinea sau actualitatea fiecărei înregistrări.",
          "În măsura permisă de lege, RoBio nu este responsabil pentru prejudicii rezultate din utilizarea conținutului public sau generat de utilizatori, inclusiv erori din registre, transliterări ori interpretări istorice.",
        ],
        bullets: [
          "Semnalați inexactități folosind mecanismele din platformă sau scriindu-ne la robioromania@gmail.com.",
          "Pentru persoane în viață, folosiți date minimale și evitați informații sensibile fără consimțământ.",
        ],
      },
      {
        title: "5) Persoane în viață & confidențialitate",
        badge: "Viață privată",
        body: [
          "Nu publicați date sensibile despre persoane în viață (ID-uri complete, adrese exacte, date medicale etc.) fără consimțământ explicit.",
          "Respectați legislația aplicabilă privind protecția datelor. Sunteți responsabil pentru existența unui temei legal (ex.: consimțământ, interes legitim) pentru datele personale publicate.",
          "Putem restricționa sau elimina conținut despre persoane în viață atunci când apreciem că riscă confidențialitatea sau siguranța.",
        ],
      },
      {
        title: "6) Locuri & cimitire (coordonate)",
        badge: "Geografie",
        body: [
          "Locurile pot fi moderne sau istorice (denumiri/țări/regiuni diferite în timp).",
          "Un „cimitir” înseamnă orice loc de înhumare (cimitir organizat, curte de biserică/mănăstire, parcelă militară, mormânt izolat).",
          "Latitudinea/longitudinea pot fi obligatorii pentru cimitire; numele și Place pot fi opționale pentru morminte izolate.",
        ],
        notes: [
          "Publicați coordonate cât mai precise și evitați punctele care pot expune locații private sau nepublice fără permisiune.",
        ],
      },
      {
        title: "7) Programul de Parteneri, credite & plăți",
        badge: "Monetizare",
        body: [
          "Partenerii aprobați pot încărca colecții (ex.: PDF-uri cu registre, fotografii de cimitir) și pot procesa surse creând profile. Activitățile eligibile pot genera credite (ex.: per pagină încărcată, per profil creat).",
          "Creditele sunt supuse verificării/validării; pot fi ajustate, refuzate sau anulate în caz de eroare, dubluri, calitate slabă sau fraudă.",
          "Ratele, eligibilitatea și regulile pot fi actualizate. Aprobările de conținut sunt la discreția RoBio.",
          "Răscumpărările se fac prin Stripe. Trebuie să parcurgeți verificările Stripe (KYC/AML). Sunteți independent (nu angajat), iar taxele și raportările fiscale vă aparțin.",
          "RoBio nu garantează disponibilitatea continuă a surselor de procesat sau un volum minim de câștig.",
        ],
      },
      {
        title: "8) Conduită interzisă",
        badge: "Reguli",
        bullets: [
          "Crearea de profile fictive, umflarea artificială a creditelor (uploaduri triviale/duplicate/splitting nejustificat).",
          "Încărcarea de conținut ilegal, protejat de drepturi fără permisiune, malware, sau date sensibile despre persoane în viață.",
          "Hărțuire, ură, doxxing, discriminare.",
          "Scraping masiv, ocolirea controalelor tehnice, re-publicarea sistematică a conținutului fără consimțământ.",
          "Uzurpare de identitate, declararea falsă a deținerii drepturilor.",
        ],
      },
      {
        title: "9) Proprietate intelectuală & notificări (DMCA)",
        badge: "Drepturi",
        body: [
          "Respectăm drepturile de autor. Dacă considerați că un conținut vă încalcă drepturile, trimiteți o notificare clară (link, dovada drepturilor, date contact) la robioromania@gmail.com.",
          "Vom evalua prompt solicitările și, dacă este cazul, vom elimina sau restricționa conținutul.",
        ],
      },
      {
        title: "10) Servicii terțe",
        badge: "Procesatori",
        body: [
          "Stripe procesează plățile; RoBio nu stochează date complete de plată.",
          "Folosim servicii de găzduire, CDN, analitice și e-mail. Folosirea RoBio implică acceptarea acestor sub-procesatori.",
        ],
      },
      {
        title: "11) Disponibilitate, modificări & întreruperi",
        badge: "Schimbări",
        body: [
          "Putem actualiza, modifica sau întrerupe serviciul ori unele funcții; vom încerca să anunțăm schimbările importante.",
          "Ratele de creditare și politicile programului pot fi ajustate periodic.",
        ],
      },
      {
        title: "12) Declineri de garanții",
        badge: "Disclaimer",
        body: [
          "RoBio este furnizat „ca atare” și „în funcție de disponibilitate”, fără garanții de orice fel (inclusiv vandabilitate, adecvare, neîncălcare).",
          "Nu garantăm acuratețea conținutului, inclusiv pentru înregistrări publice, transcrieri sau conținut generat de utilizatori.",
        ],
      },
      {
        title: "13) Limitarea răspunderii",
        badge: "Limitări",
        body: [
          "În măsura maximă permisă de lege, RoBio/UFJ LLC și afiliații nu răspund pentru daune indirecte, incidentale, speciale, consecvențiale sau punitive, ori pentru pierderi de date, profit sau fond comercial.",
          "Răspunderea totală pentru daune directe rezultate din utilizarea serviciului este limitată la sumele plătite efectiv de dvs. către RoBio pentru serviciile relevante în ultimele 12 luni (dacă există astfel de plăți).",
        ],
      },
      {
        title: "14) Despăgubiri",
        badge: "Indemnizare",
        body: [
          "Sunteți de acord să despăgubiți UFJ LLC pentru pretenții rezultate din conținutul încărcat, utilizarea serviciului sau încălcarea acestor Termeni.",
        ],
      },
      {
        title: "15) Lege aplicabilă & jurisdicție",
        badge: "For",
        body: [
          "Acești Termeni sunt guvernați de legea statului Arizona, SUA. Orice litigiu va fi soluționat de instanțele competente din Maricopa County, Arizona.",
        ],
      },
      {
        title: "16) Contact",
        badge: "Legal",
        body: [
          `Întrebări legale/DMCA: ${"robioromania@gmail.com"}`,
          `Adresă: UFJ LLC, Phoenix, AZ, SUA. Website: ${"www.romanian-biography.com"}`,
        ],
      },
    ],
  };

  const en = {
    title: "Terms & Conditions",
    desc:
      "The contract governing your use of Romanian Biography (RoBio). Please read carefully.",
    meta: {
      effective: "October 15, 2025",
      entity: "UFJ LLC",
      dba: "Romanian Biography / RoBio",
      site: "www.romanian-biography.com",
      office: "Phoenix, AZ, USA",
      email: "robioromania@gmail.com",
    },
    lead: [
      "These Terms are a binding agreement between you (“User”) and UFJ LLC, doing business as Romanian Biography / RoBio (“RoBio”). By accessing or using the service, you accept these Terms.",
      "RoBio is a collaborative genealogy platform that aggregates, indexes, and organizes historical information — largely from public records (registers, newspapers, archives, cemetery photographs) — and user-generated content.",
    ],
    sections: [
      {
        title: "1) Service Overview",
        badge: "Overview",
        body: [
          "On RoBio you can create person profiles, attach sources (documents, images, links), manage places and cemeteries (including geographic coordinates), and collaborate with other users.",
          "RoBio offers a Partners Program for approved contributors to upload collections and process sources (indexing, extracting persons) in exchange for redeemable credits.",
          "Our goal is to organize genealogical/historical content and provide context (e.g., maps, timelines) and searchability.",
        ],
      },
      {
        title: "2) Eligibility, Accounts & Security",
        badge: "Access",
        bullets: [
          "Minimum age: 13 (or the age of digital consent in your region; 16+ in some EEA states).",
          "One account per person; keep your credentials secure; promptly notify us of any unauthorized access.",
          "We may suspend or terminate accounts for Terms violations, fraud, abuse, or legal risk.",
        ],
      },
      {
        title: "3) User Content & Licenses",
        badge: "IP",
        body: [
          "You retain rights to the content you upload (text, images, scans).",
          "You grant RoBio a worldwide, non-exclusive, transferable, sublicensable, royalty-free license to host, store, index, reproduce, adapt, translate, display, and distribute your content solely to operate, promote, and improve the service (including search, thumbnails, previews, backups, moderation, and public display).",
          "By uploading, you warrant you have the necessary rights (or the content is in the public domain) and that your upload does not infringe others’ rights.",
        ],
        notes: [
          "If you submit summaries/transcriptions of protected works, ensure fair use/permission and proper citation.",
          "We may remove, de-index, or restrict content upon rights-holder request or Terms violations.",
        ],
      },
      {
        title: "4) Public Records, Accuracy & Responsibility",
        badge: "Public Sources",
        body: [
          "A substantial portion of RoBio materials originates from public records, images captured in public spaces, historical archives, or resources in the public domain or used under proper licenses.",
          "Such records may include errors, imperfect transcriptions, or outdated information. RoBio provides the platform and indexing, but does not guarantee the accuracy, completeness, or timeliness of each record.",
          "To the extent permitted by law, RoBio is not responsible for harm arising from use of public or user-generated content, including errors in records, transliterations, or historical interpretations.",
        ],
        bullets: [
          "Report inaccuracies via platform tools or email: robioromania@gmail.com.",
          "For living persons, keep data minimal and avoid sensitive information without consent.",
        ],
      },
      {
        title: "5) Living Persons & Privacy",
        badge: "Privacy",
        body: [
          "Do not publish sensitive data about living persons (full IDs, exact home addresses, medical data, etc.) without explicit consent.",
          "Comply with applicable data-protection laws. You are responsible for having a lawful basis (e.g., consent, legitimate interests) for personal data you submit.",
          "We may restrict or remove content about living persons where we deem it a privacy or safety risk.",
        ],
      },
      {
        title: "6) Places & Cemeteries (Coordinates)",
        badge: "Geography",
        body: [
          "Places may be modern or historical (names/countries/regions changing over time).",
          "“Cemetery” means any burial site (organized cemetery, churchyard/monastery grounds, military plot, isolated grave).",
          "Latitude/Longitude may be mandatory for cemeteries; Name and Place may be optional for isolated graves.",
        ],
        notes: [
          "Publish precise coordinates where lawful and avoid exposing private/non-public locations without permission.",
        ],
      },
      {
        title: "7) Partners Program, Credits & Payments",
        badge: "Monetization",
        body: [
          "Approved partners may upload collections (e.g., PDFs of registers, cemetery photos) and process sources by creating profiles. Eligible activities may generate credits (e.g., per page uploaded, per profile created).",
          "Credits are subject to review/validation; they may be adjusted, declined, or reversed in cases of error, duplicates, poor quality, or fraud.",
          "Rates, eligibility, and rules may be updated. Content approvals are at RoBio’s discretion.",
          "Redemptions are paid via Stripe. You must pass Stripe checks (KYC/AML). You act as an independent contributor (not an employee); you are responsible for taxes and reporting.",
          "RoBio does not guarantee continuous availability of processing work or a minimum earning level.",
        ],
      },
      {
        title: "8) Prohibited Conduct",
        badge: "Rules",
        bullets: [
          "Creating fictional profiles; artificially inflating credits (trivial/duplicate uploads or unjustified splitting).",
          "Uploading illegal content, copyrighted materials without permission, malware, or sensitive data about living persons.",
          "Harassment, hate, doxxing, discrimination.",
          "Mass scraping, circumventing technical controls, systematic re-hosting without consent.",
          "Impersonation; false claims of rights ownership.",
        ],
      },
      {
        title: "9) Intellectual Property & Notices (DMCA)",
        badge: "Rights",
        body: [
          "We respect copyright. If you believe content infringes your rights, send a clear notice (URL, proof of rights, contact details) to robioromania@gmail.com.",
          "We will promptly review requests and remove or restrict content where appropriate.",
        ],
      },
      {
        title: "10) Third-Party Services",
        badge: "Processors",
        body: [
          "Stripe processes payouts; RoBio does not store full payment details.",
          "We use hosting, CDN, analytics, and email providers. Using RoBio implies consent to these sub-processors.",
        ],
      },
      {
        title: "11) Availability, Changes & Interruptions",
        badge: "Changes",
        body: [
          "We may update, modify, or discontinue the service or certain features; we will try to provide notice of material changes.",
          "Credit rates and program policies may be adjusted from time to time.",
        ],
      },
      {
        title: "12) Disclaimers",
        badge: "Disclaimer",
        body: [
          "RoBio is provided “as is” and “as available,” without warranties of any kind (including merchantability, fitness, non-infringement).",
          "We do not warrant accuracy of content, including public records, transcriptions, or user-generated material.",
        ],
      },
      {
        title: "13) Limitation of Liability",
        badge: "Limits",
        body: [
          "To the maximum extent permitted by law, RoBio/UFJ LLC and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, or goodwill.",
          "Our aggregate liability for direct damages arising from your use of the service is limited to amounts you actually paid to RoBio for the relevant services in the twelve (12) months before the claim (if any).",
        ],
      },
      {
        title: "14) Indemnity",
        badge: "Indemnity",
        body: [
          "You agree to indemnify UFJ LLC for claims arising from your content, use of the service, or breach of these Terms.",
        ],
      },
      {
        title: "15) Governing Law & Venue",
        badge: "Venue",
        body: [
          "These Terms are governed by the laws of Arizona, USA. Courts in Maricopa County, Arizona, have exclusive jurisdiction.",
        ],
      },
      {
        title: "16) Contact",
        badge: "Legal",
        body: [
          `Legal/DMCA inquiries: ${"robioromania@gmail.com"}`,
          `Address: UFJ LLC, Phoenix, AZ, USA. Website: ${"www.romanian-biography.com"}`,
        ],
      },
    ],
  };

  const copy = useMemo(() => {
    const hasI18n = (t as any)?.legal?.terms;
    if (hasI18n) return (t as any).legal.terms;
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
          <strong>{copy.meta.effective}</strong> • {copy.meta.entity} d/b/a{" "}
          {copy.meta.dba} • {copy.meta.site} • {copy.meta.office}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Lead */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))", mb: 2 }}>
        <Stack spacing={1}>
          {copy.lead.map((p: string, i: number) => (
            <Typography key={i} variant="body2" color="text.secondary">
              {p}
            </Typography>
          ))}
        </Stack>
      </Paper>

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
              <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
                  {sec.title}
                </Typography>
                <Chip size="small" label={sec.badge} />
              </Stack>

              {sec.body?.map((p: string, i: number) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  {p}
                </Typography>
              ))}

              {sec.notes && (
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {sec.notes.map((n: string, i: number) => (
                    <Typography key={i} component="li" variant="body2">
                      {n}
                    </Typography>
                  ))}
                </Stack>
              )}

              {sec.bullets && (
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {sec.bullets.map((b: string, i: number) => (
                    <Typography key={i} component="li" variant="body2">
                      {b}
                    </Typography>
                  ))}
                </Stack>
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
