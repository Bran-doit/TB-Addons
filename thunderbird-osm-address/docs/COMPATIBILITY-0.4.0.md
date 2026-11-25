# Kompatibilität 0.4.0

Stand 25.11.2026. Aktuelle reguläre Version: 161.0, veröffentlicht 24.11.2026.
Aktuelle ESR: 153.8.0esr (nicht separat getestet).

Das offizielle deutsche Windows-x64-Paket wurde separat entpackt. Keine
Installation, kein Update und kein Zugriff auf vorhandene Benutzerprofile.
Version 161.0, Build 20261120171716,
SourceStamp f53f287971bad7e05aaa26bbefdda84c4aa6a16e.
SHA-256 des heruntergeladenen Pakets: `20c544500f688b75e8723f3eb600e3d13ca114986056dc74fe8663435b0bd593`.

Aus der tatsächlichen omni.ja geprüft:
- calendar-item-iframe.xhtml: item-location weiterhin HTML-Eingabefeld, Zeile 263.
- calendar-item-iframe.js: LOCATION laden Zeile 599, speichern Zeile 1522;
  isItemChanged weiterhin vorhanden (3959).
- ExtensionSupport.sys.mjs: registerWindowListener vorhanden.
- ExtensionUtils.sys.mjs: Fehlertyp weiterhin verfügbar.
- ext-i18n.js: extension.localizeMessage weiterhin verfügbar.

Der erste Lauf reproduzierte: Bereits offene Fenster funktionierten, neue
Editor-Frames erhielten noch keinen Button. Der begrenzte Bereitschaftscheck in
experiment/api.js behebt dies. Anschließend bestanden alle 19 Kalenderfälle
unter 161.0 und dieselben 19 unter 128.6.1.

Deutsch/Englisch, Einstellungen, Unicode-Fehlermeldungen und Kartenbild-Anfragen
wurden unter 161.0 zusätzlich geprüft. 17 Modultests bestanden. Die Tests laufen
headless mit extensions.webextensions.remote=false. Keine Behauptung einer
manuellen Desktop- oder ATN-Freigabe. 129–160 einschließlich aktueller ESR sind
im Manifestbereich, aber nicht einzeln getestet.

## Reproduktion

Mit Python 3 und einer separat verfügbaren Thunderbird-Version:

```
python build.py
python tests/thunderbird_probe.py --exe "C:\Pfad\thunderbird.exe" --profile-name thunderbird-161-profile
python tests/thunderbird_probe.py --exe "C:\Pfad\thunderbird.exe" --locale en-US --localization-only
python tests/thunderbird_probe.py --exe "C:\Pfad\thunderbird.exe" --locale de --localization-only
```

MOZ_REMOTE_ALLOW_SYSTEM_ACCESS wird ausschließlich im Testprozess gesetzt.
Für andere Hauptversionen einen getrennten --profile-name verwenden.
Keine echten Profile verwenden. Testprofile werden nicht mit ausgeliefert.

## Quellen

- https://product-details.mozilla.org/1.0/thunderbird_versions.json
- https://www.thunderbird.net/en-US/thunderbird/161.0/releasenotes/
- https://archive.mozilla.org/pub/thunderbird/releases/161.0/win64/de/Thunderbird%20Setup%20161.0.exe
