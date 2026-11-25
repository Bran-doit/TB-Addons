import { t, localizePage } from "../services/i18n.js";
import { clearMap, showMap } from "./map.js";
localizePage();
const $ = id => document.getElementById(id);
const token = new URL(location.href).searchParams.get("session");
let settings;
let results = [];
let selected = -1;
let generation = 0;
let requestId = 0;
let applying = false;

async function send(action, data = {}) {
  const response = await browser.runtime.sendMessage({ action, token, ...data });
  if (!response?.ok) throw new Error(response?.error || t("unresponsive"));
  return response;
}
function status(text, error = false) {
  $("status").textContent = text;
  $("status").className = error ? "error" : "";
}
function clear() {
  selected = -1;
  results = [];
  $("results").replaceChildren();
  $("results-box").hidden = true;
  $("apply").disabled = true;
  $("preview").hidden = true;
  $("map-box").hidden = true;
  clearMap();
}
function choose(index) {
  selected = index;
  const result = results[index];
  $("apply").disabled = false;
  $("preview").textContent = t("preview") + result.address;
  $("preview").hidden = false;
  if (settings.map && result.coordinates) {
    $("map-box").hidden = false;
    showMap(result.coordinates);
  } else {
    $("map-box").hidden = true;
    clearMap();
  }
}
async function search(event) {
  event?.preventDefault();
  if (applying) return;
  const id = ++requestId;
  clear();
  const query = $("query").value.trim();
  if (!query) { status(t("enterQuery")); return; }
  $("search").disabled = true;
  status(t("searching"));
  try {
    const response = await send("search", { query });
    if (id !== requestId) return;
    results = response.results;
    generation = response.generation;
    $("results-box").hidden = results.length === 0;
    results.forEach((result, index) => {
      const label = document.createElement("label");
      label.className = "result";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "address";
      radio.addEventListener("change", () => choose(index));
      const text = document.createElement("span");
      const address = document.createElement("strong");
      address.textContent = result.name || result.address;
      text.append(address);
      const detail = document.createElement("small");
      detail.textContent = [result.name ? result.address : "", result.country, result.warning].filter(Boolean).join(" · ");
      text.append(detail);
      label.append(radio, text);
      $("results").append(label);
    });
    const used = response.queryUsed !== query ? t("queryUsed", [response.queryUsed]) : "";
    status((results.length ? t("resultCount", [String(results.length)]) : t("noResults")) + used);
  } catch (error) {
    if (id === requestId) status(error.message, true);
  } finally {
    if (id === requestId) $("search").disabled = false;
  }
}
$("search-form").addEventListener("submit", search);
$("query").addEventListener("input", () => {
  requestId++;
  clear();
  $("search").disabled = false;
  send("invalidate").catch(error => status(error.message, true));
  status(t("searchAgain"));
});
$("apply").addEventListener("click", async () => {
  if (selected < 0 || applying) return;
  applying = true;
  $("apply").disabled = true;
  $("query").disabled = true;
  $("search").disabled = true;
  $("cancel").disabled = true;
  try { await send("apply", { index: selected, generation }); window.close(); }
  catch (error) {
    status(error.message, true);
    applying = false;
    $("apply").disabled = false;
    $("query").disabled = false;
    $("search").disabled = false;
    $("cancel").disabled = false;
  }
});
async function cancel() {
  if (applying) return;
  requestId++;
  try { await send("cancel"); } finally { window.close(); }
}
$("cancel").addEventListener("click", cancel);
document.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); cancel(); } });
$("settings").addEventListener("click", () => browser.runtime.openOptionsPage());
try {
  const response = await send("init");
  settings = response.settings;
  $("query").value = response.location || response.suggestion;
  $("privacy").textContent = t("privacyNotice", [new URL(settings.endpoint).host]);
  status(!response.location && response.suggestion ? t("titleSuggestion") : t("searchAgain"));
} catch (error) { status(error.message, true); }

