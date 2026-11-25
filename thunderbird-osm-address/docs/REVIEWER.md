# Reviewer notes — OSM Address Lookup 0.4.1

Version 0.4.1 adds bilingual descriptions, detailed settings help and a GitHub homepage.
This is a pre-submission package for ATN. Thunderbird 161.0 and 128.6.1 pass the
integration suite. The manifest supports 128.0 through 161.*; intermediate
versions including ESR 153.8.0 have not been run individually. Remaining review
and publisher-account work is recorded in PUBLISHING.md.

New in 0.4.0: a bounded readiness probe handles late/replaced editor Frame
WindowProxies in Thunderbird 161. It checks only relevant calendar frames at
50 ms intervals, stops after initialization or 600 attempts, and cancels timers
on frame removal and extension cleanup. No persistent polling.

The narrow Experiment adds a button immediately beside `item-location` in
`chrome://calendar/content/calendar-item-iframe.xhtml`. Built-in toolbar/menu
APIs do not supply that insertion point. It reads the location and title/selected
title text, and updates only the location after explicit result selection. It
does not save calendar items or access email. `ExtensionSupport` enumerates
existing windows; frame load listeners cover new editors and calendar tabs.
Listeners, observers and injected DOM are removed on shutdown/uninstall.

Permissions: storage stores preferences; https://*/* supports user-configured
HTTPS Photon instances and map tiles. No message/account/address-book permissions.
The Experiment inherently has full privileges, reflected in Thunderbird's prompt.
No optional permissions are used because Experiments do not support them.

All executable code is local and readable. No bundled third-party libraries,
remote scripts, eval, telemetry, advertisements, monetization or accounts.
JSON fields are inserted with textContent. CSP forbids frames and external scripts.
Map tiles are fetched with cookies omitted, normal HTTP caching and the identifying
User-Agent OSMAddressLookup/<version> (Thunderbird add-on); only visible tiles are
requested. The map is opt-in and nonessential to address selection.

Build with Python 3: `python build.py`. No dependencies or generated/minified
runtime code. Tests require Node >=20: `node --test tests/*.test.js`.
The Python Thunderbird runner starts only a separate test profile. Do not point
the test harness at production profiles. It uses Marionette and sets
extensions.webextensions.remote=false only in that isolated test profile.

Manual test, no credentials required:

1. Install the XPI on a compatible Thunderbird with a writable local calendar.
2. Open a new event; Find address appears immediately right of Location.
3. Set Location to “Unter den Linden 6 Berlin”, open Find address. No query is
   sent yet. Click Search and send, choose a result, then Use address. Save/reopen.
4. With an empty Location and title “10-13 Uhr TdA ev. GS Potsdam Babelsberg
   Kopf, Herz & Hand”, review the local suggestion and search. Longer school
   queries may be shortened; the query actually used is displayed.
5. Open two editors, cancel a search, change a location while searching, and
   verify the extension does not overwrite the wrong/currently edited value.
6. Change Thunderbird UI language between German and English and reopen dialogs.
   Settings separately control the language requested from Photon.
7. Enable the map in settings, reopen search and select a result; check marker,
   attribution and zoom. Failed map requests must not prevent Use address.
8. Disable/uninstall the add-on; injected buttons disappear.

Live service availability is not guaranteed. Empty results, timeout, 429,
malformed responses, cancellation and serialization also have automated tests.
