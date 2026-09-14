# PLAN-IT

Plant recommendation app (Expo / React Native + Flask) built around
Texas A&M Earth-Kind plant data. Search and filter plants for a region;
the Backend scores matches and the client shows ranked results with an
honest percent-match from that scorer.

| Layer | Path | Notes |
|-------|------|--------|
| Backend | [`Backend/`](Backend/) | Flask API, Docker, tests — see [`Backend/README.md`](Backend/README.md) |
| Frontend | [`Frontend/`](Frontend/) + root `App.js` | Expo app (iOS / Android / web) |

> Firebase client configs (`google-services.json`, `GoogleService-Info.plist`)
> were historically committed. They are gitignored now — rotate keys if this
> repo was shared, and do not re-add them.

## Quick demo

You need **two terminals**: API on `5001`, then Expo.

### 1. Backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
export PLANT_DATA_PATH="$(pwd)/pants_filtered.csv"
python app.py               # http://0.0.0.0:5001
```

Sanity check:

```bash
curl -s http://127.0.0.1:5001/health
curl -s http://127.0.0.1:5001/ready
```

### 2. Frontend (web)

```bash
# from repo root
npm install
npx expo start --web
```

Or: `npm run web`.

When the browser opens:

1. Landing shows an **API status** strip (health / ready).
2. Tap **Browse plant matches (no account)** to open the scoring UI without Firebase.
3. Use search, the filter funnel, or tap **R0** (region chip) to cycle regions 0–7.
4. Open a plant card to see the **preference match** explanation.

Sign-in / gardens still use Firebase and need a valid project config — that path is optional for reviewing the ranking UI.

### API base URL

Default: `http://127.0.0.1:5001` (see `Frontend/src/api-calls.js`).

Override without code changes:

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001 npx expo start --web
```

On web you can also set `window.__PLANIT_API_URL__` before the bundle runs.

### Mobile

```bash
npx expo start          # then scan with Expo Go
# or: npm run android / npm run ios
```

Point the device/emulator at a reachable API host (not `127.0.0.1` from a
physical phone) via `EXPO_PUBLIC_API_URL`.

## What the frontend polish covers

- Client calls `/health`, `/ready`, `/init`, `/search`, `/get-plant` with structured errors
- Loading / empty / error + retry on the results screen
- Rank + percent-match badges and a detail “preference match” card
- Demo browse path so reviewers are not blocked on Firebase auth

No fake traffic or engagement metrics — match % comes from the Backend scorer.

## Layout (high level)

```
App.js                 # navigation + API boot
Frontend/
  pages/               # landing, plants, filters, garden, auth
  src/api-calls.js     # Flask client
  src/theme.js         # shared colors / score helpers
Backend/               # Flask API (unchanged by frontend PRs aside from docs)
```
