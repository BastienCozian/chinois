// Profils : plusieurs élèves sur un même appareil, chacun avec sa progression. Rien ne quitte le navigateur.
// Bastien garde les clés d'origine (pinyin-v1, hanzi-v1) ; un autre profil a les siennes (pinyin-v1@<id>).
// Barre du site (les deux sections, le lien vers les leçons de cours/ et le profil), commune à la page Pinyin et à la page Sinogrammes.
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

  /* ---------- Le site comme une application, sur l'écran d'accueil ---------- */

  // Ouvert depuis son icône : navigator.standalone sur iPhone, display-mode ailleurs
  const enAppli = () => navigator.standalone === true ||
    (!!window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  const surIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1); // iPad en mode « ordinateur »
  const surAndroid = () => /Android/.test(navigator.userAgent);

  // Chrome (Android) offre sa propre fenêtre d'installation : on la garde pour le bouton « Installer l'application »
  let invite = null;
  const montrerBouton = (oui) => document.querySelectorAll("button.installer").forEach((b) => { b.hidden = !oui; });
  window.addEventListener("beforeinstallprompt", (ev) => { invite = ev; montrerBouton(true); });
  window.addEventListener("appinstalled", () => { invite = null; montrerBouton(false); });
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest("button.installer");
    if (!b || !invite) return;
    try { invite.prompt(); } catch (e) { /* le menu du navigateur reste possible */ }
    invite = null; montrerBouton(false);
  });

  const ETAPES_IOS = `<ol>
      <li>Ouvrez le site dans <b>Safari</b>.</li>
      <li>Touchez le bouton <b>Partager</b> : un carré d'où sort une flèche vers le haut.
        Sur les iPhone récents, il est dans le menu <b>⋯</b>, en bas à droite.</li>
      <li>Touchez <b>« Sur l'écran d'accueil »</b> (au besoin, faites défiler la liste ou touchez « Afficher plus »), puis <b>« Ajouter »</b>.</li>
      <li>Ouvrez désormais le site depuis l'icône <b>Chinois</b>.</li></ol>
      <p class="info">L'icône garde mieux votre progression : Safari efface celle d'un site qu'on n'a pas ouvert depuis 7 jours.
      Mais elle ne voit pas la progression faite dans Safari. Si vous avez déjà commencé dans Safari, ouvrez-y « Réglages et sauvegarde »,
      touchez « Sauvegarder la progression », puis, dans l'icône, « Restaurer une sauvegarde » ; à faire sur les deux pages, Prononciation et Caractères.</p>`;
  const ETAPES_ANDROID = `<ol>
      <li>Ouvrez le site dans <b>Chrome</b>.</li>
      <li>Touchez le menu <b>⋮</b>, en haut à droite, puis <b>« Ajouter à l'écran d'accueil »</b> ou <b>« Installer l'application »</b>, et confirmez avec « Installer ».</li>
      <li>Ouvrez désormais le site depuis l'icône <b>Chinois</b>.</li></ol>
      <p class="info">Samsung Internet : menu <b>≡</b>, en bas à droite, « Ajouter la page à », puis « Écran d'accueil ».
      Firefox : menu <b>⋮</b>, puis « Ajouter à l'écran d'accueil ». La progression est la même dans l'icône et dans le navigateur.</p>`;

  // Mode d'emploi, rien si le site est déjà ouvert depuis son icône. replie : tout le bloc dans un <details>
  function htmlAppli(replie) {
    if (enAppli()) return "";
    const ios = surIOS(), android = surAndroid();
    const corps = `<p>Mettez le site sur l'écran d'accueil de votre téléphone : il s'ouvre alors depuis son icône <b>Chinois</b>,
      en plein écran, comme une application, et les pages Prononciation et Caractères marchent même sans réseau.
      ${ios ? "<b>Sur iPhone, faites-le avant de commencer</b> : l'icône ne retrouve pas la progression faite dans Safari." : ""}</p>
      <button class="installer principal"${invite ? "" : " hidden"}>Installer l'application</button>
      <details${ios ? " open" : ""}><summary>Sur iPhone ou iPad</summary>${ETAPES_IOS}</details>
      <details${android ? " open" : ""}><summary>Sur Android</summary>${ETAPES_ANDROID}</details>`;
    return replie
      ? `<details class="bloc appli"><summary>Installer comme une application${ios ? " (conseillé)" : ""}</summary>${corps}</details>`
      : `<section class="bloc appli"><h2>Installer comme une application</h2>${corps}</section>`;
  }

  // Barre du site ; ici : « pinyin » ou « hanzi » ; racine : chemin de la page Pinyin depuis la page courante.
  // Deux onglets (les deux applis de cartes), puis un lien d'une autre allure vers les leçons, qui sont des pages à lire.
  function barre(ici, racine) {
    const onglet = (id, href, nom, base) => {
      const n = dues(base);
      return `<a href="${href}"${id === ici ? ' class="actif" aria-current="page"' : ""}>${nom}${n ? ` <span class="badge" title="à réviser">${n}</span>` : ""}</a>`;
    };
    return `<div class="profil-ligne"><span>${esc(actif().nom)}</span><button class="lien" id="profil">Changer de profil</button></div>
      <nav class="site" aria-label="Sections">${onglet("hanzi", racine + "hanzi/", "Caractères", "hanzi-v1")}${onglet("pinyin", racine || "./", "Prononciation", "pinyin-v1")}<a class="vers-lecons" href="${racine}cours/">Leçons <span aria-hidden="true">→</span></a></nav>`;
  }

  // Écran « Qui s'entraîne ? ». retour : revenir à l'écran précédent sans changer de profil (absent au premier passage)
  function ecran(zone, retour) {
    const r = lire(), autres = r.liste, mobile = surIOS() || surAndroid();
    let h = retour ? `<div class="haut"><button class="lien" id="retour">← Retour</button></div>` : "";
    h += `<header><p class="kicker">Chinois · prononciation et caractères</p><h1>Qui s'entraîne ?</h1>
      <p class="sous-titre">Chacun a sa progression et avance à son rythme.</p></header>
      <p class="stockage"><b>Votre progression est enregistrée sur cet appareil, pas sur le site.</b>
      Il n'y a ni compte ni mot de passe, et rien n'est envoyé. Sur un autre appareil ou un autre navigateur, vous ne la retrouverez pas,
      sauf en y restaurant une sauvegarde (Réglages). Effacer les données du navigateur l'efface aussi.
      Toute personne qui utilise cet appareil peut ouvrir les profils ci-dessous.</p>
      <div class="profils">${tous().map((p) => `<button data-profil="${p.id}"${p.id === r.actif ? ' class="actif"' : ""}>${esc(p.nom)}${p.id === r.actif ? "<small>profil actuel</small>" : ""}</button>`).join("")}</div>
      ${mobile ? htmlAppli(false) : ""}
      <section class="bloc"><h2>Première fois ?</h2>
      <form id="nouveau"><label for="nom">Votre prénom</label>
      <div class="nouveau"><input id="nom" type="text" autocomplete="given-name" autocapitalize="words" maxlength="30" required>
      <button class="principal">Commencer</button></div></form>
      <p class="info">Vous partez de zéro : les sons du pinyin, puis les mots du cours, au rythme des révisions.</p></section>`;
    if (!mobile) h += htmlAppli(true);
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

  return { actif, proprio, cle, choisir, creer, supprimer, barre, ecran, esc, fichier, htmlFrequence, htmlAppli };
})();

if (typeof module !== "undefined") module.exports = Profil;
