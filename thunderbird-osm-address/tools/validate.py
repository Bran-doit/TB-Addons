"""Local packaging checks; not a replacement for the ATN validator or review."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

def validate():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    catalogs = {p.parent.name: json.loads(p.read_text(encoding="utf-8")) for p in (ROOT / "_locales").glob("*/messages.json")}
    assert manifest["default_locale"] in catalogs
    expected = set(catalogs[manifest["default_locale"]])
    referenced = set()
    for lang, catalog in catalogs.items():
        assert set(catalog) == expected, f"Incomplete locale: {lang}"
    for folder in ["background", "dialog", "options", "services", "experiment", "privacy", "_locales"]:
        for path in (ROOT / folder).rglob("*"):
            if not path.is_file(): continue
            text = path.read_bytes().decode("utf-8", errors="strict")
            assert not text.startswith("\ufeff"), f"Unexpected BOM: {path}"
            assert not re.search("Ã|Â|�", text), f"Broken encoding: {path}"
            referenced.update(re.findall(r'\bt\("([A-Za-z0-9_]+)"', text))
            referenced.update(re.findall(r'data-i18n(?:-title|-label)?="([A-Za-z0-9_]+)"', text))
            if path.suffix == ".html":
                assert '<meta charset="utf-8">' in text, path
                assert not re.search(r'<script[^>]+src="https?://|<iframe', text), path
    assert referenced <= expected, f"Missing messages: {referenced - expected}"
    assert set(re.findall(r'__MSG_(\w+)__', json.dumps(manifest))) <= expected
    print(f"UTF-8, {len(catalogs)} locales, {len(expected)} messages and local script policy: OK")

if __name__ == "__main__": validate()
