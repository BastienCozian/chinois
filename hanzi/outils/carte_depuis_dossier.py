"""Fabrique carte.js à partir de la carte du dossier « Villes et provinces ».
Lancé une fois à la main (le dossier est hors du dépôt public) :
  python -X utf8 outils/carte_depuis_dossier.py ../../reference/villes-et-provinces.html
Chaque province en couleur reçoit l'id du mot du paquet, trouvé par la ville qu'elle contient."""
import json, re, sys
from pathlib import Path

VILLES = {"喀什": "kashi", "哈尔滨": "haerbin", "西安": "xian", "成都": "chengdu", "重庆": "chongqing",
          "济南": "jinan", "青岛": "qingdao", "苏州": "suzhou", "杭州": "hangzhou", "厦门": "xiamen",
          "昆明": "kunming", "大理": "dali"}
PROVINCE = {"kashi": "xinjiang", "haerbin": "heilongjiang", "xian": "shaanxi", "chengdu": "sichuan",
            "chongqing": "chongqing", "jinan": "shandong", "qingdao": "shandong", "suzhou": "jiangsu",
            "hangzhou": "zhejiang", "xiamen": "fujian", "kunming": "yunnan", "dali": "yunnan"}
NOMS = {"新疆": "xinjiang", "黑龙江": "heilongjiang", "陕西": "shaanxi", "四川": "sichuan", "云南": "yunnan",
        "山东": "shandong", "江苏": "jiangsu", "浙江": "zhejiang", "福建": "fujian"}

html = Path(sys.argv[1]).read_text(encoding="utf-8")
svg = re.search(r"<svg viewBox=\"([^\"]+)\".*?</svg>", html, re.S)
corps, vb = svg.group(0), svg.group(1)
voisins = re.search(r'<g class="voisin">(.*?)</g>', corps, re.S).group(1)
provinces = re.findall(r'<path( class="vue")? d="([^"]+)"/>', re.search(r'<g class="province">(.*?)</g>', corps, re.S).group(1))

def anneaux(d):
    return [[tuple(map(float, p.split(","))) for p in re.findall(r"-?[\d.]+,-?[\d.]+", a)] for a in d.split("M") if a.strip()]
def dedans(x, y, d):
    n = False
    for poly in anneaux(d):
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                n = not n
    return n

villes = {}
for cx, cy, tx, ty, ta, nom in re.findall(r'<circle class="ville-p" cx="(\d+)" cy="(\d+)" r="5"/><text class="ville-t" x="(\d+)" y="(\d+)"( text-anchor="end")?>([^<]+)</text>', corps):
    villes[VILLES[nom]] = {"x": int(cx), "y": int(cy), "tx": int(tx), "ty": int(ty), "fin": bool(ta), "nom": nom}
etiquettes = {NOMS[n]: {"x": int(x), "y": int(y), "milieu": bool(m), "nom": n}
              for x, y, m, n in re.findall(r'<text class="prov-t" x="(\d+)" y="(\d+)"( text-anchor="middle")?>([^<]+)</text>', corps)}
# Villes absentes de la carte du dossier : position calculée sur la même projection (Pékin : le repère gris)
pekin = re.search(r'<circle class="repere-p" cx="(\d+)" cy="(\d+)"', corps).groups()
EXTRAS = {"beijing": {"x": int(pekin[0]), "y": int(pekin[1]), "tx": 404, "ty": 160, "fin": True, "nom": "北京"},
          "shanghai": {"x": 460, "y": 265, "tx": 470, "ty": 262, "fin": False, "nom": "上海"}}
PROVINCE.update(beijing="beijing", shanghai="shanghai")
fonds, colorees = [], {}
for vue, d in provinces:
    if not vue:
        m = [v for v, p in EXTRAS.items() if dedans(p["x"], p["y"], d)]
        if m:
            colorees[m[0]] = d
        else:
            fonds.append(d)
        continue
    ids = {PROVINCE[v] for v, p in villes.items() if dedans(p["x"], p["y"], d)}
    if not ids:  # morceau sans ville (île, enclave) : la province de la ville la plus proche
        pts = [q for a in anneaux(d) for q in a]
        gx, gy = sum(q[0] for q in pts) / len(pts), sum(q[1] for q in pts) / len(pts)
        ids = {PROVINCE[min(villes, key=lambda v: (villes[v]["x"] - gx) ** 2 + (villes[v]["y"] - gy) ** 2)]}
        print("morceau sans ville, rattaché à", ids, "centre", round(gx), round(gy))
    assert len(ids) == 1, ids
    i = ids.pop()
    colorees[i] = colorees.get(i, "") + d
villes.update(EXTRAS)
assert len(colorees) == 12, colorees.keys()
carte = {"viewBox": vb, "voisins": voisins, "fonds": fonds, "provinces": colorees, "villes": villes,
         "etiquettes": etiquettes, "province": PROVINCE, "pekin": list(map(int, pekin))}
Path(__file__).resolve().parent.parent.joinpath("carte.js").write_text(
    "// Généré par outils/carte_depuis_dossier.py (carte du dossier « Villes et provinces », fond Natural Earth) : ne pas modifier à la main.\n"
    "const CARTE = " + json.dumps(carte, ensure_ascii=False) + ";\n", encoding="utf-8")
print(len(villes), "villes,", len(colorees), "provinces")
