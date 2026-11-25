export const t = (key, substitutions = []) => browser.i18n.getMessage(key, substitutions) || key;

export function localizePage() {
  const version = document.getElementById("version");
  if (version) version.textContent = "OSM Address Lookup " + browser.runtime.getManifest().version;
  document.documentElement.lang = browser.i18n.getUILanguage();
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-title]")) {
    element.title = t(element.dataset.i18nTitle);
  }
  for (const element of document.querySelectorAll("[data-i18n-label]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nLabel));
  }
}
