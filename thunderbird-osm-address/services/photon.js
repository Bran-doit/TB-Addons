import { t } from "./i18n.js";
import { countries, validateSettings } from "./settings.js";

function value(p, key) { return typeof p[key] === "string" ? p[key].trim().slice(0, 300) : ""; }
export function normalizeFeature(feature, settings) {
  const p = feature?.properties;
  if (!p || typeof p !== "object") return null;
  const street = value(p, "street");
  const number = value(p, "housenumber");
  const name = value(p, "name");
  const city = value(p, "city") || value(p, "town") || value(p, "village") || value(p, "locality");
  const postcode = value(p, "postcode");
  const country = value(p, "country");
  const code = value(p, "countrycode").toUpperCase();
  const line = [street, number].filter(Boolean).join(" ") || name;
  const locality = [postcode, city].filter(Boolean).join(" ");
  const parts = [...new Set([line, locality].filter(Boolean))];
  if (!parts.length) return null;
  if (country && (code !== "DE" || settings.showGermanCountry)) parts.push(country);
  const coords = feature.geometry?.type === "Point" ? feature.geometry.coordinates : null;
  const coordinates = Array.isArray(coords) && coords.length >= 2 &&
    Number.isFinite(coords[0]) && Number.isFinite(coords[1]) &&
    Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90 ? coords.slice(0, 2) : null;
  return { address: parts.join(", "), name, country, coordinates,
    warning: !street ? t("incomplete") : !number ? t("noNumber") : "" };
}

export function buildURL(query, settings) {
  const s = validateSettings(settings);
  const url = new URL(s.endpoint);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("lang", s.language);
  url.searchParams.set("limit", String(s.limit));
  const center = countries[s.country];
  if (center) {
    url.searchParams.set("lat", String(center.lat));
    url.searchParams.set("lon", String(center.lon));
    url.searchParams.set("zoom", "5");
    url.searchParams.set("location_bias_scale", "0.4");
  }
  return url.href;
}

export class PhotonService {
  constructor({ fetcher = globalThis.fetch.bind(globalThis), timeout = 15000, interval = 1100 } = {}) {
    this.fetcher = fetcher;
    this.timeout = timeout;
    this.interval = interval;
    this.nextRequest = 0;
    this.blockedUntil = 0;
    this.queue = Promise.resolve();
    this.cache = new Map();
  }
  search(query, settings, signal) {
    const run = this.queue.then(() => this.perform(query, settings, signal));
    this.queue = run.catch(() => {});
    return run;
  }
  async perform(query, settings, signal) {
    if (signal?.aborted) throw new Error(t("aborted"));
    if (typeof query !== "string" || !query.trim()) return [];
    if (query.length > 500) throw new Error(t("tooLong"));
    const url = buildURL(query, settings);
    const key = url + "|" + settings.showGermanCountry;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.time < 300000) return cached.results;
    if (Date.now() < this.blockedUntil) throw new Error(t("rateLimit"));
    const delay = Math.max(0, this.nextRequest - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (signal?.aborted) throw new Error(t("aborted"));
    this.nextRequest = Date.now() + this.interval;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeout);
    try {
      const response = await this.fetcher(url, { signal: controller.signal, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" });
      if (response.status === 429) {
        const header = response.headers.get("Retry-After");
        const seconds = header && /^\d+$/.test(header) ? Number(header) : 0;
        const date = header ? Date.parse(header) : NaN;
        this.blockedUntil = Math.max(Date.now() + 60000, seconds ? Date.now() + seconds * 1000 : (date || 0));
        throw new Error(t("rateLimit"));
      }
      if (!response.ok) throw new Error(t("httpError", [String(response.status)]));
      const data = await response.json();
      if (!Array.isArray(data.features)) throw new Error(t("invalidPhoton"));
      const results = data.features.slice(0, settings.limit).map(f => normalizeFeature(f, settings)).filter(Boolean);
      this.cache.set(key, { time: Date.now(), results });
      if (this.cache.size > 50) this.cache.delete(this.cache.keys().next().value);
      return results;
    } catch (error) {
      if (timedOut) throw new Error(t("timeout"));
      if (signal?.aborted) throw new Error(t("aborted"));
      if (error instanceof SyntaxError) throw new Error(t("invalidResponse"));
      if (error instanceof TypeError) throw new Error(t("offline"));
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
}
