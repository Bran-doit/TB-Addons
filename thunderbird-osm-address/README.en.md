# OSM Address Lookup 0.4.1

English | [Deutsch](README.md)

**Turn a place name into an address in your calendar event.** Search for schools,
businesses and other places with Photon and OpenStreetMap, choose the right result
and use its address in Thunderbird’s Location field. For example, a school name
such as “GS Potsdam Babelsberg Kopf Herz Hand” can be the starting point.

## Install

[Download version 0.4.1](../downloads/osm-address-lookup-0.4.1.xpi?raw=true)
(use “Download raw file” on GitHub if needed). In Thunderbird, open Add-ons and
Themes → gear menu → Install Add-on From File. The stable add-on ID updates an
existing installation. Close and reopen event editors after updating.

The manifest supports Thunderbird 128.0–161.*. Version 0.4.0 passed calendar
integration tests on 128.6.1 and 161.0; intermediate versions were not individually
tested. Version 0.4.1 adds descriptions and detailed settings without changing
the search or calendar integration logic. See [test details](docs/TESTS.md).

## Find and use an address

1. Open a calendar event and click **Find address** beside Location.
2. If Location is empty, selected title text or the title becomes an editable
   suggestion. Review the query and provider, then click **Search and send**.
3. Select the correct place and click **Use address**. Save the event yourself.

German abbreviations such as GS and ev. GS are expanded; leading time ranges and
TdA are removed from title suggestions. Long place names without results may be
retried with up to two shorter queries, shown in the dialog. Addresses are never
invented. Multiple branches require your selection; results are not official
postal verification. Cancel does not change the event. Changed, closed or read-only
events are protected from stale address updates.

## Settings and languages

Open Add-ons Manager → OSM Address Lookup → Preferences/Options. The settings page
explains the add-on and lets you configure the Photon HTTPS endpoint, result
language, country preference, number of results (1–20), country display and map.
Country preference is a geographic bias, not a strict filter. The optional map
is off by default and uses locally bundled code to display visible OSM tiles.

The interface follows Thunderbird’s German or English locale, with English as
fallback. Search-result language is configured independently (German by default).

## Privacy and permissions

Only submitting a search sends its query, possible shortened variants, language
and geographic parameters to your configured Photon provider (photon.komoot.io
by default), which also sees your IP address. An enabled map sends the viewed area,
IP address and add-on identifier/version to OpenStreetMap’s tile service.
No advertising, accounts or telemetry; requests omit cookies and credentials.
Settings stay local; up to 50 searches are cached in memory for five minutes.
See the full [privacy notice](docs/PRIVACY.en.md).

Direct calendar integration uses an Experiment API, requiring Thunderbird’s full
access permission. HTTPS host permission enables custom Photon servers. There are
no dedicated mail, account or contact API permissions. Public services offer no
availability guarantee. Queries are spaced at least 1.1 seconds apart, have a
15-second timeout and respect HTTP 429 backoff. Use your own server for heavy use.

## Development and support

Python 3: `python build.py` validates UTF-8, translations and local scripts, then
creates reproducible XPI/source ZIP files and SHA-256 checksums under `build/`.
No build dependencies or minification. Node 20+: `node --test tests/*.test.js`.

[Report an issue](https://github.com/Bran-doit/TB-Addons/issues).
Own code is [MIT licensed](LICENSE); OpenStreetMap data is ODbL.
This is a GitHub distribution, not an ATN approval. Desktop acceptance and ATN
validation/review remain outstanding. See [publishing notes](docs/PUBLISHING.md).
