# Pinyin

Cartes de prononciation du mandarin pour téléphone : écouter le modèle, s'enregistrer, comparer à l'oreille et sur la courbe de ton, et s'entraîner à distinguer à l'oreille les syllabes qu'on confond.

Page : <https://bastiencozian.github.io/chinois/>

- Le paquet (`paquet.txt`) cible les contrastes à risque pour un francophone : *j · z · zh*, *ang · eng · ong*, le *ü* caché, les trois *i*, l'aspiration, les tons.
- Répétition espacée (variante simplifiée de l'algorithme d'Anki). La progression reste dans le navigateur : rien n'est envoyé, aucun enregistrement n'est gardé.
- Courbe de ton : fréquence fondamentale par l'algorithme YIN (de Cheveigné et Kawahara, 2002), en demi-tons autour de la hauteur moyenne de chaque voix.

Reconstruire après avoir modifié le paquet : `python -X utf8 construire.py`.

## Sinogrammes (`hanzi/`)

Les mots du cours, page : <https://bastiencozian.github.io/chinois/hanzi/>. Quatre cartes par mot : **écriture** au doigt, trait par trait, dans l'ordre (tracé vérifié par Hanzi Writer), **sens**, **lecture** (tons corrigés ; enregistrement facultatif, comparé au modèle à l'oreille et sur la courbe de ton ; « Je ne peux pas parler ici » pour lire de tête), **écoute**. Pour chaque mot : l'ordre des traits animé, la clé et les composants, et la comparaison de sa prononciation au modèle.

- Le paquet se modifie dans `hanzi/paquet.txt`, puis `python -X utf8 construire.py` dans `hanzi/` (tracés, sons, composants, cache hors ligne).
- Même répétition espacée que la page Pinyin (`srs.js`), même micro et même courbe de ton (`voix.js`, `ton.js`) : après une modification de l'un de ces fichiers ou de `style.css`, relancer les **deux** constructions, pour que chaque page renouvelle son cache.
- Chaque page n'efface et ne lit que ses propres caches (`pinyin-…`, `hanzi-…`).

## Crédits et licences

- **Sons** (`audio/`) : syllabes enregistrées par **Chen Wang**, projet [audio-cmn](https://github.com/hugolpz/audio-cmn) (Hugo Lopez, Inalco), licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Fichiers repris tels quels, renommés seulement pour `jù` (`jv4` → `ju4`).
- **Sons des mots** (`hanzi/sons/`) : mots du HSK lus par **Yue Tan** (et quelques syllabes de Chen Wang), même projet audio-cmn, CC BY-SA 4.0.
- **Ordre des traits** : bibliothèque [Hanzi Writer](https://hanziwriter.org) (David Chanin, licence MIT), `hanzi/hanzi-writer.min.js` ; tracés (`hanzi/traits/`) du paquet hanzi-writer-data, tirés de [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (Shaunak Kishore), d'après les polices Arphic : licence Arphic Public License (`hanzi/ARPHICPL.TXT`). Décompositions et clés : dictionnaire de Make Me a Hanzi (LGPL).
- **Code** : licence MIT.
