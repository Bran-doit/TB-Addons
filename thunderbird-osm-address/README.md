# OSM Address Lookup 0.4.1

[English](README.en.md) | Deutsch

**Vom Einrichtungsnamen zur Adresse im Kalendertermin.** OSM Address Lookup findet
Schulen, Firmen und andere Orte mit Photon auf Basis von OpenStreetMap und trägt
die ausgewählte Adresse in das Ortsfeld ein. Ein Suchbegriff wie
„GS Potsdam Babelsberg Kopf Herz Hand“ reicht als Ausgangspunkt; du prüfst die
Treffer und entscheidest, welche Adresse übernommen wird.

Die Suche sitzt direkt neben dem Ortsfeld. Ist es leer, lässt sich der Termintitel
oder ein markierter Teil daraus als bearbeitbarer Suchvorschlag verwenden.
Der Titel bleibt erhalten; der Termin wird erst durch dich gespeichert.
Deutsch und Englisch über Thunderbirds i18n-System; Englisch ist der Fallback
für andere Oberflächensprachen. Die Sprache der Photon-Ergebnisse wird separat
in den Einstellungen gewählt (Standard: Deutsch).

## Installation / Update

In Thunderbird 128 bis 161: Add-ons und Themes → Zahnrad → Add-on aus Datei installieren.
[osm-address-lookup-0.4.1.xpi herunterladen](../downloads/osm-address-lookup-0.4.1.xpi?raw=true)
und auswählen (auf GitHub gegebenenfalls „Download raw file“). Die unveränderte Add-on-ID sorgt
für ein Update statt einer zweiten Installation. Wegen der Experiment-API zeigt
Thunderbird eine umfassende Zugriffsberechtigung an. Das Add-on ändert keine
Thunderbird-Installationsdateien und speichert Termine nicht selbst.

Alte Termin- und Suchfenster nach dem Update schließen und neu öffnen. Der Button
heißt jetzt „Adresse suchen“. Im Suchdialog und in den Einstellungen steht die
Versionsnummer. Die falsch kodierte alte Buttonbeschriftung stammt aus einem fehlerhaften älteren Paket;
die neue Laufzeit enthält ausschließlich geprüfte UTF-8-Texte aus Sprachdateien.

## Verwendung

1. „Adresse suchen“ anklicken. Bei leerem Ort wird die markierte Titelpassage,
   sonst der Titel, als lokal bearbeitbarer Vorschlag eingesetzt.
2. Text und angezeigten Anbieter prüfen. Erst „Suchen und senden“ oder Eingabe
   sendet eine Anfrage. Auch ein vorhandener Ort wird nicht mehr automatisch gesendet.
3. Passende Einrichtung und Adresse auswählen, dann „Übernehmen“. Der Titel
   bleibt unverändert; den Termin anschließend wie gewohnt speichern.

„GS“ und „ev. GS“ werden in Namenssuchen aufgelöst, Zeitspannen und ein führendes
„TdA“ aus Titelvorschlägen entfernt. Lange Einrichtungsnamen ohne Treffer werden
mit maximal zwei kürzeren Varianten versucht; der verwendete Begriff wird
angezeigt. Straßenadressen mit Zahlen werden nicht verkürzt. Keine Treffer oder
Adressbestandteile werden erfunden. Mehrere Standorte erfordern eigene Auswahl.

Abbrechen, Escape und Schließen übernehmen nichts. Bereits gesendete Anfragen
lassen sich nicht zurückholen. Parallele Termine haben getrennte Sitzungen;
zwischenzeitlich geänderte, geschlossene oder schreibgeschützte Orte werden nicht
überschrieben. Die Änderungserkennung und Speicherung übernimmt Thunderbird.

## Einstellungen und Datenübertragung

Photon-HTTPS-Endpunkt, Ergebnissprache, bevorzugtes Land, 1–20 Treffer und
Länderanzeige sind einstellbar. Die Länderbevorzugung nutzt einen ungefähren
Mittelpunkt, keinen harten Filter. Standard ist https://photon.komoot.io/api/.
Nur Photon-kompatible HTTPS-Endpunkte ohne Zugangsdaten/Query/Redirect verwenden.

Die optionale Karte ist standardmäßig aus. Sie besteht vollständig aus lokalem
JavaScript und lädt ausschließlich sichtbare OSM-Rasterkacheln. Marker, Zoom,
Attribution und verständliche Kartenfehler sind enthalten. Sie benötigt keine
externen Skripte und blockiert die Adressübernahme nicht. Normale HTTP-Caches
werden berücksichtigt; keine Offline-Downloads oder Vorab-Kachelabrufe.

Keine Telemetrie, Werbung oder Konten. Einstellungen bleiben lokal; bis zu
50 Suchen werden im Arbeitsspeicher zwischengespeichert und höchstens fünf Minuten
wiederverwendet. Der Suchdienst erhält Suchtext, Suchparameter und IP-Adresse.
Der Kartenanbieter erhält Kartenausschnitt, IP-Adresse und Add-on-Kennung/Version.
Keine Cookies oder Anmeldedaten in diesen Anfragen. Vollständige Erklärungen im
Add-on unter Datenschutz sowie in [Deutsch](docs/PRIVACY.de.md) und
[Englisch](docs/PRIVACY.en.md).

Der öffentliche Photon-Dienst garantiert keine Verfügbarkeit oder feste Quote.
Anfragen werden serialisiert, mit mindestens 1,1 Sekunden Abstand und 15 Sekunden
Timeout. HTTP 429 pausiert mindestens 60 Sekunden, gegebenenfalls länger gemäß
Retry-After. Für umfangreiche Nutzung eine eigene Instanz einsetzen.

## Kompatibilität und Veröffentlichung

Getestet unter Thunderbird **161.0** (aktuelle reguläre Version am 25.11.2026)
und **128.6.1**. Das Manifest erlaubt 128.0 bis 161.*. Die übrigen Versionen in
diesem Bereich, einschließlich ESR 153.8.0, wurden nicht separat ausgeführt.

Jeweils 19 Kalender-Integrationstests unter 161.0 und 128.6.1 sowie 17 Modultests
bestanden. Unter 161.0 zusätzlich deutsche/englische Sprachtests und Kartenbilder
mit überprüfter Anbieterkennung. Alle Läufe headless in getrennten Testprofilen
mit extensions.webextensions.remote=false; normale Desktop-Abnahme und
Prozesstrennung sind weiterhin separat zu prüfen.

Änderung gegenüber 0.3.0: Neue Editor-Frames werden zusätzlich kurzzeitig auf
Bereitschaft geprüft, weil Thunderbird 161 das Frame-Fenster erst nach dem äußeren
Ladeereignis bereitstellen kann. Der Timer endet nach erfolgreicher Initialisierung,
spätestens nach 30 Sekunden sowie beim Entfernen des Frames oder Deaktivieren.
Die bisherige Installation und Benutzerprofile werden vom Add-on nicht verändert.

[Kompatibilitätsprüfung 0.4.0](docs/COMPATIBILITY-0.4.0.md),
[Testprotokoll](docs/TESTS.md), [Veröffentlichungscheckliste](docs/PUBLISHING.md).
GitHub-Veröffentlichung mit Quellcode und XPI; keine ATN-Freigabe. Desktop-Abnahme
und ATN-Validator/Review stehen weiterhin aus. Fragen und Fehler:
[GitHub Issues](https://github.com/Bran-doit/TB-Addons/issues).

Version 0.4.1 ergänzt zweisprachige Beschreibungen, eine Projektverknüpfung und
die ausführliche Einstellungsseite: Add-ons-Verwaltung → OSM Address Lookup →
Einstellungen (öffnet einen eigenen Tab). Dort stehen Funktionsweise und Datenschutzhinweise ausführlich;
die Kurzbeschreibung erscheint in den Add-on-Details.

## Entwicklung

`python build.py` prüft UTF-8, Sprachschlüssel und lokale Skripte, erstellt dann
reproduzierbar XPI, vollständiges Quellcode-ZIP und SHA256SUMS.txt. Python 3,
keine Build-Abhängigkeiten und keine Minifizierung. Mit Node >=20:
`node --test tests/*.test.js`.

Neue Sprache: `_locales/<Sprache>/messages.json` mit allen Schlüsseln ergänzen,
Platzhalter erhalten, den Build und einen Thunderbird-Sprachtest ausführen.
Reguläre APIs: i18n, storage.local, windows und runtime. Das kleine Experiment
verwendet ExtensionSupport/ExtensionCommon und den Editor-DOM; siehe
[technische Prüfung](docs/TECHNIK.md). HTTPS-Hostrechte sind für eigene Instanzen
nötig. Keine E-Mail-, Kontakt- oder Kontenberechtigungen.

Eigener Code: MIT (LICENSE). OSM-Daten: ODbL. Keine externen Programmbibliotheken.
Primärquellen und Veröffentlichungsanforderungen stehen in docs/PUBLISHING.md.
