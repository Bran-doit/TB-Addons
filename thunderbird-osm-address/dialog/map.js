// Local renderer: OSM raster images only, no third-party scripts or frames.
import { t } from "../services/i18n.js";
let point = null;
let zoom = 15;
let controller;
const urls = new Set();
const host = () => document.getElementById("map");
function clearTiles() {
  controller?.abort();
  for (const url of urls) URL.revokeObjectURL(url);
  urls.clear();
  host().replaceChildren();
}
export function clearMap() { point = null; clearTiles(); }
export function showMap(coordinates) { point = coordinates; render(); }
function render() {
  const container = host();
  clearTiles();
  if (!point) return;
  controller = new AbortController();
  const signal = controller.signal;
  const [lon, rawLat] = point;
  const lat = Math.max(-85.0511, Math.min(85.0511, rawLat)) * Math.PI / 180;
  const n = 2 ** zoom;
  const x = (lon + 180) / 360 * n;
  const y = (1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * n;
  const tiles = document.createElement("div");
  tiles.className = "map-tiles";
  container.append(tiles);
  const error = document.createElement("p");
  error.className = "map-error";
  error.hidden = true;
  error.textContent = t("mapError");
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const tx = Math.floor(x) + dx;
    const ty = Math.floor(y) + dy;
    if (ty < 0 || ty >= n) continue;
    const left = (tx - x) * 256;
    const top = (ty - y) * 256;
    const width = container.clientWidth || 512;
    if (left >= width / 2 || left + 256 <= -width / 2 || top >= 128 || top + 256 <= -128) continue;
    const img = document.createElement("img");
    img.alt = "";
    img.width = img.height = 256;
    img.style.left = `calc(50% + ${(tx - x) * 256}px)`;
    img.style.top = `calc(50% + ${(ty - y) * 256}px)`;
    img.addEventListener("error", () => { error.hidden = false; });
    const tileURL = `https://tile.openstreetmap.org/${zoom}/${((tx % n) + n) % n}/${ty}.png`;
    fetch(tileURL, {
      credentials: "omit", signal, cache: "default", redirect: "error",
      headers: { "User-Agent": `OSMAddressLookup/${browser.runtime.getManifest().version} (Thunderbird add-on)` },
    }).then(response => {
      if (!response.ok) throw new Error("Tile unavailable");
      return response.blob();
    }).then(blob => {
      if (signal.aborted) return;
      const url = URL.createObjectURL(blob);
      urls.add(url);
      img.src = url;
    }).catch(() => { if (!signal.aborted) error.hidden = false; });
    tiles.append(img);
  }
  const marker = document.createElement("img");
  marker.src = "../icons/marker.svg";
  marker.alt = "";
  marker.className = "map-marker";
  container.append(marker, error);
  const controls = document.createElement("div");
  controls.className = "map-controls";
  for (const [label, step, symbol] of [["zoomIn", 1, "+"], ["zoomOut", -1, "−"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = symbol;
    button.title = t(label);
    button.setAttribute("aria-label", t(label));
    button.disabled = zoom + step < 2 || zoom + step > 18;
    button.addEventListener("click", () => { zoom += step; render(); });
    controls.append(button);
  }
  const attribution = document.createElement("a");
  attribution.href = "https://www.openstreetmap.org/copyright";
  attribution.target = "_blank";
  attribution.rel = "noopener noreferrer";
  attribution.textContent = t("attribution");
  attribution.className = "map-attribution";
  container.append(controls, attribution);
}
