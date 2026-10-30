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
    // Premier passage après l'arrivée des profils : la progression déjà là est celle de Bastien
    let ancienne = false;
    try { ancienne = BASES.some((b) => localStorage.getItem(b) !== null); } catch (e) { /* idem */ }
    return { liste: [], actif: ancienne ? PROPRIO.id : null };
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
      <div class="profils">${tous().map((p) => `<button data-profil="${p.id}"${p.id === r.actif ? ' class="actif"' : ""}>${esc(p.nom)}${p.id === r.actif ? "<small>profil actuel</small>" : ""}</button>`).join("")}</div>
      <section class="bloc"><h2>Première fois ?</h2>
      <form id="nouveau"><label for="nom">Votre prénom</label>
      <div class="nouveau"><input id="nom" type="text" autocomplete="given-name" autocapitalize="words" maxlength="30" required>
      <button class="principal">Commencer</button></div></form>
      <p class="info">Vous partez de zéro : les sons du pinyin, puis les mots du cours, au rythme des révisions.
      Votre progression reste dans ce navigateur, rien n'est envoyé. Sur un autre appareil, elle ne vous suit pas :
      Réglages → « Sauvegarder la progression » permet de la transporter.</p></section>`;
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

  return { actif, proprio, cle, choisir, creer, supprimer, barre, ecran, esc, fichier };
})();

if (typeof module !== "undefined") module.exports = Profil;
