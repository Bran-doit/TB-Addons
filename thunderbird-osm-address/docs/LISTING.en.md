# OSM Address Lookup

Find addresses and places while editing calendar events. Find address, next to
Location, opens a Photon/OpenStreetMap search. Select a result and use its address
in the event without saving the event automatically. German and English UI.

If Location is empty, review an editable suggestion from the title. German
abbreviations such as GS are expanded; long place names with no results may be
retried with up to two shorter queries, shown in the dialog. Results are not
official address verification. Check the correct branch when several places match.

Privacy: Only Search and send transmits the visible search text, possible shorter
variants, result language and search area to the configured Photon provider
(photon.komoot.io by default), which also sees your IP address. The optional map,
off by default, sends your IP address and map area to the OpenStreetMap Foundation.
No telemetry, advertising or accounts. You may configure your own Photon instance.

Direct calendar integration requires an Experiment API and Thunderbird's full
access permission. Source code is MIT licensed. Free public search and map
services do not guarantee availability.
