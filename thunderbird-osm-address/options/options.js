import { t, localizePage } from "../services/i18n.js";
import { countries, defaults, getSettings, validateSettings } from "../services/settings.js";
const $ = id => document.getElementById(id);
for (const [code, country] of Object.entries(countries)) {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = new Intl.DisplayNames([browser.i18n.getUILanguage()], { type: "region" }).of(code);
  $("country").append(option);
}
function fill(settings) {
  for (const key of Object.keys(defaults)) {
    if (typeof defaults[key] === "boolean") $(key).checked = settings[key];
    else $(key).value = settings[key];
  }
}
function message(text, error = false) { $("status").textContent = text; $("status").className = error ? "error" : ""; }
$("options").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const settings = validateSettings({
      endpoint: $("endpoint").value.trim(), language: $("language").value.trim().toLowerCase(),
      country: $("country").value, limit: Number($("limit").value),
      map: $("map").checked, showGermanCountry: $("showGermanCountry").checked,
    });
    await browser.storage.local.set({ settings });
    message(t("saved"));
  } catch (error) { message(error.message, true); }
});
$("reset").addEventListener("click", () => { fill(defaults); message(t("resetNotice")); });
try { fill(await getSettings()); } catch (error) { fill(defaults); message(error.message, true); }

localizePage();
