# Thunderbird Add-ons

[Deutsch](README.md) | English

## OSM Address Lookup

**Turn a place name into an address in your calendar event.** Find schools,
businesses and other places with Photon and OpenStreetMap. Choose the matching
result and use its address in Thunderbird's Location field.

When Location is empty, the event title or selected text provides an editable
suggestion. Searches start only after you click **Search and send**. An optional
map helps you choose. English and German interfaces are included.

- **[Download version 0.4.1](downloads/osm-address-lookup-0.4.1.xpi?raw=true)**
- [Features, instructions and privacy](thunderbird-osm-address/README.en.md)
- [Source code](thunderbird-osm-address) · [Checksums](downloads/SHA256SUMS.txt)
- [Report an issue / Support](https://github.com/Bran-doit/TB-Addons/issues)

Download the XPI (use "Download raw file" on GitHub if needed), then choose
**Add-ons and Themes → gear menu → Install Add-on From File** in Thunderbird.
An existing installation will be updated. Reopen old event editors afterwards.
The short description appears in Add-ons Manager; detailed help is available
through its settings button, opening a separate tab.

The manifest allows Thunderbird 128.0–161.*. Calendar integration was tested with
0.4.0 on 128.6.1 and 161.0; intermediate versions were not individually tested.
0.4.1 passed 17 module tests and German/English interface checks on 161.0.
[Testing scope](thunderbird-osm-address/docs/TESTS.md).

Calendar integration requires an Experiment API and full Thunderbird permission.
Submitting a search sends its query and your IP address to the chosen Photon
provider. The optional map is off by default. No telemetry, advertising or accounts.

Distributed on GitHub; not approved by addons.thunderbird.net.
[Publishing notes](thunderbird-osm-address/docs/PUBLISHING.md).
Own code: [MIT](thunderbird-osm-address/LICENSE). OSM data: ODbL.
