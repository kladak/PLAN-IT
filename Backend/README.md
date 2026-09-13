# PLAN-IT Backend

Flask API that scores and searches Texas A&M Earth-Kind plant data for the
PLAN-IT React Native client. This is a student project backend brought up to a
**defendable production-ish** slice: typed validation, structured errors,
health checks, request IDs, basic rate limiting, and Docker — without inventing
fake traffic metrics or rewriting the mobile app.

## What it does

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness — process is up |
| `GET` | `/ready` | Readiness — regional indexes loaded |
| `GET` | `/init` | Build per-region indexes (also runs on startup when `AUTO_INIT=true`) |
| `POST` | `/search` | Rank plants for a region + optional filters / text query |
| `GET` | `/get-plant` | Fetch one plant by `id` + `region` |

The RN client still talks to `http://127.0.0.1:5001` (see `Frontend/src/api-calls.js`).

### Search body (JSON)

```json
{
  "region": 0,
  "query": "bluebonnet",
  "isOnlyText": true,
  "sun_expo": "sun",
  "color": "blue",
  "season": "spring",
  "fruit": "false",
  "type": "annual",
  "size": "small"
}
```

Invalid payloads return `400` with a structured `error` object and the
`X-Request-ID` echoed for correlation.

## Quick start (local)

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # optional
export PLANT_DATA_PATH="$(pwd)/pants_filtered.csv"
python app.py          # http://0.0.0.0:5001
```

Or with Gunicorn:

```bash
gunicorn --bind 0.0.0.0:5001 --workers 2 app:app
```

## Docker (API only)

```bash
cd Backend
docker compose up --build
# curl http://127.0.0.1:5001/health
# curl http://127.0.0.1:5001/ready
```

Compose does **not** start the Expo app — mobile stays on Metro as before.

## Tests

CI and local tests use `fixtures/plants_sample.csv` (~40 rows) so you do not
need the full multi-megabyte dataset in the runner.

```bash
cd Backend
pip install -r requirements-dev.txt
pytest -q
ruff check app.py plant_recommend.py tests --select E9,F63,F7,F82
```

## Configuration

See `.env.example`. Notable knobs:

- `CORS_ORIGINS` — `*` (dev) or comma-separated allowlist
- `RATE_LIMIT` — flask-limiter string, default `60 per minute`
- `PLANT_DATA_PATH` — CSV used for recommendations
- `AUTO_INIT` — preload indexes on process start

## Data notes

- Runtime data: `pants_filtered.csv` (typo’d filename kept for compatibility)
- Cleaning / scrape scripts: `data_cleaning.py`, `webscrape.py` (offline tools)
- Training CSV from earlier ML experiments is kept but unused by the API

## Security / secrets warning

Earlier commits on `master` included:

- `google-services.json` / `GoogleService-Info.plist` (Firebase client configs)
- `Backend/venv/` (full virtualenv)
- `Backend.zip`

Those paths are now **gitignored** and removed from the branch index. **Rotate
any Firebase / API keys that lived in those files** if this repo was ever
public or shared — git history on `master` still contains the old blobs until
you rewrite history (not done by this PR on purpose). Prefer `git filter-repo`
or GitHub’s secret scanning guidance if you need a full purge.

Never commit `.env`, `venv/`, or fresh Firebase plist/json files.

## Layout

```
Backend/
  app.py                 # Flask app + middleware
  plant_recommend.py     # scoring + regional indexes
  pants_filtered.csv     # full dataset (runtime)
  fixtures/              # tiny CSV for tests
  tests/
  Dockerfile
  docker-compose.yml
  requirements.txt
  requirements-dev.txt
```

## Remaining gaps (honest)

- No auth — fine for a local/demo API, not for an open internet deployment
- In-memory rate limits do not share state across Gunicorn workers
- CSV loaded into memory; not a real datastore
- Frontend defaults to `127.0.0.1:5001` (overridable via `EXPO_PUBLIC_API_URL`)
- Historical secrets remain in git history on older commits
