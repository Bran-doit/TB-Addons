/* SPDX-License-Identifier: MIT
 * The only privileged component. No networking and no calendar database writes.
 */
var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");
var { ExtensionUtils } = ChromeUtils.importESModule("resource://gre/modules/ExtensionUtils.sys.mjs");
var { ExtensionSupport } = ChromeUtils.importESModule("resource:///modules/ExtensionSupport.sys.mjs");

var osmCalendar = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    const t = (key) => context.extension.localizeMessage(key);
    const editorURL = "chrome://calendar/content/calendar-item-iframe.xhtml";
    const hooks = new Map();
    const editors = new Map();
    const sessions = new Map();
    const listenerId = context.extension.id + ":osm-location";
    let notify = null;
    let started = false;

    function detach(doc) {
      const entry = editors.get(doc);
      if (!entry) return;
      entry.observer.disconnect();
      entry.button.removeEventListener("click", entry.click);
      entry.win.removeEventListener("unload", entry.unload);
      entry.button.remove();
      entry.style.remove();
      entry.cell.classList.remove("osm-address-cell");
      for (const [token, session] of sessions) {
        if (session.doc === doc) sessions.delete(token);
      }
      editors.delete(doc);
    }

    function attach(doc) {
      if (doc.documentURI !== editorURL || editors.has(doc)) return;
      const field = doc.getElementById("item-location");
      const win = doc.defaultView;
      // The shared editor also handles tasks. This add-on only changes events.
      if (!field || !win.calendarItem?.isEvent()) return;
      const cell = field.parentElement;
      const ns = "http://www.w3.org/1999/xhtml";
      const style = doc.createElementNS(ns, "style");
      style.textContent = ".osm-address-cell { display:flex; align-items:center; gap:6px; } .osm-address-cell > #item-location { flex:1; min-width:0; width:auto; } .osm-address-cell > .osm-address-button { flex:none; white-space:nowrap; padding:3px 9px; }";
      const button = doc.createElementNS(ns, "button");
      button.type = "button";
      button.className = "osm-address-button";
      button.textContent = t("lookup");
      button.title = t("lookupTip");
      button.setAttribute("disable-on-readonly", "true");
      const sync = () => { button.disabled = field.disabled || field.readOnly; };
      const click = () => {
        sync();
        if (button.disabled || !notify) return;
        let token = [...sessions].find(([, s]) => s.doc === doc)?.[0];
        if (!token) {
          token = Services.uuid.generateUUID().toString();
          const title = doc.getElementById("item-title");
          const selectedTitle = title?.value.slice(title.selectionStart, title.selectionEnd).trim();
          sessions.set(token, { doc, field, initial: field.value,
            suggestion: selectedTitle || title?.value || "" });
        }
        notify(token, sessions.get(token).initial, sessions.get(token).suggestion);
      };
      const unload = () => detach(doc);
      button.addEventListener("click", click);
      win.addEventListener("unload", unload, { once: true });
      const observer = new win.MutationObserver(sync);
      observer.observe(field, { attributes: true, attributeFilter: ["disabled", "readonly"] });
      editors.set(doc, { field, cell, button, style, observer, click, unload, win });
      cell.classList.add("osm-address-cell");
      doc.documentElement.appendChild(style);
      field.after(button);
      sync();
    }

    function scan(win) {
      try {
        if (win.document.readyState === "complete") attach(win.document);
        for (let i = 0; i < win.frames.length; i++) scan(win.frames[i]);
      } catch (_) { /* Unrelated remote/browser frames are not accessible. */ }
    }

    function watch(win) {
      if (hooks.has(win)) return;
      const frames = new Map();
      const scanFrames = () => {
        for (const frame of win.document.querySelectorAll("iframe")) {
          if (frame.getAttribute("src") !== editorURL || frames.has(frame)) continue;
          // Thunderbird 161 can create/replace the frame WindowProxy after the
          // outer load event. A bounded readiness probe bridges that gap; normal
          // load listeners remain in place. No polling after initialization.
          const loaded = () => {
            if (loaded.timer) win.clearTimeout(loaded.timer);
            loaded.timer = null;
            if (!hooks.has(win) || !frame.isConnected) return;
            const frameWindow = frame.contentWindow;
            if (frameWindow && loaded.frameWindow !== frameWindow) {
              loaded.frameWindow?.removeEventListener("load", loaded);
              loaded.frameWindow = frameWindow;
              frameWindow.addEventListener("load", loaded);
            }
            const doc = frame.contentDocument;
            if (doc?.documentURI === editorURL && doc.readyState === "complete" && frameWindow?.calendarItem) {
              attach(doc);
              return;
            }
            if (++loaded.attempts < 600) loaded.timer = win.setTimeout(loaded, 50);
          };
          loaded.attempts = 0;
          loaded.timer = null;
          frame.addEventListener("load", loaded);
          frames.set(frame, loaded);
          loaded();
        }
        for (const [frame, loaded] of frames) {
          if (!frame.isConnected) {
            if (loaded.timer) win.clearTimeout(loaded.timer);
            frame.removeEventListener("load", loaded);
            loaded.frameWindow?.removeEventListener("load", loaded);
            frames.delete(frame);
          }
        }
      };
      const load = event => {
        const doc = event.target;
        if (doc?.nodeType === 9 && doc.documentURI === editorURL) {
          // Run after the editor's own onLoad has assigned window.calendarItem.
          win.setTimeout(() => { if (hooks.has(win) && doc.defaultView) attach(doc); }, 0);
        }
      };
      const unload = () => unwatch(win);
      // Chrome event capture includes dynamically inserted calendar iframes.
      win.addEventListener("load", load, true);
      win.addEventListener("unload", unload, { once: true });
      const observer = new win.MutationObserver(scanFrames);
      observer.observe(win.document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
      hooks.set(win, { load, unload, observer, frames });
      scanFrames();
      scan(win);
    }

    function unwatch(win) {
      const hook = hooks.get(win);
      if (!hook) return;
      win.removeEventListener("load", hook.load, true);
      win.removeEventListener("unload", hook.unload);
      hook.observer.disconnect();
      for (const [frame, loaded] of hook.frames) {
        if (loaded.timer) win.clearTimeout(loaded.timer);
        frame.removeEventListener("load", loaded);
        loaded.frameWindow?.removeEventListener("load", loaded);
      }
      for (const [doc, entry] of editors) {
        if (entry.win.top === win) detach(doc);
      }
      hooks.delete(win);
    }

    const stop = () => {
      if (started) ExtensionSupport.unregisterWindowListener(listenerId);
      started = false;
      for (const win of [...hooks.keys()]) unwatch(win);
      for (const doc of [...editors.keys()]) detach(doc);
      sessions.clear();
      notify = null;
    };
    context.callOnClose({ close: stop });

    return { osmCalendar: {
      onLookup: new ExtensionCommon.EventManager({
        context, name: "osmCalendar.onLookup",
        register: fire => {
          notify = (token, location, suggestion) => fire.async(token, location, suggestion);
          started = true;
          ExtensionSupport.registerWindowListener(listenerId, {
            chromeURLs: ["chrome://messenger/content/messenger.xhtml", "chrome://calendar/content/calendar-event-dialog.xhtml"],
            onLoadWindow: watch,
            onUnloadWindow: unwatch,
          });
          return stop;
        },
      }).api(),
      async apply(token, address) {
        const session = sessions.get(token);
        if (!session || !session.field.isConnected || session.doc.defaultView.closed) {
          throw new ExtensionUtils.ExtensionError(t("closed"));
        }
        const { field, doc, initial } = session;
        if (field.disabled || field.readOnly) {
          throw new ExtensionUtils.ExtensionError(t("readonly"));
        }
        if (field.value !== initial) {
          throw new ExtensionUtils.ExtensionError(t("conflict"));
        }
        if (typeof address !== "string" || !address.trim() || address.length > 2000) {
          throw new ExtensionUtils.ExtensionError(t("invalidAddress"));
        }
        field.value = address;
        field.dispatchEvent(new doc.defaultView.Event("input", { bubbles: true }));
        field.dispatchEvent(new doc.defaultView.Event("change", { bubbles: true }));
        // saveDialog/isItemChanged read field.value directly in Thunderbird 128.
        field.focus();
        sessions.delete(token);
      },
      async release(token) { sessions.delete(token); },
    } };
  }
};
