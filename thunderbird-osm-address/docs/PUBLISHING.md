# Veröffentlichung 0.4.1

Stand: 25. November 2026. Ziel: https://github.com/Bran-doit/TB-Addons

## GitHub-Paket

- Quellcode unter `thunderbird-osm-address/`, aktuelle XPI und Prüfsummen unter
  `downloads/`; keine alten Builds, Profile, Zugangsdaten oder Thunderbird-Binärdateien.
- Deutsche und englische README, Beschreibungen, Datenschutztexte und MIT-Lizenz.
- Reproduzierbarer Build: Python 3, `python build.py`; keine Fremdbibliotheken.
- GitHub Issues dient als Supportkanal; Projektseite im Manifest hinterlegt.
- Eigener Quellcode und kleine XPI liegen deutlich unter GitHubs Dateigrößenlimits.

## Thunderbird und ATN

Die Kurzbeschreibung ist über das Manifest lokalisiert. Eine ausführliche
Beschreibung erscheint in der über die Add-on-Verwaltung erreichbaren Einstellungsseite.
Die Texte für eine spätere ATN-Einreichung stehen in LISTING.de.md und LISTING.en.md.

UTF-8, vollständige Sprachdateien, lokale Skripte, explizites Absenden der Suche,
standardmäßig ausgeschaltete Karte und Datenschutzhinweise sind implementiert.
Die Experiment-API erfordert umfassende Berechtigungen und manuelle ATN-Prüfung.
HTTPS-Hostrechte werden für frei wählbare Photon-Instanzen benötigt.

GitHub-Veröffentlichung bedeutet keine ATN-Freigabe. Vor ATN-Einreichung verbleiben:
Desktop-Abnahme inklusive Barrierefreiheit und normaler Prozesstrennung,
ATN-Validator und manuelles Review sowie Kontaktdaten im Herausgeberkonto.
Datenschutztext vollständig in das ATN-Datenschutzfeld übernehmen.
Nicht separat getestete Thunderbird-Versionen werden nicht als getestet beworben.

## Primärquellen

- [Thunderbird Review Policy](https://thunderbird.github.io/atn-review-policy/)
- [Experiments](https://developer.thunderbird.net/add-ons/mailextensions/experiments)
- [Manifest description](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/description)
- [GitHub-Dateigrößen](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [OSM-Kachelrichtlinie](https://operations.osmfoundation.org/policies/tiles/)
- [Photon Demo Server](https://github.com/komoot/photon#demo-server)
