"""Construit la page Pinyin à partir de paquet.txt.

Usage :
  python -X utf8 construire.py

  1. lit paquet.txt et vérifie chaque syllabe contre la liste d'audio-cmn ;
  2. signale un distracteur qui diffère de sa cible par plus d'un trait ;
  3. télécharge dans audio/ les sons qui manquent (audio-cmn, voix de Chen Wang, CC BY-SA) ;
  4. écrit paquet.js (données de la page) et sw.js (cache hors ligne, version recalculée) ;
  5. dessine les icônes de l'écran d'accueil si elles manquent.
"""

import hashlib
import json
import re
import struct
import sys
import urllib.request
import zlib
from pathlib import Path

ICI = Path(__file__).resolve().parent
AUDIO = ICI / "audio"
DEPOT = "hugolpz/audio-cmn"
ARBRE = f"https://api.github.com/repos/{DEPOT}/git/trees/master?recursive=1"
SON = f"https://cdn.jsdelivr.net/gh/{DEPOT}@master/64k/syllabs/cmn-{{}}.mp3"
CACHE_LISTE = ICI / ".syllabes-audio-cmn.txt"

INITIALES = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h",
             "j", "q", "x", "r", "z", "c", "s", "y", "w"]
RE_SYLLABE = re.compile(r"^[a-z]+[1-4]$")


def traits(s: str) -> tuple[str, str, str]:
    """(initiale, finale, ton) d'une syllabe à chiffres. Après j, q, x, le i de la finale
    appartient à l'initiale palatale (jiang et zhang ne diffèrent que par l'initiale)."""
    ton, corps = s[-1], s[:-1]
    ini = next((i for i in INITIALES if corps.startswith(i)), "")
    fin = corps[len(ini):]
    if ini in ("j", "q", "x"):
        if fin.startswith("u"):
            fin = "v" + fin[1:]
        elif fin.startswith("i") and fin not in ("i", "in", "ing"):
            fin = fin[1:]
    return ini, fin, ton


def nom_audio_cmn(s: str, dispo: set[str]) -> str | None:
    """Nom du fichier dans audio-cmn : en général la syllabe elle-même ; parfois le ü de ju, qu, xu
    y est écrit v (jù = jv4)."""
    if s in dispo:
        return s
    if s[0] in "jqx" and s[1] == "u" and s[0] + "v" + s[2:] in dispo:
        return s[0] + "v" + s[2:]
    return None


def lire_paquet() -> dict:
    groupes, cibles = [], {}
    groupe = contraste = None
    for n, ligne in enumerate((ICI / "paquet.txt").read_text(encoding="utf-8").splitlines(), 1):
        ligne = ligne.strip()
        if not ligne or (ligne.startswith("#") and not ligne.startswith("##")):
            continue
        if ligne.startswith("### "):
            cid, libelle = [x.strip() for x in ligne[4:].split("|", 1)]
            contraste = {"id": cid, "libelle": libelle, "cibles": []}
            groupe["contrastes"].append(contraste)
        elif ligne.startswith("## "):
            gid, titre = [x.strip() for x in ligne[3:].split("|", 1)]
            groupe = {"id": gid, "titre": titre, "contrastes": []}
            groupes.append(groupe)
        else:
            if contraste is None:
                sys.exit(f"paquet.txt:{n} : syllabe hors d'un contraste")
            cible, _, reste = ligne.partition(":")
            cible, distr = cible.strip(), reste.split()
            if cible in cibles:
                sys.exit(f"paquet.txt:{n} : {cible} figure deux fois")
            if len(distr) != 3 or cible in distr or len(set(distr)) != 3:
                sys.exit(f"paquet.txt:{n} : il faut trois distracteurs distincts de la cible")
            for s in [cible] + distr:
                if not RE_SYLLABE.match(s):
                    sys.exit(f"paquet.txt:{n} : « {s} » n'est pas une syllabe à chiffres (1 à 4)")
            cibles[cible] = {"groupe": groupe["id"], "contraste": contraste["id"], "distracteurs": distr}
            contraste["cibles"].append(cible)
    return {"groupes": groupes, "cibles": cibles}


def liste_audio_cmn() -> set[str]:
    if not CACHE_LISTE.exists():
        with urllib.request.urlopen(ARBRE) as r:
            arbre = json.load(r)
        noms = [x["path"].split("/")[-1][4:-4] for x in arbre["tree"]
                if x["path"].startswith("64k/syllabs/cmn-") and x["path"].endswith(".mp3")]
        CACHE_LISTE.write_text("\n".join(sorted(noms)), encoding="utf-8")
    return set(CACHE_LISTE.read_text(encoding="utf-8").split())


def ordre_des_cartes(paquet: dict) -> list[str]:
    """Production d'un contraste, puis perception du contraste précédent : la perception
    d'une syllabe vient un contraste plus tard que sa première écoute, pour l'espacer."""
    contrastes = [c["cibles"] for g in paquet["groupes"] for c in g["contrastes"]]
    ordre = []
    for i, cibles in enumerate(contrastes):
        ordre += ["p-" + s for s in cibles]
        if i > 0:
            ordre += ["e-" + s for s in contrastes[i - 1]]
    ordre += ["e-" + s for s in contrastes[-1]]
    return ordre


def png(chemin: Path, taille: int) -> None:
    """Icône : fond bleu, quatre contours de tons en blanc (ˉ ˊ ˇ ˋ)."""
    fond, trait = (31, 95, 139), (255, 255, 255)
    px = [[fond] * taille for _ in range(taille)]
    ep = max(2, taille // 30)
    # Contours sur l'échelle de Chao (1 = grave, 5 = aigu), dans quatre cases
    tons = [[(0, 5), (1, 5)], [(0, 3), (1, 5)], [(0, 2), (0.5, 1), (1, 4)], [(0, 5), (1, 1)]]
    marge, case = taille * 0.14, taille * 0.72 / 4
    for k, pts in enumerate(tons):
        x0 = marge + k * case + case * 0.15
        larg = case * 0.7
        def xy(p):
            return x0 + p[0] * larg, taille * 0.72 - (p[1] - 1) / 4 * taille * 0.44
        for a, b in zip(pts, pts[1:]):
            (xa, ya), (xb, yb) = xy(a), xy(b)
            pas = int(max(abs(xb - xa), abs(yb - ya)) * 2) + 1
            for i in range(pas + 1):
                x, y = xa + (xb - xa) * i / pas, ya + (yb - ya) * i / pas
                for dy in range(-ep, ep + 1):
                    for dx in range(-ep, ep + 1):
                        if dx * dx + dy * dy <= ep * ep:
                            xi, yi = int(x + dx), int(y + dy)
                            if 0 <= xi < taille and 0 <= yi < taille:
                                px[yi][xi] = trait
    brut = b"".join(b"\x00" + bytes(c for p in ligne for c in p) for ligne in px)
    def bloc(typ, donnees):
        return struct.pack(">I", len(donnees)) + typ + donnees + struct.pack(">I", zlib.crc32(typ + donnees))
    chemin.write_bytes(b"\x89PNG\r\n\x1a\n" + bloc(b"IHDR", struct.pack(">IIBBBBB", taille, taille, 8, 2, 0, 0, 0))
                       + bloc(b"IDAT", zlib.compress(brut, 9)) + bloc(b"IEND", b""))


SW = """// Généré par construire.py : ne pas modifier à la main.
// Cache hors ligne : la page marche sans réseau une fois ouverte.
const VERSION = "pinyin-{version}";
const FICHIERS = {fichiers};

self.addEventListener("install", e => {{
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", e => {{
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", e => {{
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then(r => r || fetch(e.request)));
}});
"""


def main() -> None:
    paquet = lire_paquet()
    dispo = liste_audio_cmn()
    syllabes = sorted({s for c, v in paquet["cibles"].items() for s in [c] + v["distracteurs"]})
    manquantes = [s for s in syllabes if not nom_audio_cmn(s, dispo)]
    if manquantes:
        sys.exit("Absentes d'audio-cmn : " + ", ".join(manquantes))
    for c, v in paquet["cibles"].items():
        if v["groupe"] == "u-cache":
            continue  # ju contre zhu : l'initiale et la voyelle changent ensemble, c'est le piège enseigné
        for d in v["distracteurs"]:
            n = sum(a != b for a, b in zip(traits(c), traits(d)))
            if n != 1:
                print(f"Attention : {d} diffère de {c} par {n} traits {traits(c)} / {traits(d)}")

    AUDIO.mkdir(exist_ok=True)
    nouveaux = 0
    for s in syllabes:
        f = AUDIO / f"{s}.mp3"
        if not f.exists():
            with urllib.request.urlopen(SON.format(nom_audio_cmn(s, dispo))) as r:
                f.write_bytes(r.read())
            nouveaux += 1
    for f in AUDIO.glob("*.mp3"):
        if f.stem not in syllabes:
            f.unlink()
            print(f"Supprimé : audio/{f.name}")

    paquet["ordre"] = ordre_des_cartes(paquet)
    (ICI / "paquet.js").write_text(
        "// Généré par construire.py à partir de paquet.txt : ne pas modifier à la main.\n"
        "const PAQUET = " + json.dumps(paquet, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

    for t in (180, 512):
        if not (ICI / f"icone-{t}.png").exists():
            png(ICI / f"icone-{t}.png", t)

    fichiers = ["./", "index.html", "style.css", "app.js", "srs.js", "ton.js", "paquet.js",
                "manifest.json", "icone-180.png", "icone-512.png"] + [f"audio/{s}.mp3" for s in syllabes]
    empreinte = hashlib.sha1()
    for f in fichiers[1:]:
        empreinte.update((ICI / f).read_bytes())
    (ICI / "sw.js").write_text(SW.format(version=empreinte.hexdigest()[:10], fichiers=json.dumps(fichiers, indent=1)),
                               encoding="utf-8")
    n = len(paquet["cibles"])
    print(f"{n} syllabes cibles, {2 * n} cartes, {len(syllabes)} sons ({nouveaux} téléchargés).")


if __name__ == "__main__":
    main()
