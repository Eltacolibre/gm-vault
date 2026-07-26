# 🗝️ GM Vault

A **local-first, mobile-friendly campaign manager** for game masters running at the table
from a phone. No accounts, no cloud — everything lives in a SQLite file on your machine.

Ships with a sample fantasy **magitek campaign** (*Cinders of the Aether Engine*) so every
screen has something in it on first launch.

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

## One-command setup

Requires [Docker](https://docs.docker.com/get-docker/).

```sh
docker compose up --build
```

Then open **http://localhost:8580** — on your phone, use your computer's LAN IP instead
(e.g. `http://192.168.1.20:8580`).

Campaign data persists in the `gmvault-data` Docker volume across restarts. To start
over completely: `docker compose down -v`.

## Running without Docker (development)

Requires Node 20+.

```sh
# terminal 1 — API server on :8580
cd server && npm install && npm run dev

# terminal 2 — Vite dev server on :5173 (proxies /api to :8580)
cd client && npm install && npm run dev
```

The database is created at `server/data/gmvault.db` (override with `DB_PATH`).

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
