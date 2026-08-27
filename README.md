# SM-Ideas — Setup

Een klein kladblok voor losse gedachten. Schrijf iets op wanneer het bij je opkomt — geen categorie kiezen, geen structuur nodig op dat moment. Alles wat je nog niet "verwerkt" hebt, staat opvallend bovenaan zodra je de app opent, zodat niets stilletjes verdwijnt.

Werkt overal (laptop én GSM) via [Supabase](https://supabase.com) (gratis).

## Hoe het werkt

- **Bovenaan schrijven** — typ iets in het vak en klik Opslaan (of Cmd/Ctrl+Enter). Dat is alles.
- **"Aandacht nodig"** — alles wat je net opschreef, staat hier tot het een onderwerp krijgt, met erbij hoe lang het al ligt te wachten.
  - **"✳ Groepeer automatisch"** — knop bovenaan die ideeën met genoeg gemeenschappelijke woorden zelf bundelt tot een onderwerp (gratis, puur woordoverlap — geen AI, dus geen echt taalbegrip). Ideeën die nergens genoeg op lijken, blijven gewoon staan voor een handmatig onderwerp.
  - Vul je zelf een onderwerp in bij één idee (in het bewerkscherm)? Dan neemt dat automatisch ook andere onverwerkte ideeën mee die er genoeg op lijken — je hoeft dus niet elk idee apart te doen.
  - Wil je het slimmer, met een echte korte toelichting per idee? Vraag het me in een Claude-gesprek ("kijk eens naar mijn ideeën") — dan lees en groepeer ik ze zelf.
- **To-do's** — een idee aanvinken als to-do (in het bewerkscherm) laat het als af-te-vinken taak verschijnen.
- **Kladblok** — verwerkte ideeën, op 2 manieren getoond onder elkaar (het ene vervangt het andere niet):
  - het **boomdiagram**: elk onderwerp een tak vanuit het midden, elk idee een knoop op die tak — een visueel overzicht;
  - de **lijst**: dezelfde ideeën gewoon per onderwerp onder elkaar, voor als je snel iets wil terugvinden of lezen.
  - Klik op een idee (in de boom of de lijst) om het te bewerken, van onderwerp te voorzien, als to-do te markeren, of te verwijderen.
- **Klanten** (apart tabblad) — een klein klantenbestand, los van je ideeën: **Walk in** (klanten waar je zelf naartoe gaat), **Potentieel**, **Twijfel**, **Samenwerking nu**, **Samengewerkt** en **Geweigerd**, elk in hun eigen kolom. Sleep een klantkaartje gewoon naar een andere kolom om de status te wijzigen (werkt op laptop, niet met de vinger op een telefoon — daar open je het kaartje en kies je de status in het dropdown-menu). Bij elke klant kan je ook bijhouden hoe je ze gevonden hebt (cold call, cold walk-in, via ads, mond-tot-mond, aanbeveling, of iets anders met eigen omschrijving).

## Stap 1 — Supabase account + project

1. Ga naar [supabase.com](https://supabase.com) → maak een gratis account (of gebruik je bestaande).
2. Klik **New project**. Kies een naam (bv. "sm-ideas") en een wachtwoord voor de database (bewaar dit ergens veilig).
3. Wacht tot het project klaar is (~2 min).
4. Ga naar **SQL Editor** → **New query**.
5. Open [`sql/schema.sql`](sql/schema.sql), kopieer de volledige inhoud, plak het in de SQL Editor, en klik **Run**.
6. Nieuwe query → open ook [`sql/002_leads.sql`](sql/002_leads.sql), plak en **Run** (voor het Klanten-tabblad).
7. Ga naar **Project Settings** (tandwiel-icoon) → **API**.
   - Kopieer de **Project URL**
   - Kopieer de **anon public** key

## Stap 2 — Configuratie invullen

Open [`js/config.js`](js/config.js) en vervang:

```js
export const SUPABASE_URL = "https://JOUW-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "JOUW-ANON-PUBLIC-KEY";
```

door je eigen Project URL en anon public key uit stap 1.6.

## Stap 3 — Lokaal testen

```
cd ~/sm-ideas
python3 -m http.server 8430
```

Open [http://localhost:8430](http://localhost:8430). Klik **"Account aanmaken"**, maak je eigen login aan, en log in — dit is eenmalig.

## Stap 4 — Online

De app staat live op **https://soenensmedia.github.io/sm-ideas/**, gehost via GitHub Pages (gratis).

## Stap 5 — Zet op je GSM-beginscherm

- **iPhone (Safari):** open de live link → deel-icoon → **"Zet op beginscherm"**.
- **Android (Chrome):** open de live link → menu (⋮) → **"App installeren"**.

## Updates deployen

Telkens er iets wijzigt: Claude commit en pusht de wijziging naar de GitHub-repo, en GitHub Pages bouwt binnen ~20-30 seconden automatisch een nieuwe versie op dezelfde link.

## Beveiliging

- **Row Level Security**: elke rij in `notes` filtert strikt op `user_id = auth.uid()`.
- **Sign-ups uitschakelen (doe dit zelf, eenmalig):** jij hebt al je eigen account. Supabase → **Authentication** → **Sign In / Providers** (of **Settings**) → zet **"Allow new users to sign up"** uit, zodat niemand anders ooit een account kan aanmaken.
