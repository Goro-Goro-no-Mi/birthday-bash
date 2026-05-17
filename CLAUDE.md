# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Birthday Bash tournament website for a 15-team beach volleyball & spikeball event (May 23, 2026, Strandbad Davoser See). Real-time score entry, live leaderboard, and admin panel.

## Development

**Run locally** — must use HTTP server (not `file://` — Firebase blocks it):
```bash
python -m http.server 8080
# then open http://localhost:8080
```

No build step, no package manager, no compilation. Pure HTML/CSS/JS.

## Architecture

**Stack**: Vanilla JS + Firebase Realtime Database (compat SDK v9 via CDN). No frameworks.

**Firebase paths**:
- `/scores/{gameId}` — `{ score1, score2, submittedBy, locked, editedByAdmin, editedAt }`
- `/teamNames/{teamId}` — custom team name string
- `/settings/adminPasswordHash` — SHA-256 of admin password

Every page uses `.on('value', cb)` listeners for live updates. Pages render immediately with empty/cached data, then re-render when Firebase responds.

**Module roles**:
- `js/data.js` — single source of truth: `TEAMS` (15 teams), `GAMES` (45 games), helper functions
- `js/firebase-config.js` — Firebase init + `const db = firebase.database()` (global)
- `js/scores.js` — score entry, team name input, Firebase writes
- `js/leaderboard.js` — standings calculation (3pts win / 1pt draw / 0pts loss), live table
- `js/admin.js` — SHA-256 login, score edit/lock, password management
- `js/nav.js` — hamburger menu, active link

## Key Data Structures

**TEAMS** (in `data.js`): array of `{ id, player1, player2 }` — 15 teams, `id` is 1-based.

**GAMES** (in `data.js`): array of `{ id, time, field, sport, team1, team2 }`:
- `field`: `"BV1"`, `"BV2"`, `"SPK1"`, `"SPK2"`
- `sport`: `"volleyball"` or `"spikeball"`
- 13 time slots (14:00–18:00, 20-min intervals); group stage ends at 18:20
- Slots 1–3 and 7–9: 4 concurrent games (BV1+BV2+SPK1+SPK2)
- Slots 4–6 and 10–13: 3 concurrent games (BV2 off)
- 45 total games, each team plays exactly 6, max 2 consecutive, 2–3 BV + 3–4 SPK

**Score entry constraint**: teams can only enter their own games; locked games (`locked: true`) block edits; admin can override.

## Schedule & Finals

The schedule was generated via `gen_schedule.py` (Python backtracking script). Full human-readable reference in `spielplan_komplett.txt`.

**Finals** are rendered dynamically in `schedule.html` (not in GAMES array) — rank-based bracket using `computeStandings()` inline. Finals run 18:30–19:30, top 8 teams play 2 games, ranks 9–14 play 1, rank 15 none. Grand Final: 19:30 BV1.

The "PROVISORISCH" label above finals auto-hides at 18:25 on 23.05.2026.

## Admin Auth

Default password: `geburi2026`. Hash stored in Firebase at `/settings/adminPasswordHash`. Fallback hardcoded hash in `admin.js` (`DEFAULT_HASH`). Session tracked via `sessionStorage.isAdmin`.

## CSS Notes

Dark theme (`#0F0F1A` bg, `#6C63FF` purple primary, `#00F5A0` neon accent). Font: Space Grotesk.

**Emoji rendering fix**: gradient `background-clip: text` + `-webkit-text-fill-color: transparent` kills emoji color. Fix: split heading into `.page-icon` span (resets `-webkit-text-fill-color: initial`) and `.page-title` span (has gradient). Applied on every inner page's `<h1>`.

## Deployment

**Firebase Hosting** (not yet set up — next step):
```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # public dir: ".", not SPA, don't overwrite index.html
firebase deploy
# → https://birthday-bash-6a93a.web.app
```

## Repository

GitHub: `https://github.com/Goro-Goro-no-Mi/birthday-bash`
