"""Copy-only reproducible XPI and source ZIP build; Python 3, no dependencies."""
from pathlib import Path
import hashlib
import json
import zipfile
from tools.validate import validate

validate()

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "build"
OUT.mkdir(exist_ok=True)
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]
runtime_dirs = {"background", "dialog", "experiment", "icons", "options", "services", "_locales", "privacy"}
runtime_files = {"manifest.json", "ui.css", "LICENSE", "README.md", "README.en.md"}

def archive(path, files):
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for source in sorted(files):
            relative = source.relative_to(ROOT).as_posix()
            info = zipfile.ZipInfo(relative, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            bundle.writestr(info, source.read_bytes())
    with zipfile.ZipFile(path) as bundle:
        assert bundle.testzip() is None
        assert "manifest.json" in bundle.namelist()
    print(f"{path.name}: {path.stat().st_size} bytes")
    return hashlib.sha256(path.read_bytes()).hexdigest()

files = [p for p in ROOT.rglob("*") if p.is_file() and
         not any(part in {"build", "node_modules", "__pycache__", ".git"} for part in p.relative_to(ROOT).parts)]
xpi_files = [p for p in files if p.relative_to(ROOT).parts[0] in runtime_dirs or p.name in runtime_files]
hashes = []
for name, selected in [(f"osm-address-lookup-{version}.xpi", xpi_files),
                       (f"osm-address-lookup-{version}-source.zip", files)]:
    digest = archive(OUT / name, selected)
    hashes.append(f"{digest}  {name}")
(OUT / "SHA256SUMS.txt").write_text("\n".join(hashes) + "\n", encoding="utf-8")
