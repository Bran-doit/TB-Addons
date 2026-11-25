# Technische Prüfung vor Implementierung

Stand: 7. November 2026. Ziel: Thunderbird 128 ESR, Manifest V2.

## Ergebnis

Die Schaltfläche neben dem Ortsfeld ist mit einer kleinen Experiment-API möglich.
Reguläre MailExtension-APIs stellen keinen Einfügepunkt im Kalenderformular bereit.
Insbesondere sind Menüs und Toolbar-Actions kein Ersatz für diesen Einfügepunkt.
Die zuerst gefundene lokale Installation meldete 60.9.1. Nach Abschluss der
Vorprüfung wurde eine zweite Installation mit 128.6.1 gefunden und für die
Laufzeittests verwendet, siehe TESTS.md. Quellcodeprüfung ist kein Laufzeittest.

## Geprüfter Thunderbird-128-Quellcode

Basis: https://hg.mozilla.org/releases/comm-esr128/file/tip/
Die Prüfdateien wurden aus diesem offiziellen Repository gelesen; sie sind
nicht Teil des ausgelieferten Add-ons. Zeilenangaben beziehen sich auf diesen Abruf.

- `calendar/base/content/dialogs/calendar-event-dialog.xhtml`, Zeile 569:
  Der äußere Dialog enthält einen dynamisch eingesetzten Frame.
- `calendar/base/content/item-editing/calendar-item-panel.js`, Funktion
  `onLoadCalendarItemPanel`: berücksichtigt Fenster und Termin-Tabs.
- `calendar/base/jar.mn`, Zeilen 80–82: tatsächliche Chrome-URLs sind
  `chrome://calendar/content/calendar-item-iframe.xhtml` und die zugehörigen JS-Dateien.
- `calendar/base/content/item-editing/calendar-item-iframe.xhtml`, Zeilen 250–268:
  HTML-Eingabefeld `item-location` in einer Tabellenzelle, `disable-on-readonly`.
  Ein zusätzlicher HTML-Button in derselben Zelle kann direkt rechts daneben stehen.
- `calendar-item-iframe.js`: `loadDialog` liest LOCATION (594), `saveDialog`
  schreibt den aktuellen Feldwert in LOCATION (1520). `isItemChanged` (3986)
  vergleicht einen aus den Formularwerten erstellten Termin mit dem Original.
  Kein erfundener Kalender-API-Aufruf und kein automatisches Speichern nötig.
- `mail/modules/ExtensionSupport.sys.mjs`: `registerWindowListener` meldet auch
  bereits offene Fenster. Das Experiment ergänzt Frame-Ladeereignisse und eine
  Suche in bereits geladenen Frames. Aufräumen beim Entladen/Deaktivieren erforderlich.
  Im Laufzeittest bestätigt: XUL-Frame-Ladeereignisse direkt am `contentWindow`
  beobachten, da die Ereignisse nicht zuverlässig am äußeren Fenster ankommen.

## Architekturentscheidung

Das Experiment setzt ausschließlich den Button ein, liest das Ortsfeld und schreibt
nach ausdrücklicher Übernahme zurück. Eine Sitzung referenziert genau einen Editor,
nicht das jeweils aktive Fenster. Ein inzwischen veränderter Ortswert wird nicht
überschrieben. Geschlossene oder schreibgeschützte Editoren werden abgewiesen.
Die WebExtension übernimmt Dialog, Einstellungen und HTTPS-Anfragen.

Experiment-Dokumentation:
https://developer.thunderbird.net/add-ons/mailextensions/experiments

Experimente haben technisch uneingeschränkte Rechte. Thunderbird zeigt deshalb
eine umfassende Berechtigungswarnung. Die Implementierung liest keine E-Mails. Seit 0.2.0 liest sie zusätzlich
den Titel bzw. seine markierte Passage lokal als Suchvorschlag; dessen Übertragung
erfolgt erst nach Klick auf Suchen. Optionale Host-Berechtigungen sind bei Experimenten nicht
vorgesehen; HTTPS-Hosts sind für konfigurierbare Photon-Instanzen deklariert.

Die erste Version ist absichtlich auf 128.* begrenzt. Neuere Versionen erfordern
eine erneute Prüfung von DOM-Struktur, Chrome-URLs, ExtensionSupport und Speicherung
sowie echte Integrationstests, bevor strict_max_version angehoben wird.

## Photon und Karte

API: https://github.com/komoot/photon/blob/master/docs/api-v1.md
Nutzung: https://github.com/komoot/photon#demo-server

`/api/` mit `q`, `lang`, `limit`, `lat`, `lon`, `zoom` und
`location_bias_scale`. Der Mittelpunkt ist eine weiche geografische Präferenz,
keine exakte Ländergewichtung. `countrycode` und `bbox` sind harte Filter und
werden nicht gesetzt. Die Relevanzreihenfolge des Dienstes bleibt erhalten.
GeoJSON-Koordinaten haben die Reihenfolge Längengrad, Breitengrad.
Die öffentliche Instanz garantiert weder Verfügbarkeit noch eine feste Quote.
Eigene konservative Drosselung, temporärer Cache und 429-Pause ersetzen keine
Nutzungserlaubnis für Massenabfragen. Keine Suche bei jedem Tastendruck.

Die optionale Karte verwendet die offizielle OpenStreetMap-Einbettung statt einer
zusätzlichen Leaflet-Kopie. Dadurch bleiben Zoom, Marker und Attribution beim
Kartenanbieter. Sie ist standardmäßig aus und vom Suchablauf unabhängig. Bei
Aktivierung lädt der Browser Drittinhalte und übermittelt Kartenausschnitt/IP.
Die Karte erhält nur die Koordinaten des ausgewählten Treffers.

## Ergänzung 0.2.0

Namenssuche mit lokalem Titelvorschlag, Abkürzungsauflösung und höchstens zwei
verkürzten Folgeabfragen bei ausbleibenden Treffern. Straßenadressen mit Zahlen
werden nicht verkürzt. Einrichtungsnamen stehen in der Trefferliste vor der Adresse.
Privilegiertes JavaScript verwendet ASCII-Unicode-Escapes für deutsche Meldungen.

## Ergänzung 0.3.0 (ersetzt frühere Karten- und Autostartentscheidung)

Sprachdateien de/en, default_locale=en und reguläre i18n-Aufrufe. Das Experiment
verwendet context.extension.localizeMessage, wie in ext-i18n.js von Thunderbird
128 überprüft. Die vormalige eingebettete Karte wurde vollständig entfernt.
Eigener lokaler Renderer lädt ausschließlich sichtbare Rasterkacheln über HTTPS,
mit Cookies ausgeschlossen, normalem Cache und überprüftem User-Agent.
Jede Suche benötigt nun einen Klick auf „Suchen und senden“; bloßes Öffnen eines
Dialogs überträgt weder vorhandene Ortswerte noch Titelvorschläge. Die begründeten
Veröffentlichungsentscheidungen und verbleibenden Anforderungen stehen in
PUBLISHING.md. Die Kompatibilitätsgrenze wurde nicht ungeprüft angehoben.

## Ergänzung 0.4.0 — Thunderbird 161.0

Das offizielle Windows-x64-Paket 161.0 wurde separat entpackt und dessen omni.ja
geprüft. item-location, LOCATION-Verarbeitung, isItemChanged, ExtensionSupport
und extension.localizeMessage sind weiterhin vorhanden. In 161.0 kann das neue
Frame-Fenster beim Einfügen noch fehlen oder ausgetauscht werden. Neben den
Ladeereignissen prüft die Integration daher gezielt nur neue Kalender-Frames alle
50 ms auf Bereitschaft (maximal 600 Versuche). Timer und Listener werden bei
Entfernung/Deaktivierung gelöscht; nach Initialisierung gibt es kein Polling.
Laufzeittests haben das ursprüngliche Problem reproduziert und die Korrektur
unter 161.0 sowie ihre Rückwärtskompatibilität zu 128.6.1 bestätigt.
