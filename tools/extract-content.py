"""Extrae el contenido del Excel del CEIS a los JSON de packages/core/content/.

Uso (una sola vez; después los JSON se editan a mano):
    uv run --with openpyxl python -I tools/extract-content.py "<ruta al .xlsx>"

Genera test.json, profiles.json y sources.json. programs.json se mantiene a mano.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

OUT = Path(__file__).resolve().parent.parent / "packages" / "core" / "content"

# (hoja, id, nombre mostrado); el orden es el de la posición del ítem (x.1 … x.5).
PROFILES = [
    ("PERFIL REALISTA - GERENCIAL", "realista-gerencial", "Realista - Gerencial"),
    ("PERFIL REALIZADOR - COMERCIANTE", "realizador-comerciante", "Realizador - Comerciante"),
    ("PERFIL ARTISTICO - IMAGINATIVO", "artistico-imaginativo", "Artístico - Imaginativo"),
    ("PERFIL MOVILIZADOR - SOCIAL", "movilizador-social", "Movilizador - Social"),
    ("PERFIL INVESTIGATIVO - CREADOR", "investigativo-creador", "Investigativo - Creador"),
]
NAME_TO_ID = {
    "realista - gerencial": "realista-gerencial",
    "realizador - comerciante": "realizador-comerciante",
    "artistico - imaginativo": "artistico-imaginativo",
    "movilizador - social": "movilizador-social",
    "movilizador  - social": "movilizador-social",
    "investigativo - creador": "investigativo-creador",
    "investigador - creador": "investigativo-creador",
}
# Única corrección sobre el Excel: tilde en la escala del bloque 1 (la spec lo exige así).
SCALE_FIX = {"No es muy cierto de mi": "No es muy cierto de mí", "Algo cierto de mi": "Algo cierto de mí",
             "Cierto de mi": "Cierto de mí", "Muy cierto de mi": "Muy cierto de mí"}


def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").strip())


def lines(s):
    return [clean(x) for x in (s or "").replace("\r", "").split("\n") if clean(x)]


def groups(text):
    out, cur = [], None
    for ln in lines(text):
        if ln.endswith(":"):
            cur = {"title": ln[:-1].strip(), "items": []}
            out.append(cur)
        elif cur is not None:
            cur["items"].append(ln)
    return out


def first_sentence(text):
    text = clean(text.replace("\n", " "))
    m = re.search(r"(.+?[.!?])(\s|$)", text)
    return m.group(1) if m else text


def extract_test(wb):
    ws = wb["PREGUNTAS EMPRENDEDOR"]
    blocks, cur = [], None
    for row in range(13, 67):
        b = ws.cell(row, 2).value
        if not b:
            continue
        b = clean(str(b))
        m_item = re.match(r"^(\d)\.(\d)\s+(.*)$", b)
        m_block = re.match(r"^(\d+)\.\s+(.*)$", b)
        if m_item:
            x, n, text = int(m_item[1]), int(m_item[2]), m_item[3]
            cur["items"].append({"id": f"{x}.{n}", "position": n, "text": text, "profileId": PROFILES[n - 1][1]})
        elif m_block:
            labels = []
            for col in (3, 4, 5, 6):
                raw = str(ws.cell(row, col).value or "")
                label = clean(raw.split("\n")[0])
                labels.append(SCALE_FIX.get(label, label))
            cur = {"number": int(m_block[1]), "prompt": m_block[2], "scaleLabels": labels, "items": []}
            blocks.append(cur)
    return {"intro": clean(ws["B9"].value), "blocks": blocks}


def extract_profile(wb, sheet, pid, name):
    ws = wb[sheet]
    advice = lines(ws["K11"].value)
    steps = [re.sub(r"^\d+\.\s*", "", x) for x in advice if re.match(r"^\d+\.\s", x)]
    intro = " ".join(x for x in advice if not re.match(r"^\d+\.\s", x))
    comp = [NAME_TO_ID[clean(x).lower()] for x in lines(ws["D11"].value)]
    desc = "\n\n".join(clean(p) for p in (ws["C7"].value or "").split("\n\n") if clean(p))
    return {
        "id": pid,
        "name": name,
        "centralDesire": clean(ws["J8"].value).capitalize(),
        "centralFear": clean(ws["K8"].value).capitalize(),
        "centralPriority": clean(ws["L8"].value).capitalize(),
        "description": desc,
        "shortDescription": first_sentence(ws["C7"].value),
        "strengths": clean(ws["D9"].value),
        "improvementAreas": clean(ws["K9"].value),
        "strongCompetencies": groups(ws["D10"].value),
        "competenciesToDevelop": groups(ws["K10"].value),
        "complementaryProfiles": comp,
        "practicalAdvice": {"intro": intro, "steps": steps},
    }


def extract_sources(wb):
    ws = wb.worksheets[-1]
    return {
        "authorship": clean(ws["B9"].value),
        "version": clean(ws["B11"].value),
        "references": [clean(ws.cell(r, 2).value) for r in (13, 14, 15, 16)],
    }


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "test.json": extract_test(wb),
        "profiles.json": [extract_profile(wb, *p) for p in PROFILES],
        "sources.json": extract_sources(wb),
    }
    for name, data in files.items():
        (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("escrito", OUT / name)


if __name__ == "__main__":
    main(sys.argv[1])
