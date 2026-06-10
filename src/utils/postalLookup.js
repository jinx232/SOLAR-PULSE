// Simple postal code / place lookup using OpenStreetMap Nominatim
// Adds: Vite env override, in-memory + localStorage caching, and improved error handling

const CACHE_MAP = new Map();
const LS_KEY_PREFIX = 'postalLookup:v1:';
const DEFAULT_TTL = 60 * 60 * 6; // 6 hours in seconds

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function readFromLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.expires || parsed.expires < nowSeconds()) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch (e) {
    return null;
  }
}

function writeToLocalStorage(key, value, ttlSeconds) {
  try {
    const payload = {
      value,
      expires: nowSeconds() + ttlSeconds
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    // ignore storage errors
  }
}

export async function searchPostalCode(query, options = {}) {
  if (!query) return [];
  const cleanQuery = String(query).trim();

  const apiUrl = options.apiUrl || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NOMINATIM_URL) || 'https://nominatim.openstreetmap.org/search';
  const params = new URLSearchParams({
    q: cleanQuery,
    format: 'json',
    addressdetails: '1',
    limit: String(options.limit || 6)
  });
  if (options.country) params.append('countrycodes', options.country);
  if (options.email) params.append('email', options.email);

  const url = `${apiUrl}?${params.toString()}`;

  // Check in-memory cache
  if (CACHE_MAP.has(url)) {
    const cached = CACHE_MAP.get(url);
    if (cached.expires > nowSeconds()) return cached.value;
    CACHE_MAP.delete(url);
  }

  // Check localStorage cache
  const lsKey = LS_KEY_PREFIX + encodeURIComponent(url);
  const lsValue = readFromLocalStorage(lsKey);
  if (lsValue) {
    // populate in-memory cache for faster subsequent reads
    CACHE_MAP.set(url, { value: lsValue, expires: nowSeconds() + (options.ttl || DEFAULT_TTL) });
    return lsValue;
  }

  // Perform network request
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'Accept-Language': options.acceptLanguage || 'en'
      }
    });
  } catch (networkErr) {
    throw new Error('Network error during postal lookup');
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Rate limited by lookup provider (429). Try again later.');
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Postal lookup failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const mapped = (data || []).map(d => ({
    display_name: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
    address: d.address
  }));

  // Cache result
  const ttl = options.ttl || DEFAULT_TTL;
  try {
    CACHE_MAP.set(url, { value: mapped, expires: nowSeconds() + ttl });
    writeToLocalStorage(lsKey, mapped, ttl);
  } catch (e) {
    // ignore cache errors
  }

  return mapped;
}
