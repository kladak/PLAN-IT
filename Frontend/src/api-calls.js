/**
 * Thin client for the PLAN-IT Flask API.
 *
 * Base URL (first match wins):
 *   1. EXPO_PUBLIC_API_URL
 *   2. window.__PLANIT_API_URL__ (web override)
 *   3. http://127.0.0.1:5001  (local default — same as Backend README)
 */

const DEFAULT_API_BASE = 'http://127.0.0.1:5001';

function resolveApiBase() {
  if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) {
    return String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.__PLANIT_API_URL__) {
    return String(window.__PLANIT_API_URL__).replace(/\/$/, '');
  }
  return DEFAULT_API_BASE;
}

class ApiError extends Error {
  constructor(message, { status, code, details, requestId } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, options = {}) {
  const base = resolveApiBase();
  const url = `${base}${path}`;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError(
      `Cannot reach API at ${base}. Is the Backend running? (${err.message})`,
      { status: 0, code: 'network_error' }
    );
  }

  const body = await parseJsonSafe(response);
  const requestId =
    (response.headers && response.headers.get && response.headers.get('X-Request-ID')) ||
    (body && body.error && body.error.request_id) ||
    null;

  if (!response.ok) {
    const err = (body && body.error) || {};
    throw new ApiError(err.message || `Request failed (${response.status})`, {
      status: response.status,
      code: err.code || 'http_error',
      details: err.details,
      requestId,
    });
  }

  return body;
}

/** Liveness: process is up. */
const checkHealth = async () => request('/health');

/** Readiness: regional indexes loaded. */
const checkReady = async () => request('/ready');

/**
 * Ensure indexes are loaded. Prefers /ready; falls back to /init if not ready.
 * Safe to call on app start (Backend also AUTO_INITs by default).
 */
const init = async () => {
  try {
    const ready = await checkReady();
    if (ready && ready.status === 'ready') {
      return ready;
    }
  } catch (err) {
    // /ready 503 or network — try /init below when possible
    if (err.status === 0) throw err;
  }
  return request('/init');
};

/** GET one plant by id + region (0–7). */
const getPlant = async (id, region = 0) => {
  const params = new URLSearchParams({
    id: String(id),
    region: String(region),
  });
  return request(`/get-plant?${params.toString()}`);
};

/**
 * POST /search — rank plants for a region + optional filters / text query.
 * Returns { results: [...] }. Throws ApiError on failure.
 */
const searchPlants = async (searchParams = {}) => {
  const region =
    searchParams.region === undefined || searchParams.region === null
      ? 0
      : Number(searchParams.region);

  const payload = {
    region: Number.isFinite(region) ? region : 0,
    query: searchParams.query || '',
    isOnlyText:
      searchParams.isOnlyText !== undefined
        ? Boolean(searchParams.isOnlyText)
        : Object.keys(searchParams).filter(
            (k) => !['query', 'region', 'isOnlyText'].includes(k)
          ).length === 0,
    sun_expo: searchParams.sun_expo || null,
    color: searchParams.color || null,
    season: searchParams.season || null,
    fruit: searchParams.fruit || null,
    type: searchParams.type || null,
    size: searchParams.size || null,
  };

  return request('/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

const getApiBase = () => resolveApiBase();

export {
  ApiError,
  checkHealth,
  checkReady,
  getApiBase,
  getPlant,
  init,
  searchPlants,
};
