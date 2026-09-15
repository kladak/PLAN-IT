# PLAN-IT Backend

Flask API that scores and searches Texas A&M Earth-Kind plant data for the
PLAN-IT React Native client. Adds typed validation, structured errors, health
and readiness checks, request IDs, rate limiting and a Dockerfile on top of the
original course-project backend.

## What it does

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness: the process is up |
| `GET` | `/ready` | Readiness: regional indexes are loaded |
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

Compose does not start the Expo app; mobile stays on Metro as before.

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

- `CORS_ORIGINS`: `*` (dev) or a comma-separated allowlist
- `RATE_LIMIT`: flask-limiter string, default `60 per minute`
- `PLANT_DATA_PATH`: CSV used for recommendations
- `AUTO_INIT`: preload indexes on process start

## Data notes

- Runtime data: `pants_filtered.csv` (typo’d filename kept for compatibility)
- Cleaning / scrape scripts: `data_cleaning.py`, `webscrape.py` (offline tools)
- Training CSV from earlier ML experiments is kept but unused by the API

## Security

Firebase client configuration is public by design. Authorization depends on the Firebase
Security Rules configured for the project; service-account credentials and private keys
must remain outside the repository.

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

## Remaining gaps

- No auth; an internet-facing deployment would need it
- In-memory rate limits do not share state across Gunicorn workers
- The CSV is loaded into memory at startup; a datastore would be needed to scale
- Frontend defaults to `127.0.0.1:5001` (overridable via `EXPO_PUBLIC_API_URL`)
