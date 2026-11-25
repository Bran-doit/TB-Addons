# Ergänzung für Version 0.4.1

Am 25.11.2026: 17 Node-Modultests bestanden. UTF-8, 83 vollständige Sprachschlüssel
in Deutsch und Englisch sowie lokale Skripte geprüft. In Thunderbird 161.0 wurden
beide Sprachen mit dem Paket 0.4.1 im separaten Testprofil ausgeführt: Kurzbeschreibung
im lokalisierten Manifest, ausführliche Texte, Projektlinks und Einstellungsseite.
Der deutsche Lauf prüfte außerdem reale OSM-Kacheln und Anbieterkennung.
Die Einstellungen öffnen weiterhin einen eigenen Tab. Eine versuchsweise eingebettete
Darstellung wurde wegen fehlender Extension-API im Testprofil nicht übernommen.
Die folgenden Integrationsergebnisse stammen aus 0.4.0; die Kalenderlogik wurde
für 0.4.1 nicht verändert. Tests verwenden extensions.webextensions.remote=false;
normale Desktop-Abnahme und Prozesstrennung sind weiterhin offen.

---

# Teststand 0.4.0 — 25. November 2026

- Thunderbird 161.0, Build 20261120171716: 19 Integrationstests bestanden.
- Thunderbird 128.6.1: dieselben 19 Integrationstests bestanden.
- 17 Node-Modultests bestanden.
- Thunderbird 161.0: deutsche und englische Sprachtests bestanden, einschließlich
  Einstellungen, Fehlermeldungen und Umlauten. Deutsche Kartenprüfung bestanden.
- Reproduzierbarer Build, UTF-8-/Lokalisierungsprüfung und ZIP-Integrität bestanden.
- Berichte: runtime-results-161.0.json, runtime-results-128.6.1.json,
  localization-161.0-de.json und localization-161.0-en-US.json.
- Tests: separate Profile, headless, Erweiterungs-Prozesstrennung im Test deaktiviert.
  Die neu erforderliche Systemfreigabe MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1 ist
  ausschließlich in der Umgebung des gestarteten Testprozesses gesetzt.
- Nicht ausgeführt: 129–160 einschließlich aktueller ESR, normale Desktop-Abnahme,
  CalDAV/Einladungen/Serienausnahmen und ATN-Validator/Review.

## Vorherige Protokolle (historisch)

# Aktueller Teststand 0.3.0

- 17 Node-Modultests bestanden, einschließlich Sprachkatalog-Abdeckung,
  Platzhalter und exakter Unicode-Zeichen.
- 19 Kalender-Integrationstests unter Thunderbird 128.6.1 bestanden. Zusätzlich
  zu den bisherigen Fällen: Öffnen mit vorhandenem Ort sendet keine Suche.
- Echte Thunderbird-Sprachtests für de und en-US bestanden: Kalenderbutton,
  Suchdialog, Übernahmebutton, Fehlermeldung mit Umlauten, Einstellungen und
  übersetzte Ländernamen. Ergebnisse in localization-de.json und
  localization-en-US.json.
- Deutsche Kartenprüfung: lokale Rasterkacheln mit 256px geladen, kein iframe,
  sichtbare Attribution und identifizierender User-Agent auf den tatsächlichen
  HTTPS-Anfragen nachgewiesen. Zoom-Bedienung noch nicht separat automatisiert.
- Buildprüfung: gültiges UTF-8, beide vollständigen Kataloge, keine externen
  Skripte/Frames, XPI-Archivintegrität.
- Weiter offen: normale Desktop-/Screenreader-Abnahme, Prozesstrennung,
  aktuelle unterstützte Thunderbird-Version und ATN-Validator/Review.

Die folgenden Abschnitte dokumentieren den früheren Testumfang 0.2.0.
Bei abweichenden Zahlen und Aussagen zur Karte gilt der aktuelle Stand oben.

# Testprotokoll – 7. November 2026

## Automatisierte Modultests: 15 bestanden

Ausgeführt mit aktuellem Node.js und `node --test tests/*.test.js`.
Die Fixtures sind synthetisch und werden ausschließlich in Tests verwendet.

- Geografische Bevorzugung ohne Länderfilter, URL-Encoding, Sprache und Limit.
- HTTPS- und Einstellungsvalidierung.
- Deutsche/ausländische Adressformatierung, optionale Länderanzeige.
- Fehlende Hausnummern, unvollständige Treffer, ungültige Koordinaten.
- Erhalt der Serverreihenfolge, Cache, übertragene Parameter.
- Leere Suche und leere Trefferliste.
- HTTP 429 und Retry-After ohne automatische Wiederholung.
- HTTP 503, Netzwerkfehler, ungültiges JSON und falsches Antwortschema.
- Timeout, Abbruch und Serialisierung mehrerer Suchdialoge.

## Thunderbird-Laufzeittests: 18 bestanden

Echte Thunderbird-Installation 128.6.1, Build 20250124112543, Windows.
Separates Profil unter `test-output/thunderbird-128-profile`, keine Verwendung
oder Änderung des vorhandenen Benutzerprofils. Start headless über Marionette.
Nur im Testprofil: `extensions.webextensions.remote=false`, damit der Testtreiber
die HTML-Oberfläche direkt auslesen und bedienen kann. Kein entsprechender
Eingriff durch das Add-on, keine erforderliche Benutzereinstellung.
Installation über Thunderbirds Addon:Install-Testbefehl aus der echten XPI.
Die manuelle Installation über das Zahnradmenü wurde nicht durchgeklickt.

Maschinenlesbare Ergebnisse: [runtime-results.json](runtime-results.json).

| Prüffall | Ergebnis |
|---|---|
| Bereits vor Installation geöffneter Termin | Button eingefügt |
| Neuer Termin nach Installation | Button eingefügt |
| Button unmittelbar rechts neben Ort | DOM und tatsächliche Rechteckposition geprüft |
| Termin ohne Ort | Lokaler Titelvorschlag, keine automatische Suche, Übernehmen deaktiviert |
| Dialog abbrechen | Ursprünglicher Ortswert erhalten |
| Vorhandene Adresse | Suchfeld korrekt vorbelegt |
| Echte Photon-Abfrage | 6 Treffer für „Unter den Linden 6 Berlin“ |
| Keine ungefragte Auswahl | Übernehmen zunächst deaktiviert |
| Zwei gleichzeitig geöffnete Termine | Nur zugeordneter Ort geändert |
| Änderungserkennung | isItemChanged wahr, Termin noch nicht gespeichert |
| Speichern und erneut bearbeiten | „Unter den Linden 6, 10117 Berlin“ erhalten |
| Zwischenzeitliche manuelle Änderung | Übernahme mit verständlicher Meldung abgewiesen |
| Terminbearbeitung im Tab | Button eingefügt |
| Schreibgeschütztes Ortsfeld | Button deaktiviert |
| Add-on deinstallieren | Alle eingefügten Buttons entfernt |

Reproduktion: zuerst `python build.py`, dann
`python tests/thunderbird_probe.py --exe "C:\Pfad\zu\Thunderbird128\thunderbird.exe"`.
Der Laufzeittest sendet ausschließlich seine öffentliche Testadresse an Photon.
Die Wiederholung benötigt einen verfügbaren Photon-Dienst und darf nicht in
kurzen Schleifen gegen den öffentlichen Server betrieben werden.

## Noch nicht durchgeführt

- Manuelle Desktop-Abnahme in normalem Betriebsmodus, mit Prozesstrennung,
  verschiedenen Bildschirmauflösungen, Windows-Skalierungen und Themes.
- Kartendarstellung, Markerwechsel und Zoom am echten OSM-Kartendienst.
- Einstellungsseite vollständig per Benutzeroberfläche durchtesten, Neustart
  mit dauerhaft installiertem Add-on und wiederhergestellten Termin-Tabs.
- CalDAV-, Einladungs- und Serienausnahmen, gleichzeitige externe Kalenderänderung.
- Andere 128-Unterversionen und neuere Thunderbird-Hauptversionen.
- Tastatur-/Screenreader-Abnahme und tatsächliche Offline-/429-Szenarien in
  Thunderbird; entsprechende Dienstfehler wurden auf Modulebene simuliert.

## Manuelle Abnahme

1. XPI installieren; neue und vorhandene Termine in Fenster und Tab öffnen.
2. Ohne Ort öffnen, Suche per Eingabetaste starten, Treffer mit Tab/Pfeiltasten
   auswählen. Auf sichtbaren Fokus und brauchbare Breite achten.
3. Mit vorhandener Adresse öffnen, Treffer wechseln, übernehmen, speichern und
   wieder öffnen. Abbrechen/Escape/Fenster-X dürfen keinen Ort verändern.
4. Zwei Termine parallel öffnen und jeweils eine Suche starten. Nur der explizit
   gewählte Termin darf geändert werden. Einen Termin während der Suche schließen.
5. Einstellungen ändern, speichern und neu öffnen; Karte aktivieren, Treffer
   wechseln und zoomen. Bei Kartenfehler muss Übernehmen weiterhin funktionieren.
6. Mit getrennter Internetverbindung suchen: verständliche Meldung, Ort unverändert.
7. Add-on deaktivieren und wieder aktivieren: keine doppelten Buttons, normales
   Speichern funktioniert weiterhin.

## Zusätzliche Prüfung 0.2.0

Drei weitere Modultests prüfen Titelbereinigung, GS-Auflösung, begrenzte
Suchvarianten und das Beibehalten von Straßenadressen.
Drei zusätzliche Laufzeittests verwenden den Beispiel-Schultitel aus der Anfrage:
Vorschlag bleibt bis zum Klick lokal; echte Photon-Suche findet die Schule und
zeigt den angepassten Suchbegriff; Rudolf-Breitscheid-Straße 21, 14482 Potsdam
wird übernommen, ohne den Titel zu ändern. Insgesamt 18 Laufzeittests bestanden.
