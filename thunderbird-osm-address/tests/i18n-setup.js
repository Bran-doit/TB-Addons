import { readFileSync } from "node:fs";
const messages = JSON.parse(readFileSync(new URL("../_locales/de/messages.json", import.meta.url), "utf8"));
globalThis.browser = { i18n: {
  getMessage(key, substitutions = []) {
    return (messages[key]?.message || "").replace(/\$([1-9])/g, (_, n) => substitutions[Number(n) - 1] ?? "");
  },
  getUILanguage() { return "de"; },
} };
