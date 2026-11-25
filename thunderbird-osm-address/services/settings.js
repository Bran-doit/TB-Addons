import { t } from "./i18n.js";
export const defaults = Object.freeze({
  endpoint: "https://photon.komoot.io/api/",
  language: "de", country: "DE", map: false, showGermanCountry: false, limit: 10,
});

// Approximate country centres for a soft location bias, never a country filter.
export const countries = Object.freeze({
  DE: { name: "Deutschland", lat: 51.16, lon: 10.45 },
  AT: { name: "Österreich", lat: 47.6, lon: 14.1 },
  CH: { name: "Schweiz", lat: 46.8, lon: 8.2 },
  FR: { name: "Frankreich", lat: 46.6, lon: 2.3 },
  NL: { name: "Niederlande", lat: 52.2, lon: 5.3 },
  BE: { name: "Belgien", lat: 50.6, lon: 4.7 },
  PL: { name: "Polen", lat: 52.1, lon: 19.4 },
  CZ: { name: "Tschechien", lat: 49.8, lon: 15.5 },
  IT: { name: "Italien", lat: 42.8, lon: 12.8 },
  ES: { name: "Spanien", lat: 40.4, lon: -3.7 },
});

export function validateSettings(input) {
  const s = { ...defaults, ...input };
  let url;
  try { url = new URL(s.endpoint); } catch (_) { throw new Error(t("httpsURL")); }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) {
    throw new Error(t("httpsOnly"));
  }
  if (!/^[a-z]{2,3}$/.test(s.language)) throw new Error(t("languageCode"));
  if (s.country !== "" && !countries[s.country]) throw new Error(t("countryChoice"));
  if (!Number.isInteger(s.limit) || s.limit < 1 || s.limit > 20) throw new Error(t("limitRange"));
  return { endpoint: url.href, language: s.language, country: s.country,
    map: s.map === true, showGermanCountry: s.showGermanCountry === true, limit: s.limit };
}

export async function getSettings() {
  const { settings } = await browser.storage.local.get("settings");
  return validateSettings(settings || {});
}
