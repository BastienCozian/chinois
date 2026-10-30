"""Construit la page Sinogrammes à partir de paquet.txt.

Usage :
  python -X utf8 construire.py

  1. lit paquet.txt et vérifie chaque mot (un caractère par syllabe, pinyin à chiffres) ;
  2. télécharge ce qui manque : le tracé de chaque caractère (traits/, données de Hanzi Writer),
     les sons (sons/, audio-cmn), la bibliothèque Hanzi Writer et le dictionnaire de Make Me a Hanzi (.cache/) ;
  3. tire du dictionnaire la clé et les composants de chaque caractère, et signale les composants
     sans sens français dans la section « composants » de paquet.txt ;
  4. écrit paquet.js et sw.js (cache hors ligne, version recalculée).
"""

import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
TRAITS = ICI / "traits"
SONS = ICI / "sons"
CACHE = ICI / ".cache"

HANZI_WRITER = "https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.2/dist/hanzi-writer.min.js"
DONNEES = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/{}.json"
LICENCE_DONNEES = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/ARPHICPL.TXT"
DICTIONNAIRE = "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt"
AUDIO = "https://cdn.jsdelivr.net/gh/hugolpz/audio-cmn@master/64k/{}/cmn-{}.mp3"

RE_ID = re.compile(r"^[a-z0-9-]+$")
RE_SYLLABE = re.compile(r"^[a-zv]+[1-5]$")
# Description idéographique : opérateurs à deux ou trois composants
ARITE = {**{c: 2 for c in "⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻"}, "⿲": 3, "⿳": 3}


def telecharger(url: str, cible: Path) -> bool:
    if cible.exists():
        return False
    cible.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as r:
        cible.write_bytes(r.read())
    return True


def hexa(c: str) -> str:
    return f"{ord(c):X}"


def lire_paquet() -> tuple[list[dict], dict, dict]:
    listes, mots, composants = [], {}, {}
    erreurs, section = [], None
    for n, brute in enumerate((ICI / "paquet.txt").read_text(encoding="utf-8").splitlines(), 1):
        l = brute.strip()
        if not l or l.startswith("# ") or l == "#":
            continue
        if l.startswith("## "):
            ident, _, titre = l[3:].partition("|")
            section = ident.strip()
            if section != "composants":
                listes.append({"id": section, "titre": titre.strip(), "mots": []})
            continue
        champs = [c.strip() for c in l.split("|")]
        if section == "composants":
            composants[champs[0]] = champs[1]
            continue
        if section is None or len(champs) != 6:
            erreurs.append(f"ligne {n} : six champs attendus, ou ligne hors liste")
            continue
        ident, hz, py, sens, son, remarque = champs
        syllabes = py.split()
        if not RE_ID.match(ident) or ident in mots:
            erreurs.append(f"ligne {n} : id « {ident} » invalide ou déjà pris")
        if len(syllabes) != len(hz) or not all(RE_SYLLABE.match(s) for s in syllabes):
            erreurs.append(f"ligne {n} : « {py} » ne donne pas une syllabe à chiffres par caractère de {hz}")
        if son and son != "aucun" and not re.fullmatch(r"syllabe [a-zv]+[1-4]", son):
            erreurs.append(f"ligne {n} : son « {son} » : vide, « aucun » ou « syllabe zhi1 »")
        mots[ident] = {"hz": hz, "py": syllabes, "sens": sens, "son": son, "remarque": remarque, "liste": section}
        listes[-1]["mots"].append(ident)
    if erreurs:
        sys.exit("paquet.txt :\n  " + "\n  ".join(erreurs))
    return listes, mots, composants


def feuilles(ids: str) -> list[str]:
    """Composants d'une description idéographique (⿰亻尔 → 亻 尔), sans les inconnus (？)."""
    pile, sortie = list(ids), []
    def lire() -> None:
        c = pile.pop(0)
        if c in ARITE:
            for _ in range(ARITE[c]):
                lire()
        elif c not in "？?":
            sortie.append(c)
    try:
        lire()
    except IndexError:
        pass
    return sortie


def caracteres(mots: dict, composants: dict) -> dict:
    telecharger(DICTIONNAIRE, CACHE / "dictionary.txt")
    dico = {}
    for l in (CACHE / "dictionary.txt").read_text(encoding="utf-8").splitlines():
        d = json.loads(l)
        dico[d["character"]] = d
    infos, manquants = {}, set()
    for m in mots.values():
        for c, s in zip(m["hz"], m["py"]):
            if c in infos:
                continue
            if telecharger(DONNEES.format(urllib.parse.quote(c)), TRAITS / f"{hexa(c)}.json"):
                print(f"  tracé de {c} téléchargé")
            d = dico.get(c, {})
            ety = d.get("etymology") or {}
            ids = d.get("decomposition", "？")
            # Décomposition incomplète (？) : on n'en montre rien, une partie seule tromperait (耳 → 二)
            parties = [] if "？" in ids else [p for p in feuilles(ids) if p != c]
            def decrit(p: str) -> list[str]:
                if p not in composants:
                    manquants.add(p)
                py = (dico.get(p) or {}).get("pinyin") or [""]
                return [p, py[0], composants.get(p, "")]
            infos[c] = {
                "hex": hexa(c),
                "cle": d.get("radical", ""),
                "parties": [decrit(p) for p in parties],
                "semantique": ety.get("semantic", "") if ety.get("type") == "pictophonetic" else "",
                "phonetique": ety.get("phonetic", "") if ety.get("type") == "pictophonetic" else "",
            }
            if infos[c]["cle"] and infos[c]["cle"] not in parties and infos[c]["cle"] != c:
                infos[c]["cleSens"] = composants.get(infos[c]["cle"], "")
                if infos[c]["cle"] not in composants:
                    manquants.add(infos[c]["cle"])
    if manquants:
        print("Composants sans sens français (section « composants » de paquet.txt) : " + " ".join(sorted(manquants)))
    return infos


def sons(mots: dict) -> None:
    for ident, m in mots.items():
        if m["son"] == "aucun":
            continue
        if m["son"]:
            url = AUDIO.format("syllabs", m["son"].split()[1])
        else:
            url = AUDIO.format("hsk", urllib.parse.quote(m["hz"]))
        try:
            if telecharger(url, SONS / f"{ident}.mp3"):
                print(f"  son de {m['hz']} téléchargé")
        except Exception as e:
            sys.exit(f"Son introuvable pour {m['hz']} ({url}) : {e}. Mettre « aucun » ou « syllabe … » dans paquet.txt.")


def ecrire(listes: list, mots: dict, infos: dict) -> None:
    for m in mots.values():
        m["son"] = m["son"] != "aucun"
    paquet = {"listes": listes, "mots": mots, "caracteres": infos}
    (ICI / "paquet.js").write_text("// Généré par construire.py à partir de paquet.txt : ne pas modifier à la main.\n"
                                   "const PAQUET = " + json.dumps(paquet, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    # Manifeste et icônes : ceux de la page Pinyin, une seule appli pour les deux pages
    fichiers = ["./", "index.html", "hanzi.css", "app.js", "hanzi.js", "paquet.js", "hanzi-writer.min.js",
                "../manifest.json", "../icone-180.png", "../icone-512.png",
                "../style.css", "../srs.js", "../profil.js", "../ton.js", "../voix.js"]
    fichiers += sorted(f"traits/{i['hex']}.json" for i in infos.values())
    fichiers += sorted(f"sons/{p.name}" for p in SONS.glob("*.mp3") if p.stem in mots)
    h = hashlib.sha1()
    for f in fichiers[1:]:
        h.update((ICI / f).read_bytes())
    sw = (ICI / "sw.js").read_text(encoding="utf-8") if (ICI / "sw.js").exists() else ""
    corps = sw.split("// --- fin de l'en-tête ---\n", 1)[1]
    (ICI / "sw.js").write_text("// Généré par construire.py : ne pas modifier l'en-tête à la main.\n"
                               "// Cache hors ligne : la page marche sans réseau une fois ouverte.\n"
                               f'const VERSION = "hanzi-{h.hexdigest()[:10]}";\n'
                               "const FICHIERS = " + json.dumps(fichiers, ensure_ascii=False, indent=1) + ";\n"
                               "// --- fin de l'en-tête ---\n" + corps, encoding="utf-8")


def main() -> None:
    listes, mots, composants = lire_paquet()
    if telecharger(HANZI_WRITER, ICI / "hanzi-writer.min.js"):
        print("  Hanzi Writer téléchargé")
    telecharger(LICENCE_DONNEES, ICI / "ARPHICPL.TXT")
    infos = caracteres(mots, composants)
    sons(mots)
    ecrire(listes, mots, infos)
    n = sum(4 if m["son"] else 3 for m in mots.values())
    print(f"{len(mots)} mots, {len(infos)} caractères, {n} cartes.")


if __name__ == "__main__":
    main()
