// Profils : plusieurs élèves sur un même appareil, chacun avec sa progression. Rien ne quitte le navigateur.
// Bastien garde les clés d'origine (pinyin-v1, hanzi-v1) ; un autre profil a les siennes (pinyin-v1@<id>).
// Barre du site (les deux sections et le profil), commune à la page Pinyin et à la page Sinogrammes.
"use strict";

const Profil = (() => {
  const CLE = "chinois-profils";
  const PROPRIO = { id: "bastien", nom: "Bastien" };
  const BASES = ["pinyin-v1", "hanzi-v1"];

  // Registre : { liste: [{ id, nom, cree }], actif: id } ; la liste ne contient pas Bastien, toujours présent
  function lire() {
    try {
      const r = JSON.parse(localStorage.getItem(CLE));
      if (r && Array.isArray(r.liste)) return r;
    } catch (e) { /* stockage indisponible ou abîmé */ }
    // Personne n'est choisi d'office : tout nouvel arrivant voit « Qui s'entraîne ? ».
    // La progression d'avant les profils reste sous les clés de Bastien, retrouvée en touchant son prénom.
    return { liste: [], actif: null };
  }
  function ecrire(r) {
    try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) { /* le profil vaudra pour cette visite */ }
  }

  const tous = () => [PROPRIO].concat(lire().liste);
  function actif() {
    const r = lire();
    return tous().find((p) => p.id === r.actif) || null;
  }
  const proprio = () => { const p = actif(); return !!p && p.id === PROPRIO.id; };
  function cle(base, p) {
    p = p || actif();
    return !p || p.id === PROPRIO.id ? base : base + "@" + p.id;
  }

  function choisir(id) { const r = lire(); r.actif = id; ecrire(r); }

  // « Élodie » et « elodie » sont le même élève ; « Bastien » est le profil d'origine
  const forme = (nom) => nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function creer(nom) {
    nom = nom.replace(/\s+/g, " ").trim().slice(0, 30);
    if (!nom) return null;
    const r = lire(), deja = tous().find((p) => forme(p.nom) === forme(nom));
    const p = deja || { id: "p" + Date.now().toString(36), nom: nom, cree: Date.now() };
    if (!deja) r.liste.push(p);
    r.actif = p.id;
    ecrire(r);
    return p;
  }

  function supprimer(id) {
    if (id === PROPRIO.id) return;
    const r = lire(), p = r.liste.find((x) => x.id === id);
    if (!p) return;
    try { BASES.forEach((b) => localStorage.removeItem(cle(b, p))); } catch (e) { /* rien à effacer */ }
    r.liste = r.liste.filter((x) => x.id !== id);
    if (r.actif === id) r.actif = null;
    ecrire(r);
  }

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Nom du profil dans un nom de fichier de sauvegarde
  const fichier = () => forme(actif().nom).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profil";

  // Cartes dues d'une section, lues dans le stockage (cartes désactivées exclues, pour Sinogrammes)
  function dues(base) {
    try {
      const e = JSON.parse(localStorage.getItem(cle(base)));
      if (!e || !e.cartes) return 0;
      const t = Date.now();
      return Object.entries(e.cartes).filter(([id, c]) => (!e.types || e.types[id[0]]) && c.etat !== "nouvelle" && c.due <= t).length;
    } catch (e) { return 0; }
  }

  // Explication des intervalles, commune aux deux pages (« Comment ça marche »)
  const htmlFrequence = () => `<p><b>Quand une carte revient</b>. Le temps affiché sous chaque note est le délai avant de revoir la carte :
      on la revoit juste avant de risquer de l'oublier, et chaque réussite éloigne le passage suivant.</p>
      <p><i>Une carte nouvelle ou oubliée</i> est en apprentissage et passe par des étapes courtes : 1 min, puis 10 min, puis 1 jour.
      « Bien » avance d'une seule étape. « Facile » dit « je n'ai pas besoin de ces étapes » et saute directement à 4 jours.
      C'est pourquoi on peut lire « Bien 10 min » à côté de « Facile 4 j ».</p>
      <p><i>Une carte déjà installée</i> voit son délai multiplié à chaque réussite : environ ×1,2 avec « Difficile », ×2,5 avec « Bien », ×3 ou plus avec « Facile ».
      Après 4 jours : 5 j, 10 j ou 14 j. L'écart se creuse donc avec le temps.
      « À revoir » la ramène à 10 min, puis le délai repart de la moitié de ce qu'il était.</p>
      <p>Ces multiplicateurs s'ajustent à chaque carte : celles souvent difficiles reviennent plus vite. Une carte n'arrive jamais toute seule :
      elle attend votre prochaine séance, et un jour commence à 4 h du matin.</p>
      <p><b>Revenir en arrière</b>. Pendant une séance, « ← Précédente » rouvre vos réponses, puis « Suivante → » ramène à la carte en cours.
      Vous pouvez y changer la note, tant que la carte n'a pas été revue depuis, et réessayer librement : cet essai ne compte pas.
      Cet historique s'efface quand vous quittez la séance.</p>`;

  // Barre du site ; ici : « pinyin » ou « hanzi » ; racine : chemin de la page Pinyin depuis la page courante
  function barre(ici, racine) {
    const onglet = (id, href, nom, base) => {
      const n = dues(base);
      return `<a href="${href}"${id === ici ? ' class="actif" aria-current="page"' : ""}>${nom}${n ? ` <span class="badge" title="à réviser">${n}</span>` : ""}</a>`;
    };
    return `<div class="profil-ligne"><span>${esc(actif().nom)}</span><button class="lien" id="profil">Changer de profil</button></div>
      <nav class="site" aria-label="Sections">${onglet("pinyin", racine || "./", "Prononciation", "pinyin-v1")}${onglet("hanzi", racine + "hanzi/", "Caractères", "hanzi-v1")}</nav>`;
  }

  // Écran « Qui s'entraîne ? ». retour : revenir à l'écran précédent sans changer de profil (absent au premier passage)
  function ecran(zone, retour) {
    const r = lire(), autres = r.liste;
    let h = retour ? `<div class="haut"><button class="lien" id="retour">← Retour</button></div>` : "";
    h += `<header><p class="kicker">Chinois · prononciation et caractères</p><h1>Qui s'entraîne ?</h1>
      <p class="sous-titre">Chacun a sa progression et avance à son rythme.</p></header>
      <p class="stockage"><b>Votre progression est enregistrée sur cet appareil, pas sur le site.</b>
      Il n'y a ni compte ni mot de passe, et rien n'est envoyé. Sur un autre appareil ou un autre navigateur, vous ne la retrouverez pas,
      sauf en y restaurant une sauvegarde (Réglages). Effacer les données du navigateur l'efface aussi.
      Toute personne qui utilise cet appareil peut ouvrir les profils ci-dessous.</p>
      <div class="profils">${tous().map((p) => `<button data-profil="${p.id}"${p.id === r.actif ? ' class="actif"' : ""}>${esc(p.nom)}${p.id === r.actif ? "<small>profil actuel</small>" : ""}</button>`).join("")}</div>
      <section class="bloc"><h2>Première fois ?</h2>
      <form id="nouveau"><label for="nom">Votre prénom</label>
      <div class="nouveau"><input id="nom" type="text" autocomplete="given-name" autocapitalize="words" maxlength="30" required>
      <button class="principal">Commencer</button></div></form>
      <p class="info">Vous partez de zéro : les sons du pinyin, puis les mots du cours, au rythme des révisions.</p></section>`;
    if (autres.length) h += `<details class="bloc"><summary>Retirer un profil de cet appareil</summary>
      <p class="info">Le profil et toute sa progression sont effacés.</p>
      <div class="profils">${autres.map((p) => `<button class="danger" data-retirer="${p.id}">Retirer ${esc(p.nom)}</button>`).join("")}</div></details>`;
    zone.innerHTML = h;
    window.scrollTo(0, 0);

    // Le profil change : la page repart, avec la progression du nouveau profil
    const recharger = () => { location.href = location.pathname; };
    const bRetour = zone.querySelector("#retour");
    if (bRetour) bRetour.onclick = retour;
    zone.querySelectorAll("[data-profil]").forEach((b) => {
      b.onclick = () => {
        if (b.dataset.profil === r.actif && retour) return retour();
        choisir(b.dataset.profil); recharger();
      };
    });
    zone.querySelector("#nouveau").onsubmit = (ev) => {
      ev.preventDefault();
      if (creer(zone.querySelector("#nom").value)) recharger();
    };
    zone.querySelectorAll("[data-retirer]").forEach((b) => {
      b.onclick = () => {
        const p = autres.find((x) => x.id === b.dataset.retirer);
        if (!confirm(`Retirer ${p.nom} de cet appareil ? Sa progression sera effacée.`)) return;
        const etait = r.actif === p.id;
        supprimer(p.id);
        if (etait) recharger(); else ecran(zone, retour);
      };
    });
  }

  return { actif, proprio, cle, choisir, creer, supprimer, barre, ecran, esc, fichier, htmlFrequence };
})();

if (typeof module !== "undefined") module.exports = Profil;
