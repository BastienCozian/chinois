# Pinyin

Cartes de prononciation du mandarin pour téléphone : écouter le modèle, s'enregistrer, comparer à l'oreille et sur la courbe de ton, et s'entraîner à distinguer à l'oreille les syllabes qu'on confond.

Page : <https://bastiencozian.github.io/chinois/>

- Le paquet (`paquet.txt`) cible les contrastes à risque pour un francophone : *j · z · zh*, *ang · eng · ong*, le *ü* caché, les trois *i*, l'aspiration, les tons.
- Répétition espacée (variante simplifiée de l'algorithme d'Anki). La progression reste dans le navigateur : rien n'est envoyé, aucun enregistrement n'est gardé.
- Courbe de ton : fréquence fondamentale par l'algorithme YIN (de Cheveigné et Kawahara, 2002), en demi-tons autour de la hauteur moyenne de chaque voix.

Reconstruire après avoir modifié le paquet : `python -X utf8 construire.py`.

## Crédits et licences

- **Sons** (`audio/`) : syllabes enregistrées par **Chen Wang**, projet [audio-cmn](https://github.com/hugolpz/audio-cmn) (Hugo Lopez, Inalco), licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Fichiers repris tels quels, renommés seulement pour `jù` (`jv4` → `ju4`).
- **Code** : licence MIT.
