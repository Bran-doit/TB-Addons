import "./i18n-setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { defaults, validateSettings } from "../services/settings.js";
import { buildURL, normalizeFeature, PhotonService } from "../services/photon.js";

const feature = (properties = {}, coordinates = [13.4, 52.5]) => ({
  type: "Feature", geometry: { type: "Point", coordinates },
  properties: { street: "Teststraße", housenumber: "12", postcode: "12345", city: "Testort", country: "Deutschland", countrycode: "DE", ...properties },
});
const response = (features = [feature()]) => new Response(JSON.stringify({ features }), { status: 200 });

test("Deutschland weich bevorzugen, Sprache und Limit setzen, keine Länderfilter", () => {
  const url = new URL(buildURL("Straße & Ort", defaults));
  assert.equal(url.searchParams.get("q"), "Straße & Ort");
  assert.equal(url.searchParams.get("lang"), "de");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(url.searchParams.get("lat"), "51.16");
  assert.equal(url.searchParams.has("countrycode"), false);
  assert.equal(url.searchParams.has("bbox"), false);
  assert.equal(new URL(buildURL("Ort", { ...defaults, country: "" })).searchParams.has("lat"), false);
});
test("HTTPS und Einstellungsgrenzen", () => {
  for (const endpoint of ["http://localhost/api/", "https://user:secret@example.org/api", "https://example.org/?q=x", "javascript:alert(1)"]) {
    assert.throws(() => validateSettings({ endpoint }));
  }
  for (const limit of [0, 21, 1.5, NaN]) assert.throws(() => validateSettings({ limit }));
  assert.throws(() => validateSettings({ country: "ZZ" }));
  assert.equal(validateSettings({ endpoint: "https://example.org/photon/api/" }).endpoint, "https://example.org/photon/api/");
});
test("Deutsches Format, ausländisches Land, optionale Länderanzeige", () => {
  assert.equal(normalizeFeature(feature(), defaults).address, "Teststraße 12, 12345 Testort");
  assert.match(normalizeFeature(feature(), { ...defaults, showGermanCountry: true }).address, /Deutschland$/);
  assert.match(normalizeFeature(feature({ countrycode: "AT", country: "Österreich" }), defaults).address, /Österreich$/);
});
test("Unvollständige Treffer erfinden keine Hausnummern", () => {
  const result = normalizeFeature(feature({ housenumber: undefined }), defaults);
  assert.equal(result.address, "Teststraße, 12345 Testort");
  assert.match(result.warning, /Hausnummer/);
  assert.equal(normalizeFeature({ properties: { name: "Berlin" } }, defaults).address, "Berlin");
  assert.equal(normalizeFeature({ properties: {} }, defaults), null);
  assert.equal(normalizeFeature(null, defaults), null);
});
test("Ungültige Koordinaten und nichttextuelle Daten abweisen", () => {
  assert.equal(normalizeFeature(feature({}, [200, 95]), defaults).coordinates, null);
  assert.equal(normalizeFeature(feature({ street: { evil: true }, housenumber: undefined }), defaults).address, "12345 Testort");
});
test("Reihenfolge erhalten, Cache nutzen, nur Suchparameter übertragen", async () => {
  let count = 0;
  const service = new PhotonService({ interval: 0, fetcher: async (url, init) => {
    count++;
    assert.equal(init.credentials, "omit");
    assert.equal(init.redirect, "error");
    assert.equal(init.referrerPolicy, "no-referrer");
    assert.deepEqual([...new URL(url).searchParams.keys()].sort(), ["q", "lang", "limit", "lat", "lon", "zoom", "location_bias_scale"].sort());
    return response([feature({ city: "Erster" }), feature({ city: "Zweiter" })]);
  } });
  const results = await service.search("Test", defaults);
  assert.match(results[0].address, /Erster/);
  assert.match(results[1].address, /Zweiter/);
  assert.deepEqual(await service.search("Test", defaults), results);
  assert.equal(count, 1);
});
test("Leere Suche sendet nichts; leeres Ergebnis bleibt leer", async () => {
  let count = 0;
  const service = new PhotonService({ fetcher: async () => { count++; return response([]); } });
  assert.deepEqual(await service.search("  ", defaults), []);
  assert.equal(count, 0);
  assert.deepEqual(await service.search("Nichts", defaults), []);
});
test("HTTP 429 sperrt weitere Anfragen ohne automatische Wiederholung", async () => {
  let count = 0;
  const service = new PhotonService({ interval: 0, fetcher: async () => { count++; return new Response("", { status: 429, headers: { "Retry-After": "120" } }); } });
  await assert.rejects(service.search("A", defaults), /429/);
  await assert.rejects(service.search("B", defaults), /429/);
  assert.equal(count, 1);
  assert.ok(service.blockedUntil > Date.now() + 110000);
});
test("HTTP- und Netzwerkfehler werden verständlich gemeldet", async () => {
  const service = new PhotonService({ fetcher: async () => new Response("", { status: 503 }) });
  await assert.rejects(service.search("A", defaults), /503/);
  const offline = new PhotonService({ fetcher: async () => { throw new TypeError("offline"); } });
  await assert.rejects(offline.search("A", defaults), /Internetverbindung/);
});
test("Ungültiges JSON und falsches Antwortschema", async () => {
  const invalid = new PhotonService({ fetcher: async () => new Response("{broken") });
  await assert.rejects(invalid.search("A", defaults), /ungültige Antwort/);
  const schema = new PhotonService({ fetcher: async () => new Response("{}") });
  await assert.rejects(schema.search("A", defaults), /Photon-Antwort/);
});
test("Timeout und Abbruch stoppen laufende Anfragen", async () => {
  const fetcher = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  });
  await assert.rejects(new PhotonService({ fetcher, timeout: 10 }).search("A", defaults), /Zeitüberschreitung/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(new PhotonService({ fetcher }).search("A", defaults, controller.signal), /abgebrochen/);
});
test("Globale Warteschlange serialisiert Suchdialoge", async () => {
  let active = 0;
  let max = 0;
  const service = new PhotonService({ interval: 0, fetcher: async () => {
    active++;
    max = Math.max(active, max);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return response();
  } });
  await Promise.all([service.search("A", defaults), service.search("B", defaults)]);
  assert.equal(max, 1);
});
