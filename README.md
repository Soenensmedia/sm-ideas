# Sprokkel — Setup

Een klein kladblok voor losse gedachten. Schrijf iets op wanneer het bij je opkomt — geen categorie kiezen, geen structuur nodig op dat moment. Alles wat je nog niet "verwerkt" hebt, staat opvallend bovenaan zodra je de app opent, zodat niets stilletjes verdwijnt.

Werkt overal (laptop én GSM) via [Supabase](https://supabase.com) (gratis).

## Hoe het werkt

- **Bovenaan schrijven** — typ iets in het vak en klik Opslaan (of Cmd/Ctrl+Enter). Dat is alles.
- **"Nog te verwerken"** — alles wat je net opschreef, staat hier tot het een onderwerp en eventueel een korte toelichting krijgt. Vraag je dit gewoon aan mij in een Claude-gesprek ("kijk eens naar mijn sprokkels"), dan groepeer ik ze en schrijf ik er een korte, heldere insteek bij.
- **To-do's** — een sprokkeltje aanvinken als to-do (in het bewerkscherm) laat het als af-te-vinken taak verschijnen.
- **Kladblok** — verwerkte sprokkels, gegroepeerd per onderwerp.
- Klik op eender welk kaartje om het te bewerken, van onderwerp te voorzien, als to-do te markeren, of te verwijderen.

## Stap 1 — Supabase account + project

1. Ga naar [supabase.com](https://supabase.com) → maak een gratis account (of gebruik je bestaande).
2. Klik **New project**. Kies een naam (bv. "sprokkel") en een wachtwoord voor de database (bewaar dit ergens veilig).
3. Wacht tot het project klaar is (~2 min).
4. Ga naar **SQL Editor** → **New query**.
5. Open [`sql/schema.sql`](sql/schema.sql), kopieer de volledige inhoud, plak het in de SQL Editor, en klik **Run**.
6. Ga naar **Project Settings** (tandwiel-icoon) → **API**.
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
cd ~/sprokkel
python3 -m http.server 8430
```

Open [http://localhost:8430](http://localhost:8430). Klik **"Account aanmaken"**, maak je eigen login aan, en log in — dit is eenmalig.

## Stap 4 — Online zetten

Vraag me om een GitHub-repo aan te maken en te pushen, dan komt de app gratis live te staan via GitHub Pages (zelfde manier als je andere tools).

## Stap 5 — Zet op je GSM-beginscherm

- **iPhone (Safari):** open de live link → deel-icoon → **"Zet op beginscherm"**.
- **Android (Chrome):** open de live link → menu (⋮) → **"App installeren"**.

## Beveiliging

- **Row Level Security**: elke rij in `notes` filtert strikt op `user_id = auth.uid()`.
- **Sign-ups uitschakelen (doe dit zelf, eenmalig):** jij hebt al je eigen account. Supabase → **Authentication** → **Sign In / Providers** (of **Settings**) → zet **"Allow new users to sign up"** uit, zodat niemand anders ooit een account kan aanmaken.
