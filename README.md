# 🗝️ GM Vault

A **local-first, mobile-friendly campaign manager** for game masters running at the table
from a phone. No accounts, no cloud — everything lives in a SQLite file on your machine.

Ships with a sample fantasy **magitek campaign** (*Cinders of the Aether Engine*) so every
screen has something in it on first launch.

**Site: https://eltacolibre.github.io/gm-vault-site/**

## Features

- **Campaign dashboard** — record counts, latest session, quick navigation
- **Searchable records** — NPCs, locations, factions, items, and encounters with tags,
  quick stats, and Markdown descriptions; fast full-text-ish search as you type
- **Session notes** — Markdown editor with preview, sorted by session date
- **Dice roller** — tap-to-build formulas (`2d6+3`, `4d6kh3`, advantage as `2d20kh1+5`),
  saved formulas per campaign, roll history
- **Encounter tracker** — initiative order, round/turn tracking, big −5/−1/+1/+5 HP
  buttons, add/remove combatants mid-fight; state persists automatically
- **Export / import** — full campaign as a single JSON file (backup or move devices)
- **Made for phones** — dark mode, 48px+ touch targets, bottom tab navigation,
  minimal typing

## Setup

Requires Node 20+. This is the path I run every session.

```sh
# terminal 1 — API server on :8580
cd server && npm install && npm run dev

# terminal 2 — Vite dev server on :5173 (proxies /api to :8580)
cd client && npm install && npm run dev
```

Open **http://localhost:5173**. The database is created at `server/data/gmvault.db`
(override with `DB_PATH`). To reach it from your phone, start Vite with `--host` and
use your computer's LAN IP (e.g. `http://192.168.1.20:5173`).

## Docker (unverified)

A `Dockerfile` and a `docker-compose.yml` ship with the repo. They are meant to serve
the whole app on **http://localhost:8580** in one command:

```sh
docker compose up --build
```

**Be careful: I have never run this.** Docker is not installed on my machine, so the
image build is untested. Treat it as a starting point, not a supported path. Campaign
data is meant to persist in the `gmvault-data` volume across restarts, and
`docker compose down -v` is meant to start over. If it breaks for you, please open an
issue and I will fix it.

## Tests

```sh
cd server && npm test   # API + database + export/import round-trip (vitest + supertest)
cd client && npm test   # dice notation parser (vitest)
```

## Tech

| Layer    | Choice                                             |
| -------- | -------------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite, react-router, marked |
| Backend  | Express + better-sqlite3 (synchronous, WAL mode)   |
| Storage  | Single SQLite file, seeded on first run            |
| Packaging| Multi-stage Dockerfile, one service, one volume    |

### Data model

One `records` table covers NPCs, locations, factions, items, and encounters — a `type`
column plus a flexible JSON `data` field (quick stats, encounter combatants, live
tracker state). Session notes and saved dice formulas get their own tables. Everything
cascades from `campaigns`, and the JSON export/import round-trips all of it.

### Dice notation

`[count]d<sides>[kh<n>|kl<n>]` terms joined by `+`/`-`, plus integer modifiers:
`1d20+7`, `8d6`, `4d6kh3` (keep highest 3), `2d20kl1` (disadvantage), `2d20kh1+5`
(advantage).

## Export format

```json
{
  "format": "gm-vault-campaign",
  "version": 1,
  "campaign": { "name": "…", "setting": "…", "description": "…" },
  "records": [ { "type": "npc", "name": "…", "data": { "stats": [] } } ],
  "notes": [ { "title": "…", "content": "…", "session_date": "…" } ],
  "formulas": [ { "name": "…", "formula": "1d20+7" } ]
}
```

Importing always creates a **new** campaign — it never overwrites existing data.
