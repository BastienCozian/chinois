# Pinyin

Site d'entraînement au chinois pour les élèves du cours, sur téléphone. Deux sections, en onglets : **Prononciation** (cette page) et **Caractères** (`hanzi/`), plus un troisième onglet vers les **Leçons** (`cours/`). Une seule appli à mettre sur l'écran d'accueil : « Chinois ».

Page : <https://bastiencozian.github.io/chinois/>

## Leçons (`cours/`)

Les leçons de révision du cours, une par lot donné par l'enseignant : <https://bastiencozian.github.io/chinois/cours/>. Elles sont écrites hors de ce dépôt, dans le dossier de travail de l'apprenant, puis copiées ici par `python -X utf8 cours/construire.py`. Ne pas modifier à la main les pages de `cours/` : relancer le script. La copie retire ce qui ne sert qu'à l'apprenant suivi par un Agent Teach (éléments `data-public="non"`, récapitulatif à coller dans un terminal) ; les exercices s'y corrigent tout de suite et finissent par un bilan des exercices à revoir. Rien n'est enregistré.

## Installer comme une application (`Profil.htmlAppli`)

Tant que le site n'est pas ouvert depuis son icône, un bloc « Installer comme une application » donne les étapes pour iPhone (Safari, Partager, « Sur l'écran d'accueil ») et pour Android (Chrome, menu ⋮, « Installer l'application » ; Samsung Internet, Firefox). Les étapes de l'appareil utilisé sont dépliées. Sur téléphone, le bloc s'affiche avant « Première fois ? » sur l'écran « Qui s'entraîne ? » : sur iPhone, l'icône ne voit pas la progression faite dans Safari, il faut donc installer avant de commencer. Il est replié sur l'accueil des deux pages. Quand Chrome propose sa propre installation (`beforeinstallprompt`), un bouton « Installer l'application » s'ajoute.

## Profils (`profil.js`)

Au premier passage sur un appareil, on choisit son profil ou on tape son prénom : un nouveau profil part de zéro. Chacun a sa progression et son rythme ; elle reste dans le navigateur, rien n'est envoyé. « Changer de profil » est en haut des deux pages.

- **Bastien**, toujours proposé en premier, garde les clés de stockage d'origine (`pinyin-v1`, `hanzi-v1`) : sa progression d'avant les profils est la sienne, sans migration. Personne n'est choisi d'office : tout nouvel arrivant voit « Qui s'entraîne ? », et Bastien retrouve sa progression en touchant son prénom. Lui seul voit le bloc « Bilan pour l'Agent Teach ».
- Un autre profil range sa progression sous `pinyin-v1@<id>` et `hanzi-v1@<id>`. Registre des profils : `chinois-profils`.
- La progression ne suit pas l'élève d'un appareil à l'autre : « Sauvegarder la progression » puis « Restaurer une sauvegarde » (Réglages, sur chacune des deux pages).

## Une mise à jour ne fait perdre aucune progression

Règles pour toute modification du site, quel que soit le profil :

- **Clés de stockage** (`pinyin-v1`, `hanzi-v1`, `chinois-profils`, suffixe `@<id>`) et **ids de cartes** (`p-zhang1`, `e-ni`…) : ne jamais les renommer. La progression y est attachée.
- **Carte retirée du paquet** (ou paquet mal construit) : sa progression est rangée dans `archive` de l'état (`SRS.ranger`), jamais effacée, et reprend sa place si la carte revient.
- **Carte passée** (bouton « Passer ⏭ » des Sinogrammes, 13 novembre 2026) : `passees` de l'état garde `{ id: jusqu'à }` ; la carte sort de la séance 15 min (`SRS.REPORT`), sans note, sans journal et sans toucher à sa planification. Une carte nouvelle passée reste nouvelle.
- **Format de l'état** : n'ajouter que des champs facultatifs, que l'ancien code ignore et que le nouveau sait absents (`Object.assign(SRS.etatVide(), …)`). Pas de migration qui réécrit l'état.
- Le cache hors ligne (`sw.js`) ne touche pas au stockage : une nouvelle version remplace les fichiers, pas la progression.
- Ce qui peut encore la perdre : effacer les données du navigateur, changer d'appareil, ou Safari qui efface le stockage d'un site non ouvert depuis 7 jours (les pages le demandent persistant, et l'icône sur l'écran d'accueil l'en protège). D'où la sauvegarde, et l'écran ci-dessous.

**Retrouver mon niveau** (`niveau.js`, Réglages, ou lien sur l'accueil d'un profil vierge) : sans sauvegarde, l'élève indique pour chaque mot (Sinogrammes) ou chaque syllabe (Prononciation), ou pour toute une liste, « Pas encore vu », « Je débute », « Je le connais » ou « Je le maîtrise ». Les cartes de l'élément passent en révision espacée avec un intervalle de 1, 7 ou 30 jours, et leurs retours sont étalés (`SRS.declarer`). Seuls les éléments changés sont touchés. Les déclarations sont gardées dans `declarations` et apparaissent au bilan de l'Agent Teach comme une auto-évaluation.

## Prononciation

Cartes de prononciation du mandarin : écouter le modèle, s'enregistrer, comparer à l'oreille et sur la courbe de ton, et s'entraîner à distinguer à l'oreille les syllabes qu'on confond.

- Le paquet (`paquet.txt`) cible les contrastes à risque pour un francophone : *j · z · zh*, *ang · eng · ong*, le *ü* caché, les trois *i*, l'aspiration, les tons.
- Répétition espacée (variante simplifiée de l'algorithme d'Anki). La progression reste dans le navigateur : rien n'est envoyé, aucun enregistrement n'est gardé.
- Courbe de ton : fréquence fondamentale par l'algorithme YIN (de Cheveigné et Kawahara, 2002), en demi-tons autour de la hauteur moyenne de chaque voix.

Reconstruire après avoir modifié le paquet : `python -X utf8 construire.py`.

## Sinogrammes (`hanzi/`)

Les mots du cours, page : <https://bastiencozian.github.io/chinois/hanzi/>. Quatre cartes par mot : **écriture** au doigt, trait par trait, dans l'ordre (tracé vérifié par Hanzi Writer), **sens**, **lecture** (tons corrigés ; enregistrement facultatif, comparé au modèle à l'oreille et sur la courbe de ton ; « Je ne peux pas parler ici » pour lire de tête), **écoute**. Pour chaque mot : l'ordre des traits animé, la clé et les composants, et la comparaison de sa prononciation au modèle.

- Chaque caractère a un indice (section « indices » de `hanzi/paquet.txt`, obligatoire) : l'origine établie, ou une astuce affichée comme inventée. Les mots composés ont leur mot à mot.
- Le paquet se modifie dans `hanzi/paquet.txt`, puis `python -X utf8 construire.py` dans `hanzi/` (tracés, sons, composants, cache hors ligne).
- Même répétition espacée que la page Pinyin (`srs.js`), mêmes profils (`profil.js`), même micro et même courbe de ton (`voix.js`, `ton.js`), même manifeste et mêmes icônes : après une modification de l'un de ces fichiers ou de `style.css`, relancer les **deux** constructions, pour que chaque page renouvelle son cache.
- Chaque page n'efface et ne lit que ses propres caches (`pinyin-…`, `hanzi-…`).

## Crédits et licences

- **Sons** (`audio/`) : syllabes enregistrées par **Chen Wang**, projet [audio-cmn](https://github.com/hugolpz/audio-cmn) (Hugo Lopez, Inalco), licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Fichiers repris tels quels, renommés seulement pour `jù` (`jv4` → `ju4`).
- **Sons des mots** (`hanzi/sons/`, `cours/assets/son-*.mp3`) : mots du HSK lus par **Yue Tan** (et quelques syllabes de Chen Wang), même projet audio-cmn, CC BY-SA 4.0.
- **Carte des villes** (`cours/reference/villes-et-provinces.html`) : fond [Natural Earth](https://www.naturalearthdata.com/), domaine public.
- **Ordre des traits** : bibliothèque [Hanzi Writer](https://hanziwriter.org) (David Chanin, licence MIT), `hanzi/hanzi-writer.min.js` ; tracés (`hanzi/traits/`) du paquet hanzi-writer-data, tirés de [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (Shaunak Kishore), d'après les polices Arphic : licence Arphic Public License (`hanzi/ARPHICPL.TXT`). Décompositions et clés : dictionnaire de Make Me a Hanzi (LGPL).
- **Code** : licence MIT.
