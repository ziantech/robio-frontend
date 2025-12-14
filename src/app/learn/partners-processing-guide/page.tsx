
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Button,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageViewer from "@/components/ImageViewer";

// Small helper for a pretty section wrapper
const Section: React.FC<{
  title: string;
  badge?: string;
  children: React.ReactNode;
}> = ({ title, badge, children }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
    }}
  >
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ justifyContent: "space-between" }}
      >
        <Typography variant="h6" data-heading tabIndex={-1} sx={{ fontWeight: 800, letterSpacing: "-.01em" }}>
          {title}
        </Typography>
        {badge && <Chip size="small" label={badge} />}
      </Stack>
      {children}
    </Stack>
  </Paper>
);

// Simple image grid with click-to-zoom via ImageViewer
const ImageGrid: React.FC<{
  images: { src: string; alt?: string; caption?: string }[];
  onOpen: (src: string) => void;
}> = ({ images, onOpen }) => (
  <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="flex-start">
    {images.map((img, i) => (
      <Box
        key={img.src + i}
        sx={{
          flex: "0 0 auto",
          width: { xs: "48%", sm: 200 },
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          cursor: "pointer",
        }}
        onClick={() => onOpen(img.src)}
      >
        <img src={img.src} alt={img.alt || img.caption || "image"} style={{ display: "block", width: "100%", height: "auto" }} />
        {img.caption && (
          <Typography variant="caption" sx={{ display: "block", px: 1, py: 0.5, color: "text.secondary" }}>
            {img.caption}
          </Typography>
        )}
      </Box>
    ))}
  </Stack>
);

export default function ProcessingGuidesPage() {
  const router = useRouter();

  const [tab, setTab] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const openImage = (src: string) => {
    setSelectedImage(src);
    setImageViewerOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ mb: 1.5 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          Tutoriale de încărcare & procesare
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ghid pas cu pas pentru partenerii RoBio: fotografiere, pregătire fișiere, încărcare și procesare.
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Cimitire — imagini pietre funerare" />
          <Tab label="Registre Matricole (parohii)" />
          <Tab label="Documente / PDF din online" />
          <Tab label="Crearea de profile (procesare)" />
        </Tabs>
      </Paper>

      {/* TAB 0 — Cimitire */}
      {tab === 0 && (
        <Stack spacing={2}>
          <Section title="Introducerea de imagini ale pietrelor de mormânt din cimitire desemnate">
            {/* Pasul 1 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 1" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Verifică dacă cimitirul pe care dorești să-l procesezi nu a fost încărcat deja în platformă de un alt partener: Portalul Partenerilor – icon Harta parohii & cimitire. Dacă cimitirul vizat lipsește din hartă, ești liber să-l procesezi.
              </Typography>
              <ImageGrid
                images={[
                  { src: "/learn/proccessing/1.jpg" },
                ]}
                onOpen={openImage}
              />
            </Paper>

            {/* Pasul 2 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 2" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Calculează-ți pașii: asigură-te că ai suficientă baterie la telefon. Cu o încărcare 100% a bateriei ai putea acoperi aproximativ 1000 de imagini.\nUn cimitir de mărime medie conține aproximativ 2500 de morminte. Acestea pot fi acoperite de o persoană în cca. 6-8 ore.\nFă-ți un plan de acoperire a cimitirului: alege-ți segmente din el, mergi pe rânduri. Fii atent ce porțiuni acoperi: din cauză că multe morminte nu sunt așezate pe rânduri munca ta poate fi îngreunată și poți deveni repede confuz. Scopul este să realizezi fotografierea tuturor pietrelor funerare din acel cimitir. Dacă nu ești sigur că ai fotografiat o anumită piatră mai bine o fotografiezi din nou decât să o lași deoparte.\nRespectă prezența vizitatorilor și alege să lucrezi în alte porțiuni ale cimitirului atunci când cineva vizitează mormântul celor dragi.`}
              </Typography>
               <ImageGrid
                images={[
                  { src: "/learn/proccessing/2.jpg" },
                ]}
                onOpen={openImage}
              />
            </Paper>

            {/* Pasul 3 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 3" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {`Cum fotografiezi? Tot ce ne intereseaza sunt informațiile de pe piatra funerară, deci încadrează imaginea pe text. Dacă piatra conține și imagini ale celor înmormântați, fă o poză incluzând textul și imaginile respective, apoi imediat fă o a doua poză doar cu imaginile lor, cât mai în detaliu. A doua poză va fi acceptată și ea ca sursă.\nRealizarea unei imagini din lateral este ok, atâta timp cât textul este lizibil.\nFotografierea unei pietre funerare nu ar trebui să-ți ia mai mult de câteva secunde.\nDacă textul este acoperit de jerbe sau flori ai grijă ca după ce ai făcut poza să aranjezi totul așa cum era înainte.\nVegetația sau lumina soarelui pe o placă metalică îți pot juca feste: asigură-te că după ce ai făcut poza textul este lizibil.\nTextul unor pietre funerare va fi imposibil de descifrat: e ok să treci la următoarea.\nArată respect, nu călca pe morminte, nu deranja aranjamentul acestora.`}
              </Typography>
              <ImageGrid
                images={[
                  { src: "/learn/proccessing/3.jpg" },
                  { src: "/learn/proccessing/4.jpg" },
                  { src: "/learn/proccessing/5.jpg" },
                ]}
                onOpen={openImage}
              />
            </Paper>

            {/* Pasul 4 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 4" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Descarcă imaginile într-un folder special. Dacă parcurgerea întregului cimitir îți ia mai multe zile, așteaptă până ai adunat toate imaginile și abia apoi treci la pasul 5. Este important să acoperi întregul cimitir, pentru a-l marca ulterior ca procesat în totalitate. Când ai obținut toate imaginile observă câte fișiere ai și cât de mare este folderul tău (x Gb).`}
              </Typography>
            </Paper>

            {/* Pasul 5 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 5" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {`Pregătirea imaginilor pentru upload. Cu siguranță imaginile tale au undeva la 1-10Mb/imagine. Va trebui să le aduci la o mărime de 150-300kb, chiar dacă pentru aceasta vei sacrifica din calitate.\nÎn caz că nu o ai deja, instaleaza gratuit aplicația Power Toys de la Microsoft (https://learn.microsoft.com/en-us/windows/powertoys/).\nDupă instalare mergi la folderul cu imaginile tale - selectează-le pe toate – click dreapta – Resize with Image Resizer – alege una din opțiunile Small sau Phone size.\nDin păcate imaginile tale micșorate vor apărea în același folder cu cele mari, deci va fi nevoie să le ștergi pe cele mari înainte de a trece la pasul 6: sorteaza imaginile în baza datei modificării, șterge-le pe cele vechi (de mărime mare), păstrează-le pe cele recente (mici).`}
              </Typography>
              <ImageGrid
                images={[
                  { src: "/learn/proccessing/6.jpg", caption: "poza 5" },
                  { src: "/learn/proccessing/7.jpg", caption: "poza 6" },
                  { src: "/learn/proccessing/8.jpg", caption: "poza 7" },
                  { src: "/learn/proccessing/9.jpg", caption: "poza 8" },
                ]}
                onOpen={openImage}
              />
            </Paper>

            {/* Pasul 6 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 6" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Încărcarea în platforma RoBio. Mergi la Portalul Partenerilor – Creează Sursă. Titlul colecției tale ar trebui să fie: ”Cimitirul …, jud. …” Dacă în localitatea respectivă există mai multe cimitire, te rugăm să fii mai explicit dacă este posibil: în loc de ”Cimitirul București” scrie de ex. ”Cimitirul Ghencea III Militar – București”. În cazul cimitirelor particulare/private poți scrie: ”Cimitir privat – Fam. ...” Titlul este o componentă importantă în identificarea ulterioară a colecției și a surselor din ea.\nAdaugă, de asemenea, anul în care ai realizat imaginile, precum și locația (oraș și județ).\nÎncarcă toate imaginile deodată cu opțiunea Select All din folderul tău, apoi apasă ”Creează sursa”. O să observi imediat procesul de încărcare în partea stângă a ecranului, proces care poate fi de durată în cazul unei cantități mari de imagini (ex: încărcarea a 500 Mb – 2500 imagini poate dura aproximativ 1 oră). Păstrează pagina de browser deschisă pe parcursul încărcării. Odată ce procesul este ”Completed” colecția ta a fost trimisă spre aprobare.`}
              </Typography>
            </Paper>

            {/* Pasul 7 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 7" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {`Aprobarea colecției. Administratorii platformei vor aproba imaginile realizate corect (lizibile) și vor marca cimitirul ca PROCESAT în harta din Portalul Partenerilor. Ulterior vei primi un email de confirmare și în ”Setări cont” vei putea vedea numărul de credite / echivalentul RON obținut. Odată aprobată, colecția va trece în baza de date a Surselor, aflată în Portalul Partenerilor.`}
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {`Notă: primești 0.20 RON pentru fiecare imagine aprobată. Ex: 2500 imagini realizate în 6-8 ore = 500 RON.`}
                </Typography>
              </Paper>
            </Paper>
          </Section>
        </Stack>
      )}

      {/* TAB 1 — Registre Matricole */}
      {tab === 1 && (
        <Stack spacing={2}>
          <Section title="Introducerea de Registre Matricole de la Parohii">
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Notă: Suntem orientați spre obținerea de registre matricole de la parohii. Pentru procesarea acestora este posibil să ai nevoie de aprobarea forurilor superioare bisericești.`}
              </Typography>
            </Paper>

            {/* Pasul 1 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 1" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Verifică dacă parohia pe care dorești să o procesezi nu a fost încărcată deja în platformă de un alt partener: Portalul Partenerilor – icon Harta parohii & cimitire. Dacă parohia vizată lipsește din hartă, ești liber să procesezi registrele acesteia.
              </Typography>
            </Paper>

            {/* Pasul 2 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 2" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`cel mai simplu este să folosești propriul telefon, opțiunea Scan din cadrul aplicației Camera. Încadrează imaginea, focusează atent, ține aparatul nemișcat în timp ce apeși iconul galben ”T”, apoi imediat săgeata galbenă de descărcare.\nAr trebui să fi obținut o imagine clară a paginii scanate. Dacă textul nu este lizibil șterge imaginea și încearcă din nou. După câteva încercări o să reușești să realizezi imagini suficient de clare pentru a fi aprobate ulterior. Acordă-ți timp la început. Pe măsură ce scanezi o să te familiarizezi cu procesul și vei realiza imagini într-un timp din ce în ce mai scurt, acoperind 4-5 registre (400-500 foi) în aproximativ 2-3 ore.\nPoți scana câte două pagini deodată (unele registre conțin informații despre aceeași persoană răspândite pe două pagini).`}
              </Typography>
            </Paper>

            {/* Pasul 3 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 3" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Descarcă imaginile în foldere speciale, apoi denumește folderele după registrele scanate (ex: Matricola Botezaților, 1902-2025, Parohia București-Izvor sau Protocolul Morților, 1897-1936, Parohia Bacău III, etc. ÎNTOTDEAUNA folosește denumirea originală, aflată pe coperta sau primele pagini ale registrului).\nFii atent să nu amesteci fișierele scanate ale unui registru cu fișierele altui registru.\nCând ai obținut toate imaginile observă câte fișiere ai și cât de mare este folderul tău (x Gb).`}
              </Typography>
            </Paper>

            {/* Pasul 4 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 4" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Pregătirea imaginilor pentru upload. Cu siguranță imaginile tale au undeva la 1-10Mb/imagine. În cazul registrelor matricole nu dorim să sacrificăm din calitatea acestora, de aceea te invităm să încerci să încarci un registru în Portalul Partenerilor (”Creează Sursă”) la dimensiunea lui originală. Va dura mai mult, dar calitatea primează. În cazul în care încărcarea fișierelor la dimensiunea originală duce la blocarea procesului va trebui să anulezi procesul de încărcare și să reduci dimensiunea fișierelor cu ajutorul unui site pdf compressor. Unele site-uri acceptă peste 100 de fișiere și peste 100 Mb la compresare gratuită. Nu reduce dimensiunea fișierelor mai jos de nivelul Mediu.`}
              </Typography>
            </Paper>

            {/* Pasul 6 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 6" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Încărcarea în platforma RoBio. Mergi la Portalul Partenerilor – Creează Sursă. Titlul colecției tale ar trebui să fie, la fel ca în cazul denumirii folderelor, ex: Matricola Botezaților, 1902-2025, Parohia București-Izvor sau Protocolul Morților, 1897-1936, Parohia Bacău III, etc. (ÎNTOTDEAUNA folosește denumirea originală, aflată pe coperta sau primele pagini ale registrului). Titlul este o componentă importantă în identificarea ulterioară a colecției și a surselor din ea.\nAdaugă, de asemenea, dacă este necesar, volumul, apoi anul de referință (ex: dacă registrul conține date dintre anii 1897-1936, anul va fi 1936), precum și locația (oraș și județ).\nÎncarcă toate fișierele deodată cu opțiunea Select All din folderul tău, apoi apasă ”Creează sursa”. O să observi imediat procesul de încărcare în partea stângă a ecranului, proces care poate fi de durată în cazul unei cantități mari de fișiere (ex: încărcarea a 500 Mb poate dura aproximativ 1 oră). Păstrează pagina de browser deschisă pe parcursul încărcării. Odată ce procesul este ”Completed” colecția ta a fost trimisă spre aprobare.`}
              </Typography>
            </Paper>

            {/* Pasul 7 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 7" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Aprobarea colecției. Administratorii platformei vor aproba imaginile realizate corect (lizibile) și vor marca parohia ca PROCESATĂ în harta din Portalul Partenerilor. Ulterior vei primi un email de confirmare și în ”Setări cont” vei putea vedea numărul de credite / echivalentul RON obținut. Odată aprobată, colecția va trece în baza de date a Surselor, aflată în Portalul Partenerilor.`}
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, bgcolor: "grey.50", mt: 1 }}>
                <Typography variant="body2">
                  Notă: primești 0.20 RON pentru fiecare fișier aprobat. Ex: 500 fișiere realizate în 3 ore = 100 RON.
                </Typography>
              </Paper>
            </Paper>
          </Section>
        </Stack>
      )}

      {/* TAB 2 — Documente/PDF */}
      {tab === 2 && (
        <Stack spacing={2}>
          <Section title="Introducerea de documente, Registre Matricole și de Stare Civilă, cărți, reviste de specialitate în format pdf">
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {`Platforma RoBio acceptă încărcarea de surse pdf din mediul online. Odată încărcate prin opțiunea ”Creează Sursă” din Portalul Partenerilor, acestea vor fi supuse spre aprobare administratorilor.\nÎncărcarea de surse din mediul online este voluntară și nu este remunerată.`}
            </Typography>
          </Section>
        </Stack>
      )}

      {/* TAB 3 — Crearea de profile */}
      {tab === 3 && (
        <Stack spacing={2}>
          <Section title="Crearea de profile prin procesarea surselor din baza de date">
            {/* Pasul 1 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 1" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {`Mergi la Portalul Partenerilor, secțiunea ”Ultimele fișiere adăugate”.\nDeschide un fișier din orice colecție dorești.\nDacă fișierul ți se pare accesibil apasă ”Start Processing”.`}
              </Typography>
            </Paper>

            {/* Pasul 2 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 2" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {`Pagina de procesare.\nFișierul ales este exclusiv la dispoziția ta pentru o perioadă de 5 zile.\nPagina de procesare conține opțiuni precum ”Prelungește termenul” (poți prelungi termenul de deținere/procesare a fișierului ales pentru alte 5 zile, dar nu mai mult de un total de 10 zile cumulate; la finalul termenului, dacă fișierul nu a fost procesat în totalitate, se va întoarce automat în colecția-mamă, pentru a fi preluat de alți parteneri), ”Eliberează” (poți renunța la procesarea fișierului și acesta se va întoarce în colecția-mamă).\nÎn secțiunea din stânga a paginii se află formularul de procesare, în cea din dreapta se află fișierul care poate fi mărit/micșorat, rotit, etc.\nCompletează cât mai multe informații oferite de fișierul ales: gen, naționalitate, nume, date și locuri de naștere, deces sau înmormântare/reînhumare. La câmpul ”Relații” poți să legi eventual profilul creat de tine de alte profile existente în RoBio (persoana poate fi părinte, soț sau copil al unui profil deja existent în platformă, iar prin relaționarea realizată de tine se creaza automat și un arbore genealogic).\nDacă dorești să adaugi mai multe detalii la profilul creat de tine, odată creat acest profil va trebui să deschizi o pagină separată în RoBio, să mergi la profilul creat și să completezi informațiile dorite (ex: editări, adăugări în Cronologie, adăugări de surse, etc.).\nUneori un profil creat de tine există deja în baza de date. Platforma te va invita să cercetezi profilele cu nume asemănătoare. Acordă-ți timp să cercetezi eventualele dubluri, deschide pagini adiacente in RoBio pentru a naviga mai ușor, iar dacă creși că un profil existent corespunde cu profilul creat de tine selectează ”Folosește”; dacă niciun profil existent nu corespunde profilului creat de tine ești liber să continui cu opțiunea ”Creează oricum”.`}
              </Typography>
            </Paper>

            {/* Pasul 3 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Chip size="small" label="Pasul 3" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {`Epuizarea sursei. Odată ce ai parcurs întreaga imagine a sursei selectate și ești sigur că aceasta a fost epuizată poți selecta opțiunea de culoare verde ”Finalizează procesarea”.\nFolosește ”Finalizează procesarea” numai dacă fișierul tău a fost epuizat. Dacă fișierul încă deține informație care necesită procesare, dar nu dorești continuarea procesării, selectează opțiunea ”Eliberează”.\nLa ”Finalizează procesarea” poți face unele precizări legate de activitatea ta (ex: poți preciza: ”Procesat în totalitate”).`}
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {`Notă: pe parcursul procesării poți observa numărul de credite / echivalentul RON obținut din activitatea ta.\nPrimești 0.10 RON pentru fiecare profil creat într-o pagină de procesare.\nProfilele create, dar care sfârșesc prin a fi conectate cu profile deja existente în RoBio, nu sunt remunerate.`}
                </Typography>
              </Paper>
            </Paper>
          </Section>
        </Stack>
      )}

      {/* Image modal */}
      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage}
      />

      {/* Footer actions (optional) */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Button onClick={() => router.push("/learn")} startIcon={<ArrowBackIcon />}>Înapoi la Learn</Button>
        <Tooltip title="Mergi în Portalul Partenerilor">
          <Button variant="contained" onClick={() => router.push("/partners")}>Deschide Portalul Partenerilor</Button>
        </Tooltip>
      </Stack>
    </Box>
  );
}
