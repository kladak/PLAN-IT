"""PLAN-IT Flask API."""

from __future__ import annotations

import math
import os
import uuid
from typing import Any, Optional

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pydantic import BaseModel, Field, ValidationError, field_validator

from plant_recommend import get_scores, init

# ---------------------------------------------------------------------------
# Config (env-driven; no secrets baked in)
# ---------------------------------------------------------------------------

def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _cors_origins() -> list[str] | str:
    raw = os.environ.get("CORS_ORIGINS", "*").strip()
    if raw == "*":
        return "*"
    return [o.strip() for o in raw.split(",") if o.strip()]


RATE_LIMIT = os.environ.get("RATE_LIMIT", "60 per minute")
PORT = int(os.environ.get("PORT", "5001"))
AUTO_INIT = _env_bool("AUTO_INIT", True)

# Regional indexes, populated by /init or at startup
dict_list_per_region: list | None = None
df_list_per_region: list | None = None


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    region: int = Field(ge=0, le=7)
    query: Optional[str] = ""
    isOnlyText: bool = False
    sun_expo: Optional[str] = None
    color: Optional[str] = None
    season: Optional[str] = None
    fruit: Optional[str] = None
    type: Optional[str] = None
    size: Optional[str] = None

    @field_validator("region", mode="before")
    @classmethod
    def coerce_region(cls, v: Any) -> Any:
        if isinstance(v, str) and v.isdigit():
            return int(v)
        return v


class GetPlantQuery(BaseModel):
    id: int = Field(ge=0)
    region: int = Field(ge=0, le=7)

    @field_validator("id", "region", mode="before")
    @classmethod
    def coerce_int(cls, v: Any) -> Any:
        if isinstance(v, str) and v.lstrip("-").isdigit():
            return int(v)
        return v


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_data(data: dict[str, Any]) -> dict[str, Any]:
    """Replace NaNs so JSON serialization stays boring and predictable."""
    image = data.get("Image")
    if not isinstance(image, str) and (
        image is None or (isinstance(image, float) and math.isnan(image))
    ):
        data["Image"] = (
            "https://www.onlygfx.com/wp-content/uploads/2020/09/"
            "pot-plant-silhouette-2.png"
        )

    comments = data.get("Additional Comments")
    if not isinstance(comments, str) and (
        comments is None
        or (isinstance(comments, float) and math.isnan(comments))
    ):
        data["Additional Comments"] = ""

    # pandas / numpy leftovers
    for key, value in list(data.items()):
        if hasattr(value, "item"):
            try:
                data[key] = value.item()
            except Exception:
                data[key] = str(value)
        elif isinstance(value, float) and math.isnan(value):
            data[key] = None
    return data


def error_response(
    status: int,
    code: str,
    message: str,
    details: Any = None,
):
    body: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "request_id": getattr(g, "request_id", None),
        }
    }
    if details is not None:
        body["error"]["details"] = details
    return jsonify(body), status


def require_ready():
    if df_list_per_region is None or dict_list_per_region is None:
        return error_response(
            503,
            "not_ready",
            "Plant indexes are not loaded yet. Call /init or wait for startup.",
        )
    return None


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    CORS(
        app,
        resources={r"/*": {"origins": _cors_origins()}},
        supports_credentials=_env_bool("CORS_CREDENTIALS", False),
    )

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=[RATE_LIMIT],
        storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
    )

    @app.before_request
    def assign_request_id():
        incoming = request.headers.get("X-Request-ID")
        g.request_id = incoming.strip() if incoming else str(uuid.uuid4())

    @app.after_request
    def attach_request_id(response):
        response.headers["X-Request-ID"] = getattr(g, "request_id", "")
        return response

    @app.errorhandler(ValidationError)
    def handle_validation(err: ValidationError):
        return error_response(
            400,
            "validation_error",
            "Request failed validation.",
            details=err.errors(),
        )

    @app.errorhandler(429)
    def handle_rate_limit(err):
        return error_response(
            429,
            "rate_limited",
            "Too many requests. Slow down a bit.",
        )

    @app.errorhandler(404)
    def handle_not_found(err):
        return error_response(404, "not_found", "No such route.")

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        app.logger.exception("Unhandled error: %s", err)
        return error_response(500, "internal_error", "Something went wrong.")

    # -- health -------------------------------------------------------------

    @app.get("/health")
    @limiter.exempt
    def health():
        return jsonify({"status": "ok"})

    @app.get("/ready")
    @limiter.exempt
    def ready():
        ready_ok = (
            df_list_per_region is not None and dict_list_per_region is not None
        )
        payload = {
            "status": "ready" if ready_ok else "not_ready",
            "regions_loaded": (
                len(df_list_per_region) if df_list_per_region is not None else 0
            ),
        }
        return jsonify(payload), (200 if ready_ok else 503)

    # -- domain routes (frontend-compatible) --------------------------------

    @app.post("/search")
    def search():
        blocked = require_ready()
        if blocked:
            return blocked

        if not request.is_json:
            return error_response(
                400, "invalid_content_type", "Expected application/json body."
            )

        try:
            params = SearchRequest.model_validate(request.get_json(silent=True) or {})
        except ValidationError as exc:
            return handle_validation(exc)

        region_df = df_list_per_region[params.region]
        region_dicts = dict_list_per_region[params.region]
        specs = [
            params.sun_expo,
            params.color,
            params.season,
            params.fruit,
            params.type,
            params.size,
        ]
        score = get_scores(specs, region_df, region_dicts)
        score = score.sort_values("Score", ascending=False)

        results: list[dict[str, Any]] = []
        used: list[str] = []
        query = (params.query or "").lower()

        if params.isOnlyText:
            limit = min(100, len(score))
            for i in range(limit):
                data = clean_data(score.iloc[i].to_dict())
                name = str(data.get("Name", ""))
                desc = str(data.get("Description", ""))
                if query:
                    if (
                        query in name.lower() or query in desc.lower()
                    ) and name not in used:
                        results.append(data)
                        used.append(name)
                else:
                    if name not in used:
                        results.append(data)
                        used.append(name)
        else:
            head = score.head(50)
            limit = min(10, len(head))
            for i in range(limit):
                data = clean_data(head.iloc[i].to_dict())
                name = str(data.get("Name", ""))
                desc = str(data.get("Description", ""))
                if name in used:
                    continue
                if query:
                    if query in name.lower() or query in desc.lower():
                        results.append(data)
                        used.append(name)
                else:
                    results.append(data)
                    used.append(name)

        return jsonify({"results": results})

    @app.get("/get-plant")
    def get_plant():
        blocked = require_ready()
        if blocked:
            return blocked

        try:
            q = GetPlantQuery.model_validate(request.args.to_dict())
        except ValidationError as exc:
            return handle_validation(exc)

        region_df = df_list_per_region[q.region]
        if q.id >= len(region_df):
            return error_response(
                404,
                "plant_not_found",
                f"No plant at id={q.id} for region={q.region}.",
            )

        data = clean_data(region_df.iloc[q.id].to_dict())
        return jsonify(data)

    @app.get("/init")
    def init_df():
        global dict_list_per_region, df_list_per_region
        dict_list_per_region, df_list_per_region = init()
        return jsonify(
            {
                "status": "done",
                "regions": len(df_list_per_region),
                "request_id": getattr(g, "request_id", None),
            }
        )

    return app


app = create_app()


def _bootstrap():
    global dict_list_per_region, df_list_per_region
    if AUTO_INIT:
        try:
            dict_list_per_region, df_list_per_region = init()
        except FileNotFoundError as exc:
            # Allow the process to start so /health still works; /ready
            # will stay 503 until data shows up or /init is called.
            app.logger.warning("AUTO_INIT skipped: %s", exc)


_bootstrap()


if __name__ == "__main__":
    app.run(host=os.environ.get("HOST", "0.0.0.0"), port=PORT)
