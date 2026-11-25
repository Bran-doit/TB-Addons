import { t } from "../services/i18n.js";
import { PhotonService } from "../services/photon.js";
import { getSettings } from "../services/settings.js";
import { titleSuggestion, searchQueries } from "../services/query.js";

const photon = new PhotonService();
const sessions = new Map();

async function release(token) {
  const session = sessions.get(token);
  session?.controller?.abort();
  sessions.delete(token);
  await browser.osmCalendar.release(token);
}

browser.osmCalendar.onLookup.addListener(async (token, location, suggestion) => {
  const existing = sessions.get(token);
  if (existing) {
    if (existing.windowId !== null) await browser.windows.update(existing.windowId, { focused: true });
    return;
  }
  const session = { location, suggestion: titleSuggestion(suggestion), windowId: null, results: [], generation: 0, controller: null };
  sessions.set(token, session);
  try {
    const window = await browser.windows.create({
      url: browser.runtime.getURL("dialog/dialog.html") + "?session=" + encodeURIComponent(token),
      type: "popup", width: 740, height: 760,
    });
    session.windowId = window.id;
  } catch (_) {
    await release(token);
    console.error(t("openFailed"));
  }
});

browser.windows.onRemoved.addListener(windowId => {
  for (const [token, session] of sessions) {
    if (session.windowId === windowId) release(token).catch(() => {});
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  // Only our dialog can operate a session, never a remote frame or other extension.
  if (sender.id !== browser.runtime.id || !sender.url?.startsWith(browser.runtime.getURL("dialog/dialog.html") + "?")) return;
  return (async () => {
    const { token, action } = message;
    const session = sessions.get(token);
    if (!session || new URL(sender.url).searchParams.get("session") !== token) throw new Error(t("expired"));
    if (action === "init") return { location: session.location, suggestion: session.suggestion, settings: await getSettings() };
    if (action === "invalidate") {
      session.generation++;
      session.controller?.abort();
      session.results = [];
      return {};
    }
    if (action === "search") {
      session.controller?.abort();
      const controller = new AbortController();
      session.controller = controller;
      const generation = ++session.generation;
      session.results = [];
      const settings = await getSettings();
      if (typeof message.query !== "string" || message.query.length > 500) throw new Error(t("queryLength"));
      let results = [];
      let queryUsed = message.query;
      for (const query of searchQueries(message.query)) {
        queryUsed = query;
        results = await photon.search(query, settings, controller.signal);
        if (results.length) break;
      }
      if (controller.signal.aborted || session.generation !== generation) throw new Error(t("aborted"));
      session.results = results;
      return { results, generation, queryUsed };
    }
    if (action === "apply") {
      const result = Number.isInteger(message.index) && session.results[message.index];
      if (!result || message.generation !== session.generation) throw new Error(t("chooseCurrent"));
      await browser.osmCalendar.apply(token, result.address);
      await release(token);
      return {};
    }
    if (action === "cancel") { await release(token); return {}; }
    throw new Error(t("unknownAction"));
  })().then(data => ({ ok: true, ...data }), error => ({ ok: false, error: error.message }));
});
