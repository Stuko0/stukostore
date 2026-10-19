#!/usr/bin/env python3
"""Descarga fotos de producto desde Wikimedia Commons (licencias libres).

Guarda cada imagen en public/img/<slug>.jpg a 800 px de ancho, registra los
créditos en public/img/attribution.json y regenera public/img/ATTRIBUTION.md.
Con FORCE=1 vuelve a descargar todo (necesario cuando cambian las consultas).
"""
import json
import os
import pathlib
import re
import urllib.parse
import urllib.request

UA = "StukoStoreDemo/1.0 (https://store.stuko.dev; contacto@stuko.dev)"
API = "https://commons.wikimedia.org/w/api.php"

QUERIES = {
    "termo-40oz": "vacuum flask stainless steel bottle",
    "termo-32oz": "stainless steel water bottle",
    "taza-14oz": "enamel coffee mug",
    "termo-16oz": "insulated water bottle blue",
    "molino-cafe": "hand coffee grinder",
    "dripper-porcelana": "coffee dripper porcelain",
    "tetera-cisne": "gooseneck kettle",
    "v60-vidrio": "coffee filter cone brewer",
    "cafe-grano": "roasted coffee beans",
    "cafe-molido": "ground coffee",
    "prensa-francesa": "french press coffee",
    "chemex": "glass coffee pot",
    "mochila-outdoor": "hiking backpack",
    "botella-outdoor": "water bottle hiking",
    "linterna": "headlamp camping",
    "saco-dormir": "sleeping bag camping",
    "carpa": "camping tent",
    "cantimplora": "canteen water bottle",
}


def api(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def pick(query: str):
    data = api({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}", "gsrnamespace": "6", "gsrlimit": "8",
        "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": "800",
    })
    pages = (data.get("query") or {}).get("pages") or {}
    best = None
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        thumb = info.get("thumburl")
        if not thumb:
            continue
        meta = info.get("extmetadata") or {}
        license_name = (meta.get("LicenseShortName") or {}).get("value", "desconocida")
        if "fair use" in license_name.lower():
            continue
        score = 0
        if info.get("width", 0) >= 1000:
            score += 2
        if thumb.lower().endswith((".jpg", ".jpeg", ".png")):
            score += 1
        if p.get("index", 99) < 4:
            score += 1
        if best is None or score > best[0]:
            best = (score, thumb, p.get("title", ""), license_name,
                    (meta.get("Artist") or {}).get("value", "desconocido"),
                    info.get("descriptionurl", ""))
    return best


def write_markdown(records: dict) -> None:
    lines = [
        "# Créditos de imágenes",
        "",
        "Fotografías descargadas de Wikimedia Commons con licencia libre y usadas",
        "como imágenes de demostración del catálogo. El texto alternativo de cada",
        "producto describe la fotografía, no una marca.",
        "",
    ]
    for slug, r in sorted(records.items()):
        lines.append(f"- **{r['file']}** — {r['title']} — {r['artist']} — {r['license']} — {r['source']}")
    pathlib.Path("public/img/ATTRIBUTION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    out = pathlib.Path("public/img")
    out.mkdir(parents=True, exist_ok=True)
    sidecar = out / "attribution.json"
    records = json.loads(sidecar.read_text()) if sidecar.exists() else {}
    force = os.environ.get("FORCE") == "1"
    ok = 0

    for slug, query in QUERIES.items():
        dest = out / f"{slug}.jpg"
        if dest.exists() and not force and slug in records:
            continue
        try:
            best = pick(query)
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR busqueda {slug}: {exc}", flush=True)
            continue
        if not best:
            print(f"sin resultado: {slug}", flush=True)
            continue
        _, thumb, title, license_name, artist, page = best
        try:
            req = urllib.request.Request(thumb, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                dest.write_bytes(r.read())
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR descarga {slug}: {exc}", flush=True)
            continue
        ok += 1
        records[slug] = {
            "title": title,
            "artist": re.sub(r"<[^>]+>", "", artist),
            "license": license_name,
            "source": page,
            "file": f"{slug}.jpg",
        }
        print(f"ok {slug:<18} {dest.stat().st_size // 1024:>4} KB  {license_name}", flush=True)

    sidecar.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding="utf-8")
    write_markdown(records)
    print(f"\ndescargadas: {ok}/{len(QUERIES)}  |  registros: {len(records)}", flush=True)


if __name__ == "__main__":
    main()
