// Page Sinogrammes : écrans, son, tracé au doigt (Hanzi Writer). La logique est dans hanzi.js et ../srs.js ;
// le micro et la comparaison de ma voix au modèle dans ../voix.js et ../ton.js.
"use strict";

(() => {
  const zone = document.getElementById("zone");
  // Premier passage sur cet appareil : on choisit ou crée son profil, puis la page repart
  if (!Profil.actif()) { Profil.ecran(zone); return; }
  const CLE = Profil.cle("hanzi-v1");
  const REVISIONS_URL = "https://claude.ai/artifact/WLAHNFeXYSz8xzBWGoF7x8";
  const P = PAQUET;
  const TOUS = { e: true, s: true, l: true, o: true };

  /* ---------- État, gardé dans le navigateur ---------- */

  let E = charger();
  let ORDRE = Hanzi.ordre(P, E.types);
  let alerteStockage = false;

  function charger() {
    try {
      const v = localStorage.getItem(CLE);
      if (v) {
        const e = Object.assign(SRS.etatVide(), { types: Object.assign({}, TOUS) }, JSON.parse(v));
        // Mots retirés du paquet : on oublie leur progression
        for (const id of Object.keys(e.cartes)) if (!P.mots[id.slice(2)]) delete e.cartes[id];
        return e;
      }
    } catch (e) { /* stockage indisponible : on repart d'un état vide */ }
    return Object.assign(SRS.etatVide(), { types: Object.assign({}, TOUS) });
  }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(E)); alerteStockage = false; }
    catch (e) { alerteStockage = true; }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const vue = () => Hanzi.vue(E, E.types);

  /* ---------- Son ---------- */

  const src = (id) => "sons/" + id + ".mp3";
  function jouer(id) {
    if (P.mots[id].son) Voix.jouer(src(id));
  }

  /* ---------- Ma voix comparée au modèle ---------- */

  const DUREE_MAX = 4000; // un enregistrement s'arrête seul après 4 s : un mot de deux ou trois syllabes
  let voix = null;        // comparaison de l'écran affiché
  let silence = false;    // « Je ne peux pas parler ici » : jusqu'à la fermeture de la page

  // Quitte l'écran : coupe le son, le micro, et oublie mon enregistrement
  function lacher() {
    Voix.couper();
    if (voix) { voix.liberer(); voix = null; }
  }
  function brancherVoix(id, options) {
    Ton.contexte(); // créé pendant un geste : Safari l'exige
    voix = Voix.comparer(zone, src(id), Object.assign({ duree: DUREE_MAX, sansMicro: " et répétez à voix haute." }, options));
  }

  /* ---------- Affichage d'un mot ---------- */

  const py = (m) => Hanzi.pinyin(m.py);
  const hz = (texte, classe) => `<span class="hz${classe ? " " + classe : ""}" lang="zh-Hans">${texte}</span>`;
  const bSon = (id) => (P.mots[id].son ? `<button class="son" data-son="${id}" aria-label="Écouter">▶</button>` : "");

  // Composants d'un caractère : clé du dictionnaire, puis parties ; « sens » et « son » pour les idéo-phonétiques
  function htmlComposants(c) {
    const i = P.caracteres[c];
    const parts = i.parties.map(([p, pin, sens]) => {
      const roles = [p === i.cle && "clé", p === i.semantique && "donne le sens", p === i.phonetique && "donne le son"].filter(Boolean);
      return `${hz(p)} <i>${pin}</i> ${sens}${roles.length ? ` <em>(${roles.join(", ")})</em>` : ""}`;
    });
    let h = `<p class="compo">${hz(c, "compo-c")}`;
    if (parts.length) h += ` = ${parts.join(" + ")}`;
    if (i.cle && i.cle !== c && !i.parties.some((p) => p[0] === i.cle)) h += `<br><span class="info">clé ${hz(i.cle)} ${i.cleSens || ""}</span>`;
    return h + "</p>" + htmlIndice(c);
  }

  // Indice d'un caractère, sans le caractère : affichable pendant qu'on le cherche.
  // L'origine est établie ; l'astuce est inventée pour la mémoire, et le dit.
  const hzTexte = (t) => t.replace(/[\u2e80-\u2fdf\u3400-\u9fff]+/g, (x) => hz(x));
  function htmlIndice(c) {
    const i = P.caracteres[c].indice;
    return (i.origine ? `<p class="indice"><b>Origine</b> ${hzTexte(i.origine)}</p>` : "") +
      (i.astuce ? `<p class="indice astuce"><b>Astuce inventée</b> ${hzTexte(i.astuce)}</p>` : "");
  }

  // Le mot en entier : caractères, pinyin, son, sens, remarque, composants
  function htmlMot(id, avecCompo) {
    const m = P.mots[id];
    let h = `<div class="mot">${hz(m.hz, "grand")}<p class="py" lang="zh-Latn-pinyin">${py(m)} ${bSon(id)}</p>
      <p class="sens">${m.sens}</p>${m.motAMot ? `<p class="indice"><b>Mot à mot</b> ${hzTexte(m.motAMot)}</p>` : ""}${m.remarque ? `<p class="remarque">${m.remarque}</p>` : ""}</div>`;
    if (avecCompo) h += `<details class="compos" open><summary>Pour retenir</summary>${[...new Set(m.hz)].map(htmlComposants).join("")}</details>`;
    return h;
  }

  function brancherSons() {
    zone.querySelectorAll("[data-son]").forEach((b) => { b.onclick = () => jouer(b.dataset.son); });
  }

  /* ---------- Tracé : un caractère dans un carré quadrillé (米字格) ---------- */

  const GRILLE = `<svg class="grille" viewBox="0 0 100 100" aria-hidden="true"><rect x="0.5" y="0.5" width="99" height="99"/>
    <path d="M50 0V100M0 50H100M0 0L100 100M100 0L0 100"/></svg>`;

  function couleurs() {
    const s = getComputedStyle(document.documentElement), v = (n) => s.getPropertyValue(n).trim();
    return { strokeColor: v("--fg"), outlineColor: v("--rule"), drawingColor: v("--accent"), highlightColor: v("--warm"), radicalColor: null };
  }

  function chargerTrace(c, ok, ko) {
    fetch("traits/" + c.codePointAt(0).toString(16).toUpperCase() + ".json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))).then(ok, ko);
  }

  // Crée un tracé dans le conteneur .ecrire de la zone
  function traceur(c, options) {
    const boite = zone.querySelector(".ecrire");
    const parent = boite.parentElement, st = getComputedStyle(parent);
    const taille = Math.min(parent.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight), 340);
    boite.style.width = boite.style.height = taille + "px";
    const cible = boite.querySelector(".hw");
    cible.innerHTML = "";
    return HanziWriter.create(cible, c, Object.assign({
      width: taille, height: taille, padding: Math.round(taille * 0.06),
      charDataLoader: chargerTrace, showCharacter: false, showOutline: false,
      strokeAnimationSpeed: 1.2, delayBetweenStrokes: 250, drawingWidth: 26,
      strokeHighlightSpeed: 0.5, // indice : le trait attendu passe lentement, le temps de le voir
      onLoadCharDataError: () => { cible.innerHTML = `<p class="ko">Tracé de ${c} indisponible.</p>`; },
    }, couleurs(), options || {}));
  }

  /* ---------- Accueil ---------- */

  function accueil() {
    if (aRecharger) { location.reload(); return; }
    lacher();
    const t = Date.now(), c = SRS.compter(vue(), ORDRE, t);
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;
    let h = Profil.barre("hanzi", "../") + `<header><h1>Sinogrammes</h1>
      <p class="sous-titre">Les mots du cours : les écrire trait par trait, les lire, les comprendre.</p></header>`;
    if (alerteStockage) h += `<p class="alerte">Le navigateur refuse d'enregistrer la progression (navigation privée ?). Elle sera perdue à la fermeture.</p>`;
    h += `<section class="tableau">
      <div><b>${c.dues}</b><span>à réviser</span></div>
      <div><b>${c.nouvelles}</b><span>nouvelles aujourd'hui</span></div>
      <div><b>${c.vues}/${c.total}</b><span>cartes vues</span></div></section>`;
    if (c.dues || c.nouvelles || c.bientot) h += `<button class="principal" id="go">Commencer</button>`;
    else {
      h += `<p class="info">Rien à réviser pour l'instant.</p>`;
      if (c.restantes) h += `<button class="principal" id="encore">Encore 10 nouvelles cartes</button>`;
    }
    h += `<button class="large" id="liste">Les mots : ordre des traits, composants, écriture libre</button>`;
    if (ios) h += `<p class="info">Pour garder votre progression : Partager → « Sur l'écran d'accueil », puis ouvrez la page depuis son icône.</p>`;

    if (Profil.proprio()) h += `<section class="bloc"><h2>Bilan pour l'Agent Teach</h2>
      <p class="info">Dernier bilan copié : ${E.dernierBilan ? SRS.date(E.dernierBilan, true) : "jamais"}.
      Copiez-le quand vous voulez, puis collez-le dans « ✎ Consigne pour l'Agent Teach » en bas de la
      <a href="${REVISIONS_URL}" target="_blank" rel="noopener">page Révisions</a>, formation Chinois.</p>
      <button id="bilan">Copier le bilan</button><div id="bilan-zone"></div></section>`;

    h += `<details class="bloc"><summary>Comment ça marche</summary>
      <p>Chaque mot donne quatre cartes, qui arrivent à quelques mots d'écart.</p>
      <p><b>Écriture</b> (le sens et le pinyin sont donnés). Écrivez chaque caractère au doigt, trait par trait,
      dans l'ordre et dans le bon sens : un trait faux est refusé et compté. Après trois essais, le trait attendu clignote.
      « Aide-mémoire » donne l'origine du caractère ou une astuce ; « Trait suivant » montre le trait attendu ; « Je ne sais pas » montre le caractère, puis vous le repassez.
      La première fois, le mot se présente : regardez l'ordre des traits, puis repassez sur le modèle.
      La note proposée suit vos fautes ; changez-la si elle vous semble injuste.</p>
      <p><b>Sens</b> (les caractères). Retrouvez le sens, puis vérifiez.</p>
      <p><b>Lecture</b> (les caractères). Dites le mot à voix haute en vous enregistrant, puis touchez le ton de chaque syllabe :
      les tons sont corrigés tout de suite, puis le modèle et votre voix passent à la suite, avec leurs courbes de ton
      (bleu : modèle, rouge : vous ; la forme du ton, pas sa hauteur). L'enregistrement n'est pas obligatoire.
      Là où vous ne pouvez pas parler, touchez « Je ne peux pas parler ici » : les cartes de lecture se font alors
      de tête, jusqu'à ce que vous fermiez la page. Vos enregistrements ne sont jamais gardés.</p>
      <p><b>Les mots</b>. La fiche de chaque mot permet aussi de s'enregistrer et de se comparer au modèle, sans note.</p>
      <p><b>Écoute</b> (le son seul). Retrouvez le sens, puis vérifiez.</p>
      <p><b>Pour retenir</b>. « Origine » est ce qu'on sait de l'histoire du caractère ; « Astuce inventée » est une image pour la mémoire, pas une vérité sur le chinois. Quand un composant ne donne que le son, l'indice le dit.</p>
      <p>Tons du dictionnaire : dans 你好, on écrit nǐ hǎo, on dit ní hǎo. La remarque sous le mot le signale.</p>
      <p>Clavier sur PC : espace pour voir la réponse ou réécouter, R pour s'enregistrer, 1 à 4 pour noter, 1 à 5 pour les tons (5 : neutre).</p></details>`;

    h += `<details class="bloc"><summary>Réglages et sauvegarde</summary>
      <p>Cartes à travailler :</p><p class="types">${Object.entries(Hanzi.TYPES).map(([t, nom]) =>
        `<label><input type="checkbox" data-type="${t}"${E.types[t] ? " checked" : ""}> ${nom}</label>`).join("")}</p>
      <p><label>Nouvelles cartes par jour <input id="parjour" type="number" min="0" max="200" value="${E.parJour}"></label></p>
      <p class="info">La progression ne vit que dans ce navigateur. Une sauvegarde de temps en temps la protège.</p>
      <p><button id="export">Sauvegarder la progression</button>
      <label class="bouton">Restaurer une sauvegarde<input id="import" type="file" accept="application/json" hidden></label></p>
      <p><button class="danger" id="zero">Tout remettre à zéro</button></p></details>`;

    h += `<footer><p>Ordre des traits : <a href="https://hanziwriter.org" target="_blank" rel="noopener">Hanzi Writer</a> (David Chanin, MIT),
      données tirées de <a href="https://github.com/skishore/makemeahanzi" target="_blank" rel="noopener">Make Me a Hanzi</a>
      (Shaunak Kishore ; tracés sous licence Arphic Public License, décompositions sous LGPL).
      Sons : mots du HSK lus par Yue Tan et syllabes lues par Chen Wang, projet
      <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noopener">audio-cmn</a> (Inalco),
      licence <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener">CC BY-SA</a>.</p></footer>`;
    zone.innerHTML = h;

    on("#go", seance);
    on("#liste", liste);
    on("#profil", () => { lacher(); Profil.ecran(zone, accueil); });
    on("#encore", () => { SRS.encoreDix(E, Date.now()); sauver(); seance(); });
    on("#bilan", copierBilan);
    on("#export", exporter);
    on("#zero", () => {
      if (confirm(`Effacer toute la progression de ${Profil.actif().nom} sur la page Sinogrammes ?${Profil.proprio() ? " Pensez d'abord à copier le bilan." : ""}`)) {
        E = Object.assign(SRS.etatVide(), { types: Object.assign({}, TOUS) }); ORDRE = Hanzi.ordre(P, E.types); sauver(); accueil();
      }
    });
    zone.querySelectorAll("[data-type]").forEach((b) => {
      b.onchange = () => {
        E.types[b.dataset.type] = b.checked;
        if (!Object.values(E.types).some(Boolean)) { E.types[b.dataset.type] = b.checked = true; return; }
        ORDRE = Hanzi.ordre(P, E.types); sauver(); accueil();
      };
    });
    const pj = zone.querySelector("#parjour");
    pj.onchange = () => { E.parJour = Math.max(0, Math.min(200, Math.round(+pj.value) || 0)); sauver(); accueil(); };
    zone.querySelector("#import").onchange = importer;
    clavier({});
  }

  function on(sel, f) { const el = zone.querySelector(sel); if (el) el.onclick = f; }

  async function copierBilan() {
    const t = Date.now(), texte = "[Chinois · page Sinogrammes]\n" + Hanzi.bilan(E, P, t);
    const z = zone.querySelector("#bilan-zone");
    try {
      await navigator.clipboard.writeText(texte);
      E.dernierBilan = t; sauver();
      z.innerHTML = `<p class="ok">Bilan copié. Collez-le dans la zone Consigne de la page Révisions.</p><textarea readonly></textarea>`;
    } catch (e) {
      z.innerHTML = `<p class="info">Copie automatique impossible : sélectionnez le texte, copiez-le, puis touchez « C'est copié ».</p>
        <textarea readonly></textarea><button id="copie">C'est copié</button>`;
      on("#copie", () => { E.dernierBilan = t; sauver(); accueil(); });
    }
    z.querySelector("textarea").value = texte;
  }

  function exporter() {
    const blob = new Blob([JSON.stringify(E)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sinogrammes-" + Profil.fichier() + "-" + SRS.jour(Date.now()) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function importer(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    f.text().then((txt) => {
      const v = JSON.parse(txt);
      if (!v.cartes || !v.journal) throw new Error("format");
      if (confirm("Remplacer la progression actuelle par cette sauvegarde ?")) {
        E = Object.assign(SRS.etatVide(), { types: Object.assign({}, TOUS) }, v); ORDRE = Hanzi.ordre(P, E.types); sauver(); accueil();
      }
    }).catch(() => alert("Ce fichier n'est pas une sauvegarde de la page Sinogrammes."));
  }

  /* ---------- Les mots : liste, fiche, écriture libre ---------- */

  function liste() {
    lacher();
    const point = (id) => {
      const c = E.cartes[id];
      return `<i class="pt ${c ? c.etat : "nouvelle"}" title="${Hanzi.TYPES[id[0]]}"></i>`;
    };
    let h = `<div class="haut"><button class="lien" id="quitter">← Accueil</button></div>
      <header><h1>Les mots</h1><p class="sous-titre">Touchez un mot pour voir l'ordre de ses traits et ses composants, et vous entraîner à l'écrire.</p></header>`;
    P.listes.forEach((l) => {
      h += `<section class="bloc"><h2>${l.titre}</h2><div class="mots">${l.mots.map((id) => {
        const m = P.mots[id];
        return `<button data-mot="${id}">${hz(m.hz)}<small lang="zh-Latn-pinyin">${py(m)}</small><small>${m.sens}</small>
          <span class="pts">${Object.keys(Hanzi.TYPES).filter((t) => t !== "o" || m.son).map((t) => point(t + "-" + id)).join("")}</span></button>`;
      }).join("")}</div></section>`;
    });
    h += `<p class="info legende-pts"><i class="pt nouvelle"></i> pas encore vue <i class="pt apprentissage"></i> en apprentissage <i class="pt revision"></i> en révision espacée
      (dans l'ordre : écriture, sens, lecture, écoute).</p>`;
    zone.innerHTML = h;
    on("#quitter", accueil);
    zone.querySelectorAll("[data-mot]").forEach((b) => { b.onclick = () => fiche(b.dataset.mot); });
    clavier({});
    window.scrollTo(0, 0);
  }

  function fiche(id) {
    lacher();
    const m = P.mots[id], chars = [...m.hz];
    let k = 0;
    zone.innerHTML = `<div class="haut"><button class="lien" id="quitter">← Les mots</button></div>
      <section class="carte">${htmlMot(id, false)}
      ${chars.length > 1 ? `<div class="onglets">${chars.map((c, i) => `<button data-k="${i}">${hz(c)}</button>`).join("")}</div>` : ""}
      <div class="ecrire">${GRILLE}<div class="hw"></div></div>
      <div class="actions"><button id="anim">▶ Ordre des traits</button><button class="principal" id="libre">✎ M'entraîner</button></div>
      <div id="compo"></div>
      ${m.son ? `<div class="prononcer"><h2>Prononcer</h2><p class="info">Dites le mot en vous enregistrant, puis comparez au modèle.</p>${Voix.html("▶ Modèle")}</div>` : ""}</section>`;
    let w = null;
    const montrer = (i) => {
      k = i;
      zone.querySelectorAll("[data-k]").forEach((b) => b.classList.toggle("actif", +b.dataset.k === k));
      zone.querySelector("#compo").innerHTML = htmlComposants(chars[k]);
      w = traceur(chars[k], { showCharacter: true, showOutline: true, radicalColor: couleurs().highlightColor });
      w.animateCharacter();
    };
    zone.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => montrer(+b.dataset.k); });
    on("#anim", () => w && w.animateCharacter());
    on("#libre", () => libre(id, k));
    on("#quitter", liste);
    brancherSons();
    if (m.son) brancherVoix(id);
    jouer(id);
    montrer(0);
    clavier({ " ": () => w && w.animateCharacter(), r: () => voix && voix.rec() });
  }

  // Écriture libre, sans note : avec ou sans modèle, autant de fois qu'on veut
  function libre(id, k) {
    lacher();
    const m = P.mots[id], chars = [...m.hz];
    let modele = true, w = null;
    zone.innerHTML = `<div class="haut"><button class="lien" id="quitter">← Fiche</button><span class="compteur">entraînement libre</span></div>
      <section class="carte"><p class="py centre" lang="zh-Latn-pinyin">${py(m)} ${bSon(id)}</p><p class="sens centre">${m.sens}</p>
      ${chars.length > 1 ? `<div class="onglets">${chars.map((c, i) => `<button data-k="${i}">${hz(c)}</button>`).join("")}</div>` : ""}
      <div class="ecrire">${GRILLE}<div class="hw"></div></div>
      <p class="info centre" id="etat"></p>
      <div class="actions"><button id="modele"></button><button id="encore">↺ Recommencer</button></div></section>`;
    const lancer = () => {
      zone.querySelectorAll("[data-k]").forEach((b) => b.classList.toggle("actif", +b.dataset.k === k));
      zone.querySelector("#modele").textContent = modele ? "Sans modèle" : "Avec modèle";
      zone.querySelector("#etat").textContent = "";
      w = traceur(chars[k], { showOutline: modele, showHintAfterMisses: modele ? 1 : 3 });
      w.quiz({
        onComplete: (r) => {
          zone.querySelector("#etat").textContent = r.totalMistakes ? `${r.totalMistakes} trait${r.totalMistakes > 1 ? "s" : ""} refusé${r.totalMistakes > 1 ? "s" : ""}.` : "Sans faute.";
          if (k + 1 < chars.length) setTimeout(() => { k++; lancer(); }, 700);
        },
      });
    };
    zone.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => { k = +b.dataset.k; lancer(); }; });
    on("#modele", () => { modele = !modele; lancer(); });
    on("#encore", lancer);
    on("#quitter", () => fiche(id));
    brancherSons();
    lancer();
    clavier({});
  }

  /* ---------- Séance ---------- */

  let S = null; // séance : { rang, derniere, faites }

  function seance() {
    S = { rang: 0, derniere: null, faites: 0 };
    suivante();
  }

  function suivante() {
    lacher();
    const t = Date.now(), p = SRS.prochaine(vue(), ORDRE, t, S.derniere, S.rang);
    if (!p) return fin();
    S.derniere = p.id;
    const id = p.id.slice(2);
    const ctx = { id: p.id, mot: id, m: P.mots[id], nouvelle: !E.cartes[p.id] };
    ({ e: ecriture, s: sens, l: lecture, o: ecoute })[p.id[0]](ctx);
    window.scrollTo(0, 0);
  }

  function entete(ctx) {
    const c = SRS.compter(vue(), ORDRE, Date.now());
    const liste = P.listes.find((l) => l.id === ctx.m.liste);
    return `<div class="haut"><button class="lien" id="quitter">✕ Quitter</button>
      <span class="compteur" title="à réviser · nouvelles">${c.dues} · ${c.nouvelles}</span></div>
      <p class="groupe">${Hanzi.TYPES[ctx.id[0]]} · ${liste.titre.split(" · ")[0]}${ctx.nouvelle ? ' <span class="pastille">nouvelle</span>' : ""}</p>`;
  }

  function noter(ctx, note, extra) {
    if (voix && voix.enregistre()) extra = Object.assign({}, extra, { voix: true });
    SRS.repondre(E, ctx.id, note, Date.now(), extra);
    sauver();
    S.rang++; S.faites++;
    suivante();
  }

  // Boutons de note ; « propose » : la note suggérée, mise en avant
  function htmlNotes(ctx, propose) {
    const t = Date.now(), carte = E.cartes[ctx.id];
    return `<div class="notes">${[1, 2, 3, 4].map((n) =>
      `<button data-note="${n}" class="note n${n}${n === propose ? " propose" : ""}">${SRS.NOTES[n]}<small>${SRS.delai(carte, n, t)}</small></button>`).join("")}</div>`;
  }
  function brancherNotes(ctx, extra) {
    zone.querySelectorAll("[data-note]").forEach((b) => { b.onclick = () => noter(ctx, +b.dataset.note, extra); });
  }
  const touchesNotes = (n) => { const b = zone.querySelector(`[data-note="${n}"]`); if (b) b.click(); };

  /* Écriture : le sens et le pinyin sont donnés, j'écris chaque caractère trait par trait */
  function ecriture(ctx) {
    const m = ctx.m, chars = [...m.hz];
    const fautes = chars.map(() => 0), aides = chars.map(() => 0);
    let k = 0, w = null, trait = 0, fini = false;
    zone.innerHTML = entete(ctx) + `<section class="carte">
      <p class="consigne">${ctx.nouvelle ? "Nouveau mot : regardez l'ordre des traits, puis repassez sur le modèle." : "Écrivez ce mot, trait par trait."}</p>
      <div id="invite"><p class="sens centre">${m.sens}</p><p class="py centre" lang="zh-Latn-pinyin">${py(m)} ${bSon(ctx.mot)}</p></div>
      <div class="cases">${chars.map((c, i) => `<span data-case="${i}" lang="zh-Hans"></span>`).join("")}</div>
      <div class="ecrire">${GRILLE}<div class="hw"></div></div>
      <div class="actions" id="aides">${ctx.nouvelle
        ? `<button id="revoir">▶ Revoir l'ordre des traits</button>`
        : `<button id="memo">Aide-mémoire</button><button id="indice">Trait suivant</button><button id="montrer">Je ne sais pas</button>`}</div>
      <div id="compo"></div><div id="suite"></div></section>`;
    on("#quitter", accueil);
    brancherSons();

    const cases = () => zone.querySelectorAll("[data-case]").forEach((s, i) => {
      s.textContent = i < k ? chars[i] : "";
      s.className = i === k && !fini ? "courante" : i < k ? (fautes[i] || aides[i] ? "faite reprise" : "faite") : "";
    });

    // Quiz du caractère k ; avecModele : contour visible et indice dès la première faute
    function quiz(avecModele) {
      trait = 0;
      w.quiz({
        showHintAfterMisses: avecModele ? 1 : 3,
        onMistake: () => { fautes[k]++; },
        onCorrectStroke: (d) => { trait = d.strokeNum + 1; },
        onComplete: () => { k++; cases(); setTimeout(k < chars.length ? caractere : resultat, 450); },
      });
    }

    function caractere() {
      cases();
      zone.querySelector("#compo").innerHTML = ctx.nouvelle ? htmlComposants(chars[k]) : "";
      w = traceur(chars[k], { showOutline: ctx.nouvelle });
      if (ctx.nouvelle) w.animateCharacter({ onComplete: () => quiz(true) });
      else quiz(false);
    }

    on("#revoir", () => { if (w) w.animateCharacter({ onComplete: () => quiz(true) }); });
    on("#memo", () => {
      aides[k] = Math.max(aides[k], 1);
      zone.querySelector("#compo").innerHTML = htmlIndice(chars[k]);
    });
    on("#indice", () => {
      if (!w) return;
      aides[k] = Math.max(aides[k], 1);
      w.highlightStroke(trait);
    });
    on("#montrer", () => {
      if (!w) return;
      aides[k] = 2;
      w.showOutline();
      w.animateCharacter({ onComplete: () => quiz(true) });
    });

    function resultat() {
      fini = true;
      cases();
      zone.querySelector("#aides").remove();
      zone.querySelector("#invite").remove();
      zone.querySelector(".ecrire").remove();
      zone.querySelector("#compo").innerHTML = "";
      const propose = Hanzi.noteEcriture(fautes, aides, ctx.nouvelle);
      const detail = chars.map((c, i) => `${hz(c)} ${aides[i] === 2 ? "montré" : fautes[i] ? `${fautes[i]} trait${fautes[i] > 1 ? "s" : ""} refusé${fautes[i] > 1 ? "s" : ""}` : "sans faute"}${aides[i] === 1 ? ", avec indice" : ""}`);
      zone.querySelector("#suite").innerHTML = `${htmlMot(ctx.mot, true)}
        <p class="info centre">${ctx.nouvelle ? "Tracé sur le modèle." : detail.join(" · ")}</p>${htmlNotes(ctx, propose)}`;
      brancherSons();
      brancherNotes(ctx, { f: fautes, a: aides, nouv: ctx.nouvelle || undefined });
      jouer(ctx.mot);
      clavier({ " ": () => jouer(ctx.mot), note: touchesNotes });
    }

    caractere();
    clavier({ " ": () => jouer(ctx.mot) });
  }

  // Cartes à réponse cachée (sens, écoute) : « Voir la réponse », puis le mot entier et la note
  function reveler(ctx) {
    const go = zone.querySelector("#voir");
    let extra;
    on("#memo", () => {
      extra = { indice: true };
      zone.querySelector("#memo").outerHTML = `<div class="memo">${[...new Set(ctx.m.hz)].map(htmlIndice).join("")}</div>`;
    });
    const voir = () => {
      go.remove();
      const q = zone.querySelector(".question");
      if (q) q.remove();
      zone.querySelector("#suite").innerHTML = htmlMot(ctx.mot, true) + htmlNotes(ctx);
      const memo = zone.querySelector(".memo");
      if (memo) memo.remove();
      brancherSons();
      brancherNotes(ctx, extra);
      jouer(ctx.mot);
      clavier({ " ": () => jouer(ctx.mot), note: touchesNotes });
    };
    go.onclick = voir;
    return voir;
  }

  /* Sens : je vois les caractères, je retrouve le sens */
  function sens(ctx) {
    zone.innerHTML = entete(ctx) + `<section class="carte">
      <p class="consigne">Que veut dire ce mot ?</p>
      <div class="question">${hz(ctx.m.hz, "grand")}</div>
      <button class="plein" id="memo">Aide-mémoire</button>
      <button class="principal plein" id="voir">Voir la réponse</button><div id="suite"></div></section>`;
    on("#quitter", accueil);
    const voir = reveler(ctx);
    clavier({ " ": voir });
  }

  /* Écoute : j'entends le mot, je retrouve le sens */
  function ecoute(ctx) {
    zone.innerHTML = entete(ctx) + `<section class="carte">
      <p class="consigne">Écoutez : que veut dire ce mot ?</p>
      <button class="ecoute" id="ecoute" aria-label="Réécouter">▶</button>
      <button class="principal plein" id="voir">Voir la réponse</button><div id="suite"></div></section>`;
    on("#quitter", accueil);
    on("#ecoute", () => jouer(ctx.mot));
    const voir = reveler(ctx);
    jouer(ctx.mot);
    clavier({ " ": voir });
  }

  /* Lecture : je vois les caractères, je dis le mot, je donne ses tons */
  function lecture(ctx) {
    const m = ctx.m, chars = [...m.hz];
    const choix = chars.map(() => 0);
    const ETIQ = { 1: "ā", 2: "á", 3: "ǎ", 4: "à", 5: "a" };
    const parle = m.son && !silence; // je m'enregistre, puis je compare au modèle une fois les tons corrigés
    zone.innerHTML = entete(ctx) + `<section class="carte">
      <p class="consigne">${silence ? "Dites ce mot dans votre tête" : parle ? "Dites ce mot à voix haute en vous enregistrant (si vous voulez)" : "Dites ce mot à voix haute"},
        puis touchez le ton de chaque syllabe, tel que l'écrit le dictionnaire.</p>
      <div class="question">${hz(m.hz, "grand")}</div>
      ${parle ? `<div class="prononcer">${Voix.html("▶ Modèle")}</div>` : ""}
      <p class="centre" id="bascule"><button class="lien" id="silence">${silence ? "🔊 Je peux de nouveau parler à voix haute" : "🔇 Je ne peux pas parler ici"}</button></p>
      <div class="tons">${chars.map((c, i) => `<div class="ligne-ton">${hz(c)}${[1, 2, 3, 4, 5].map((n) =>
        `<button data-s="${i}" data-ton="${n}" aria-label="${Hanzi.TONS[n]}"><b>${ETIQ[n]}</b><small>${n === 5 ? "neutre" : n}</small></button>`).join("")}</div>`).join("")}</div>
      <div id="suite"></div></section>`;
    on("#quitter", accueil);
    // Bascule valable pour toutes les cartes, jusqu'à la fermeture de la page
    on("#silence", () => { silence = !silence; lacher(); lecture(ctx); });
    if (parle) brancherVoix(ctx.mot, { cache: true, sansMicro: " : dites le mot dans votre tête." });

    function choisir(i, n) {
      if (choix.every(Boolean)) return;
      choix[i] = n;
      zone.querySelectorAll(`[data-s="${i}"]`).forEach((b) => b.classList.toggle("choisi", +b.dataset.ton === n));
      if (choix.every(Boolean)) corriger();
    }
    zone.querySelectorAll("[data-ton]").forEach((b) => { b.onclick = () => choisir(+b.dataset.s, +b.dataset.ton); });

    function corriger() {
      const justes = m.py.map((s, i) => Hanzi.ton(s) === choix[i]);
      const ok = justes.every(Boolean);
      zone.querySelectorAll("[data-ton]").forEach((b) => {
        const i = +b.dataset.s, n = +b.dataset.ton;
        b.disabled = true;
        if (n === Hanzi.ton(m.py[i])) b.classList.add("juste");
        else if (n === choix[i]) b.classList.add("faux");
      });
      const extra = { tons: choix.slice(), ok: ok, silence: silence || undefined };
      zone.querySelector(".question").remove();
      zone.querySelector("#bascule").remove();
      const notes = (propose) => `<p class="info">${ok && !silence ? "Tons justes. Et la prononciation, comparée au modèle ?" : "Notez-vous :"}</p>${htmlNotes(ctx, propose)}`;
      zone.querySelector("#suite").innerHTML = htmlMot(ctx.mot, true) + (ok
        ? notes()
        : `<p class="ko">Ton faux : ${m.py.map((s, i) => justes[i] ? null : `${hz(chars[i])} ${SRS.marque(s)}, ${Hanzi.TONS[Hanzi.ton(s)]}`).filter(Boolean).join(" ; ")}.</p>
          <button class="note n1 plein" id="revoir">À revoir<small>${SRS.delai(E.cartes[ctx.id], 1, Date.now())}</small></button>
          <p class="centre"><button class="lien" id="mal">J'avais juste : j'ai mal touché</button></p>`);
      brancherSons();
      if (ok) brancherNotes(ctx, extra);
      on("#revoir", () => noter(ctx, 1, extra));
      on("#mal", () => {
        zone.querySelector("#revoir").remove();
        zone.querySelector("#mal").parentElement.outerHTML = notes();
        brancherNotes(ctx, Object.assign(extra, { malTouche: true }));
        clavier({ " ": () => jouer(ctx.mot), note: touchesNotes });
      });
      if (voix) voix.reveler(); else jouer(ctx.mot);
      clavier({ " ": () => jouer(ctx.mot), note: ok ? touchesNotes : (n) => { if (n === 1) noter(ctx, 1, extra); } });
    }

    // Clavier : 1 à 5 donnent le ton de la première syllabe sans choix
    clavier({ note: (n) => { const i = choix.indexOf(0); if (i >= 0) choisir(i, n); }, 5: () => { const i = choix.indexOf(0); if (i >= 0) choisir(i, 5); },
      r: () => voix && voix.rec() });
  }

  function fin() {
    lacher();
    const c = SRS.compter(vue(), ORDRE, Date.now());
    let h = `<section class="carte fin"><h2>Séance terminée</h2><p>${S.faites} carte${S.faites > 1 ? "s" : ""} dans cette séance.</p>`;
    if (c.restantes) h += `<button class="principal" id="encore">Encore 10 nouvelles cartes</button>`;
    h += `<button id="retour">Retour à l'accueil</button></section>`;
    zone.innerHTML = h;
    on("#encore", () => { SRS.encoreDix(E, Date.now()); sauver(); suivante(); });
    on("#retour", accueil);
    clavier({});
  }

  /* ---------- Outils ---------- */

  let toucheActive = {};
  function clavier(t) { toucheActive = t; }
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (toucheActive[k]) { e.preventDefault(); toucheActive[k](); }
    else if (/^[1-4]$/.test(k) && toucheActive.note) { e.preventDefault(); toucheActive.note(+k); }
  });

  // Nouvelle version de la page installée en arrière-plan : on recharge, mais jamais au milieu d'une carte
  let aRecharger = false;
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const avait = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!avait) return;
      if (zone.querySelector(".tableau")) location.reload(); else aRecharger = true;
    });
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // Lien direct : …/chinois/hanzi/#mots
  if (location.hash === "#mots") liste(); else accueil();
})();
