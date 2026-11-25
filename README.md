# Thunderbird Add-ons

Deutsch | [English](README.en.md)

## OSM Address Lookup

**Vom Namen zur Adresse im Kalendertermin:** Finde Schulen, Firmen und andere
Einrichtungen mit Photon und OpenStreetMap. Wähle den passenden Treffer und
übernimm seine Adresse direkt in das Ortsfeld deines Thunderbird-Termins.

Bei leerem Ort dient der Termintitel oder ein markierter Teil als bearbeitbarer
Suchvorschlag. Die Suche startet erst nach deinem Klick auf „Suchen und senden“.
Eine optionale Karte hilft bei der Auswahl. Deutsch und Englisch sind integriert.

- **[Version 0.4.1 herunterladen](downloads/osm-address-lookup-0.4.1.xpi?raw=true)**
- [Anleitung und Funktionsbeschreibung](thunderbird-osm-address/README.md)
- [English documentation](thunderbird-osm-address/README.en.md)
- [Datenschutz](thunderbird-osm-address/docs/PRIVACY.de.md)
- [Quellcode](thunderbird-osm-address) · [Prüfsummen](downloads/SHA256SUMS.txt)
- [Fehler melden / Support](https://github.com/Bran-doit/TB-Addons/issues)

### Installation

XPI herunterladen (auf der Dateiseite gegebenenfalls „Download raw file“).
In Thunderbird: **Add-ons und Themes → Zahnrad → Add-on aus Datei installieren**.
Eine bestehende Installation wird aktualisiert. Alte Terminfenster danach neu öffnen.

Die Kurzbeschreibung steht in der Add-on-Verwaltung; die ausführliche Erklärung
erreichst du dort über die Einstellungen, die einen eigenen Tab öffnen.

### Kompatibilität und Transparenz

Manifest: Thunderbird 128.0 bis 161.*. Kalenderintegration mit Version 0.4.0 unter
128.6.1 und 161.0 geprüft; übrige Versionen nicht separat getestet. Für 0.4.1:
17 Modultests sowie deutsche und englische Beschreibung/Bedienoberfläche unter
161.0 geprüft. [Testumfang und Grenzen](thunderbird-osm-address/docs/TESTS.md).

Direkte Kalenderintegration benötigt eine Experiment-API und deshalb umfassende
Thunderbird-Berechtigungen. Suchtext und IP-Adresse gehen nach Absenden an den
gewählten Photon-Anbieter. Die optionale Karte ist standardmäßig ausgeschaltet.
Keine Telemetrie, Werbung oder Konten.

GitHub-Veröffentlichung, keine Freigabe durch addons.thunderbird.net.
[Veröffentlichungshinweise](thunderbird-osm-address/docs/PUBLISHING.md).
Quellcode unter [MIT-Lizenz](thunderbird-osm-address/LICENSE); OSM-Daten unter ODbL.
