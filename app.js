// Page Pinyin : écrans, son, micro. La logique de révision est dans srs.js, la courbe de ton dans ton.js.
"use strict";

(() => {
  const CLE = "pinyin-v1";
  const ORDRE = PAQUET.ordre;
  const REVISIONS_URL = "https://claude.ai/artifact/WLAHNFeXYSz8xzBWGoF7x8";
  const DUREE_MAX = 3000; // un enregistrement s'arrête seul après 3 s
  const zone = document.getElementById("zone");
  const son = (s) => "audio/" + s + ".mp3";
  const M = SRS.marque;

  /* ---------- État, gardé dans le navigateur ---------- */

  let E = charger();
  let alerteStockage = false;

  function charger() {
    try {
      const v = localStorage.getItem(CLE);
      if (v) return Object.assign(SRS.etatVide(), JSON.parse(v));
    } catch (e) { /* stockage indisponible : on repart d'un état vide */ }
    return SRS.etatVide();
  }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(E)); alerteStockage = false; }
    catch (e) { alerteStockage = true; }
  }
  // Demande au navigateur de ne pas effacer ce stockage (Safari peut l'effacer après 7 jours sans visite)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  /* ---------- Son ---------- */

  const lecteur = new Audio();
  let finLecture = null;
  function jouer(src) {
    if (finLecture) finLecture();
    return new Promise((ok) => {
      finLecture = ok;
      lecteur.onended = lecteur.onerror = () => { finLecture = null; ok(); };
      lecteur.src = src;
      const p = lecteur.play();
      if (p) p.catch(() => { finLecture = null; ok(); });
    });
  }

  /* ---------- Micro : ouvert pour chaque enregistrement, refermé aussitôt
     (micro ouvert, l'iPhone baisse le son ou le bascule sur l'écouteur) ---------- */

  const Micro = {
    rec: null, minuteur: null, refuse: false,
    dispo() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) && !this.refuse; },
    async enregistrer(surDebut) {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      const morceaux = [];
      this.rec = rec;
      return new Promise((ok) => {
        rec.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
        rec.onstop = () => {
          clearTimeout(this.minuteur);
          flux.getTracks().forEach((t) => t.stop());
          this.rec = null;
          ok(new Blob(morceaux, { type: rec.mimeType || type || "audio/mp4" }));
        };
        rec.start();
        surDebut();
        this.minuteur = setTimeout(() => this.arreter(), DUREE_MAX);
      });
    },
    arreter() { if (this.rec && this.rec.state === "recording") this.rec.stop(); },
  };

  /* ---------- Accueil ---------- */

  function accueil() {
    Micro.arreter();
    const t = Date.now(), c = SRS.compter(E, ORDRE, t);
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;
    let h = `<header><p class="kicker">Chinois · prononciation</p><h1>Pinyin</h1>
      <p class="sous-titre">Les contrastes à risque, avec la voix de Chen Wang.</p></header>`;
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
    if (ios) h += `<p class="info">Pour garder votre progression : Partager → « Sur l'écran d'accueil », puis ouvrez la page depuis son icône.</p>`;

    h += `<section class="bloc"><h2>Bilan pour l'Agent Teach</h2>
      <p class="info">Dernier bilan copié : ${E.dernierBilan ? SRS.date(E.dernierBilan, true) : "jamais"}.
      Copiez-le quand vous voulez, puis collez-le dans « ✎ Consigne pour l'Agent Teach » en bas de la
      <a href="${REVISIONS_URL}" target="_blank" rel="noopener">page Révisions</a>, formation Chinois.</p>
      <button id="bilan">Copier le bilan</button><div id="bilan-zone"></div></section>`;

    h += `<details class="bloc"><summary>Comment ça marche</summary>
      <p><b>Production</b> (une syllabe écrite). Carte nouvelle : écoutez le modèle, puis enregistrez-vous et comparez.
      Carte déjà vue : dites-la d'abord, sans aide, puis comparez au modèle. Notez-vous honnêtement :
      « À revoir » si un natif aurait compris une autre syllabe.</p>
      <p><b>Perception</b> (un son). Choisissez la syllabe entendue, puis dites si vous étiez sûr. Une erreur commise avec assurance est le signal le plus utile du bilan.</p>
      <p><b>La courbe</b> : la hauteur de la voix, en demi-tons autour de votre hauteur moyenne (bleu : modèle, rouge : vous).
      Elle montre la forme du ton, pas sa hauteur absolue, et ne dit rien des consonnes ni des voyelles.</p>
      <p>Vos enregistrements ne sont jamais gardés : chacun disparaît à la carte suivante.</p>
      <p>Clavier sur PC : espace pour réécouter, R pour s'enregistrer, 1 à 4 pour répondre.</p></details>`;

    h += `<details class="bloc"><summary>Réglages et sauvegarde</summary>
      <p><label>Nouvelles cartes par jour <input id="parjour" type="number" min="0" max="130" value="${E.parJour}"></label></p>
      <p class="info">La progression ne vit que dans ce navigateur. Une sauvegarde de temps en temps la protège.</p>
      <p><button id="export">Sauvegarder la progression</button>
      <label class="bouton">Restaurer une sauvegarde<input id="import" type="file" accept="application/json" hidden></label></p>
      <p><button class="danger" id="zero">Tout remettre à zéro</button></p></details>`;

    h += `<footer><p>Sons : syllabes enregistrées par Chen Wang, projet <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noopener">audio-cmn</a>
      (Hugo Lopez, Inalco), licence <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener">CC BY-SA</a>.
      Une question sur un son, une règle ? Demandez à l'Agent Teach.</p></footer>`;
    zone.innerHTML = h;

    on("#go", () => seance());
    on("#encore", () => { SRS.encoreDix(E, Date.now()); sauver(); seance(); });
    on("#bilan", copierBilan);
    on("#export", exporter);
    on("#zero", () => {
      if (confirm("Effacer toute la progression ? Pensez d'abord à copier le bilan.")) { E = SRS.etatVide(); sauver(); accueil(); }
    });
    const pj = zone.querySelector("#parjour");
    pj.onchange = () => { E.parJour = Math.max(0, Math.min(130, Math.round(+pj.value) || 0)); sauver(); accueil(); };
    zone.querySelector("#import").onchange = importer;
  }

  function on(sel, f) { const el = zone.querySelector(sel); if (el) el.onclick = f; }

  async function copierBilan() {
    const t = Date.now(), texte = "[Chinois · page Pinyin]\n" + SRS.bilan(E, PAQUET, ORDRE, t);
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
    a.download = "pinyin-progression-" + SRS.jour(Date.now()) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function importer(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    f.text().then((txt) => {
      const v = JSON.parse(txt);
      if (!v.cartes || !v.journal) throw new Error("format");
      if (confirm("Remplacer la progression actuelle par cette sauvegarde ?")) { E = Object.assign(SRS.etatVide(), v); sauver(); accueil(); }
    }).catch(() => alert("Ce fichier n'est pas une sauvegarde de la page Pinyin."));
  }

  /* ---------- Séance ---------- */

  let S = null; // séance : { rang, derniere, faites }

  function seance() {
    Ton.contexte(); // créé pendant un geste : Safari l'exige
    S = { rang: 0, derniere: null, faites: 0 };
    suivante();
  }

  function suivante() {
    const t = Date.now(), p = SRS.prochaine(E, ORDRE, t, S.derniere, S.rang);
    if (!p) return fin();
    S.derniere = p.id;
    const cible = p.id.slice(2), info = PAQUET.cibles[cible];
    const groupe = PAQUET.groupes.find((g) => g.id === info.groupe);
    const contraste = groupe.contrastes.find((c) => c.id === info.contraste);
    const ctx = { id: p.id, cible, info, nouvelle: !E.cartes[p.id], titre: groupe.titre.split(" :")[0] + " · " + contraste.libelle };
    if (p.id.startsWith("p-")) production(ctx); else perception(ctx);
  }

  function entete(ctx) {
    const c = SRS.compter(E, ORDRE, Date.now());
    return `<div class="haut"><button class="lien" id="quitter">✕ Quitter</button>
      <span class="compteur" title="à réviser · nouvelles">${c.dues} · ${c.nouvelles}</span></div>
      <p class="groupe">${ctx.titre}${ctx.nouvelle ? ' <span class="pastille">nouvelle</span>' : ""}</p>`;
  }

  function noter(ctx, note, extra) {
    SRS.repondre(E, ctx.id, note, Date.now(), extra);
    sauver();
    S.rang++; S.faites++;
    suivante();
  }

  function boutonsNotes(ctx) {
    const t = Date.now(), carte = E.cartes[ctx.id];
    return `<div class="notes">${[1, 2, 3, 4].map((n) =>
      `<button data-note="${n}" class="note n${n}">${SRS.NOTES[n]}<small>${SRS.delai(carte, n, t)}</small></button>`).join("")}</div>`;
  }

  /* Production : je lis, je dis, je compare */
  function production(ctx) {
    const s = ctx.cible;
    let blob = null, urlMoi = null, courbeModele = null, courbeMoi = null, noteVisible = false;
    zone.innerHTML = entete(ctx) + `<section class="carte">
      <p class="consigne">${ctx.nouvelle ? "Nouvelle syllabe : écoutez, puis répétez en vous enregistrant." : "Dites-la d'abord, sans aide, puis comparez au modèle."}</p>
      <div class="syllabe" lang="zh-Latn-pinyin">${M(s)}</div>
      <div class="actions">
        <button class="principal" id="rec">● M'enregistrer</button>
        <button id="modele">${ctx.nouvelle ? "▶ Modèle" : "▶ Écouter d'abord"}</button>
        <button id="moi" hidden>▶ Moi</button>
      </div>
      <p class="info" id="etat-micro"></p>
      <div class="courbe-boite" hidden><canvas class="courbe"></canvas>
        <p class="legende"><span class="l-modele">— modèle</span> <span class="l-moi">— vous</span> <span class="l-info">demi-tons autour de la hauteur moyenne</span></p></div>
      <div id="notes"></div></section>`;
    on("#quitter", accueil);
    const btnRec = zone.querySelector("#rec"), btnMoi = zone.querySelector("#moi"), btnModele = zone.querySelector("#modele");
    const etat = zone.querySelector("#etat-micro"), boite = zone.querySelector(".courbe-boite");
    const canvas = zone.querySelector("canvas");

    const dessiner = () => { boite.hidden = false; Ton.tracer(canvas, courbeModele, courbeMoi); };
    const montrerNotes = () => {
      if (noteVisible) return;
      noteVisible = true;
      zone.querySelector("#notes").innerHTML = boutonsNotes(ctx);
      zone.querySelectorAll("[data-note]").forEach((b) => {
        b.onclick = () => { if (urlMoi) URL.revokeObjectURL(urlMoi); noter(ctx, +b.dataset.note, Micro.dispo() ? null : { sansMicro: true }); };
      });
    };
    Ton.depuisUrl(son(s)).then((c) => { courbeModele = c; if (!boite.hidden) dessiner(); }).catch(() => {});

    btnModele.onclick = async () => {
      btnModele.textContent = "▶ Modèle";
      await jouer(son(s));
      if (!Micro.dispo()) { dessiner(); montrerNotes(); }
    };
    btnMoi.onclick = () => { if (urlMoi) jouer(urlMoi); };

    btnRec.onclick = async () => {
      if (Micro.rec) { Micro.arreter(); return; }
      if (!Micro.dispo()) return;
      try {
        if (finLecture) { lecteur.pause(); finLecture(); }
        blob = await Micro.enregistrer(() => {
          btnRec.textContent = "■ Arrêter"; btnRec.classList.add("enregistre");
          etat.textContent = "Parlez…";
        });
      } catch (e) {
        Micro.refuse = true;
        btnRec.disabled = true;
        etat.textContent = "Micro refusé ou indisponible : écoutez le modèle, répétez à voix haute et notez-vous.";
        return;
      }
      btnRec.textContent = "● Recommencer"; btnRec.classList.remove("enregistre");
      etat.textContent = "";
      if (urlMoi) URL.revokeObjectURL(urlMoi);
      urlMoi = URL.createObjectURL(blob);
      btnMoi.hidden = false;
      btnModele.textContent = "▶ Modèle";
      Ton.depuisBlob(blob).then((c) => {
        courbeMoi = c;
        if (!c) etat.textContent = "Voix trop faible ou trop courte pour tracer la courbe.";
        dessiner();
      }).catch(() => { etat.textContent = "Courbe impossible à calculer sur cet enregistrement."; dessiner(); });
      montrerNotes();
      await jouer(son(s));   // modèle, puis vous, à la suite : la comparaison se fait à l'oreille
      await new Promise((r) => setTimeout(r, 300));
      await jouer(urlMoi);
    };

    if (ctx.nouvelle) jouer(son(s));
    if (!Micro.dispo()) etat.textContent = Micro.refuse ? "Micro refusé : écoutez le modèle, répétez à voix haute et notez-vous." : "Ce navigateur n'enregistre pas le son : écoutez, répétez à voix haute et notez-vous.";
    clavier({ " ": () => btnModele.click(), r: () => btnRec.click(), note: (n) => { const b = zone.querySelector(`[data-note="${n}"]`); if (b) b.click(); } });
  }

  /* Perception : j'entends, je choisis, je dis si j'étais sûr */
  function perception(ctx) {
    const s = ctx.cible;
    const options = melanger([s].concat(ctx.info.distracteurs));
    let choix = null;
    zone.innerHTML = entete(ctx) + `<section class="carte">
      <p class="consigne">Quelle syllabe entendez-vous ?</p>
      <button class="ecoute" id="ecoute" aria-label="Réécouter">▶</button>
      <div class="choix">${options.map((o, i) => `<button data-choix="${o}" lang="zh-Latn-pinyin"><small>${i + 1}</small>${M(o)}</button>`).join("")}</div>
      <div id="suite"></div></section>`;
    on("#quitter", accueil);
    on("#ecoute", () => jouer(son(s)));
    zone.querySelectorAll("[data-choix]").forEach((b) => { b.onclick = () => repondre(b.dataset.choix); });

    function repondre(o) {
      if (choix) return;
      choix = o;
      const juste = o === s;
      zone.querySelectorAll("[data-choix]").forEach((b) => {
        b.disabled = true;
        if (b.dataset.choix === s) b.classList.add("juste");
        else if (b.dataset.choix === o) b.classList.add("faux");
      });
      zone.querySelector("#suite").innerHTML = `<p class="${juste ? "ok" : "ko"}">${juste ? "Juste." : `C'était <b>${M(s)}</b>, vous avez choisi <b>${M(o)}</b>.`}</p>
        ${juste ? "" : `<div class="actions"><button id="j-bon">▶ ${M(s)}</button><button id="j-moi">▶ ${M(o)}</button></div>`}
        <p class="info">Étiez-vous sûr ?</p>
        <div class="notes deux"><button data-sur="1" class="note n3">Sûr<small>1</small></button><button data-sur="0" class="note n2">J'hésitais<small>2</small></button></div>`;
      on("#j-bon", () => jouer(son(s)));
      on("#j-moi", () => jouer(son(o)));
      zone.querySelectorAll("[data-sur]").forEach((b) => {
        b.onclick = () => {
          const sur = b.dataset.sur === "1";
          noter(ctx, juste ? (sur ? 3 : 2) : 1, { choix: o, sur: sur });
        };
      });
    }

    jouer(son(s));
    clavier({
      " ": () => jouer(son(s)),
      note: (n) => {
        if (!choix) { const b = zone.querySelectorAll("[data-choix]")[n - 1]; if (b) b.click(); }
        else if (n <= 2) zone.querySelector(`[data-sur="${n === 1 ? 1 : 0}"]`).click();
      },
    });
  }

  function fin() {
    Micro.arreter();
    const c = SRS.compter(E, ORDRE, Date.now());
    let h = `<section class="carte fin"><h2>Séance terminée</h2><p>${S.faites} carte${S.faites > 1 ? "s" : ""} aujourd'hui dans cette séance.</p>`;
    if (c.restantes) h += `<button class="principal" id="encore">Encore 10 nouvelles cartes</button>`;
    h += `<button id="retour">Retour à l'accueil</button></section>`;
    zone.innerHTML = h;
    on("#encore", () => { SRS.encoreDix(E, Date.now()); sauver(); suivante(); });
    on("#retour", accueil);
    clavier({});
  }

  /* ---------- Outils ---------- */

  function melanger(l) {
    const a = l.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  let toucheActive = {};
  function clavier(t) { toucheActive = t; }
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (toucheActive[k]) { e.preventDefault(); toucheActive[k](); }
    else if (/^[1-4]$/.test(k) && toucheActive.note) { e.preventDefault(); toucheActive.note(+k); }
  });

  // Une carte laissée en plan (page masquée) : on coupe le micro
  document.addEventListener("visibilitychange", () => { if (document.hidden) Micro.arreter(); });

  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

  accueil();
})();
