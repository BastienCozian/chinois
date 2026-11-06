"""Construit les leçons publiques du site (…/chinois/cours/) à partir des leçons de l'Agent Teach.

Usage : python -X utf8 construire.py   (dans cours/)

Les leçons sont écrites dans le dossier de la formation (../../lessons, ../../reference,
../../assets) ; ce script en tire une copie pour les élèves du cours, sans ce qui ne sert
qu'à l'apprenant qui travaille avec un Agent Teach :
  - les éléments marqués data-public="non" (encadré « Une question ? ») sont retirés ;
  - le récapitulatif des exercices devient un simple bilan (<html data-public>, lu par quiz.js) ;
  - le fil de retour mène au sommaire des leçons et au site, plus aux autres formations.
Le sommaire (index.html) reprend les sections « Leçons » et « Dossiers » du sommaire de la formation.

Ne jamais modifier à la main les fichiers produits : relancer ce script.
"""

import re
import shutil
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
SOURCE = ICI.parent.parent  # dossier de la formation Chinois
SOUS_DOSSIERS = ["lessons", "reference"]
ASSETS = ["cours.css", "quiz.js", "son.js", "ancres-details.js"]

FIL = ('<nav class="fil-retour{bas}" aria-label="Retour"><a href="../index.html">← Les leçons</a>'
       '<a href="../../">Prononciation et caractères</a></nav>')


def retirer_prive(texte: str) -> str:
    """Retire chaque élément qui porte data-public="non", balises imbriquées comprises."""
    while True:
        m = re.search(r'<(\w+)\b[^>]*\bdata-public="non"[^>]*>', texte)
        if not m:
            return texte
        nom, prof, i = m.group(1), 1, m.end()
        balise = re.compile(r"<(/?)" + nom + r"\b[^>]*>")
        while prof:
            b = balise.search(texte, i)
            if not b:
                sys.exit(f"Balise <{nom}> data-public=\"non\" non refermée")
            prof += -1 if b.group(1) else 1
            i = b.end()
        debut = texte.rfind("\n", 0, m.start()) + 1
        if texte[debut:m.start()].strip():
            debut = m.start()
        fin = i + len(re.match(r"\r?\n?", texte[i:]).group(0))  # avec son retour à la ligne (CRLF ou LF)
        texte = texte[:debut] + texte[fin:]


def page(texte: str, nom: str) -> str:
    texte = texte.replace('<html lang="fr">', '<html lang="fr" data-public>', 1)
    texte = re.sub(r'<nav class="fil-retour( bas)?" aria-label="Retour">.*?</nav>',
                   lambda m: FIL.format(bas=m.group(1) or ""), texte)
    texte = retirer_prive(texte)
    # Aucun lien ne doit sortir de la formation (autres formations, accueil commun, fichiers de travail)
    for lien in re.findall(r'(?:href|src)="([^"#]*)', texte):
        if lien.startswith(("http://", "https://", "mailto:")) or not lien:
            continue
        if lien in ("../index.html", "../../") or lien.startswith("../assets/") or \
           re.fullmatch(r"(\.\./(lessons|reference)/)?[\w.-]+\.html", lien):
            continue
        sys.exit(f"{nom} : lien qui sort des leçons publiques : {lien}")
    if "terminal" in texte or "Agent Teach" in texte:
        print(f"Attention : {nom} parle encore du terminal ou de l'Agent Teach", file=sys.stderr)
    return texte


def sommaire() -> str:
    t = (SOURCE / "index.html").read_bytes().decode("utf-8")
    m = re.search(r'(<h2 id="lecons">.*?)<h2 id="pinyin">', t, re.S)
    if not m:
        sys.exit("Sommaire de la formation : sections « Leçons » et « Dossiers » introuvables")
    corps = m.group(1).rstrip()
    return f"""<!doctype html>
<html lang="fr" data-public>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chinois · Leçons</title>
<meta name="description" content="Leçons de révision du cours de chinois : les phrases de la classe, les chansons, les caractères et leurs composants.">
<link rel="stylesheet" href="assets/cours.css">
</head>
<body>
<main>
  <nav class="fil-retour" aria-label="Retour"><a href="../">← Prononciation et caractères</a></nav>
  <p class="surtitre">Chinois · révisions du cours</p>
  <h1>Les leçons</h1>
  <p class="chapeau">Une leçon par lot de révision donné en cours : lire, écouter, puis s'exercer de tête. Les mots de chaque leçon sont aussi dans les cartes des <a href="../hanzi/">Caractères</a>, à écrire au doigt.</p>
  <p>Chaque leçon tient en 10 à 15 minutes. Les exercices se corrigent tout de suite ; déclarez votre confiance avant de répondre : une erreur commise en étant sûr de soi est celle qui apprend le plus. Rien n'est envoyé ni enregistré.</p>

  {corps}

  <p class="score">Sons des mots : projet <a href="https://github.com/hugolpz/audio-cmn">audio-cmn</a> (voix de Yue Tan), licence CC BY-SA 4.0.</p>
  <nav class="fil-retour bas" aria-label="Retour"><a href="../">← Prononciation et caractères</a></nav>
</main>
</body>
</html>
"""


def main():
    # Les dossiers ne sont ni effacés ni recréés (le dossier est synchronisé : cela crée des copies de conflit).
    # On écrit chaque fichier attendu, puis on retire ceux qui ne sont plus produits.
    attendus = {}
    for d in SOUS_DOSSIERS:
        for f in sorted((SOURCE / d).glob("*.html")):
            attendus[ICI / d / f.name] = page(f.read_bytes().decode("utf-8"), f"{d}/{f.name}").encode("utf-8")
    for f in [SOURCE / "assets" / nom for nom in ASSETS] + sorted((SOURCE / "assets").glob("son-*.mp3")):
        attendus[ICI / "assets" / f.name] = f.read_bytes()
    for d in SOUS_DOSSIERS + ["assets"]:
        (ICI / d).mkdir(exist_ok=True)
        for f in (ICI / d).iterdir():
            if f not in attendus:
                f.unlink() if f.is_file() else shutil.rmtree(f)
    for f, octets in attendus.items():
        if not f.exists() or f.read_bytes() != octets:
            f.write_bytes(octets)
    (ICI / "index.html").write_bytes(sommaire().encode("utf-8"))
    n = sum(1 for d in SOUS_DOSSIERS for _ in (ICI / d).glob("*.html"))
    print(f"{n} pages et le sommaire construits dans {ICI}")


if __name__ == "__main__":
    main()
