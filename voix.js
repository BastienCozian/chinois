// Voix : lecteur de sons, micro, et comparaison de ma voix avec le modèle (courbe de ton : ton.js).
// Partagé par les pages Pinyin et Sinogrammes.
"use strict";

const Voix = (() => {
  /* ---------- Son ---------- */

  const lecteur = new Audio();
  let finLecture = null;
  // Joue un son ; la promesse se résout à la fin, ou quand un autre son le coupe
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
  function couper() {
    lecteur.pause();
    if (finLecture) { const f = finLecture; finLecture = null; f(); }
  }

  /* ---------- Micro : ouvert pour chaque enregistrement, refermé aussitôt
     (micro ouvert, l'iPhone baisse le son ou le bascule sur l'écouteur) ---------- */

  const Micro = {
    rec: null, minuteur: null, refuse: false,
    dispo() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) && !this.refuse; },
    // L'enregistrement s'arrête seul après dureeMax millisecondes
    async enregistrer(surDebut, dureeMax) {
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
        this.minuteur = setTimeout(() => this.arreter(), dureeMax);
      });
    },
    arreter() { if (this.rec && this.rec.state === "recording") this.rec.stop(); },
  };

  // Une carte laissée en plan (page masquée) : on coupe le micro
  document.addEventListener("visibilitychange", () => { if (document.hidden) Micro.arreter(); });

  /* ---------- Comparaison : modèle, ma voix, courbe de ton ---------- */

  function html(libelleModele) {
    return `<div class="actions">
        <button class="principal" id="rec">● M'enregistrer</button>
        <button id="modele">${libelleModele}</button>
        <button id="moi" hidden>▶ Moi</button>
        <button id="deux" hidden>▶ Modèle puis moi</button>
      </div>
      <p class="info" id="etat-micro"></p>
      <div class="courbe-boite" hidden><canvas class="courbe"></canvas>
        <p class="legende"><span class="l-modele">— modèle</span> <span class="l-moi">— vous</span> <span class="l-info">demi-tons autour de la hauteur moyenne</span></p></div>`;
  }

  // Branche les boutons de html() posés dans zone sur le son src (adresse du modèle).
  // o.apres() : appelé quand on peut passer à la suite (enregistrement fini, ou modèle écouté sans micro).
  // o.sansMicro : fin de la consigne quand le micro manque. o.duree : durée maximale d'un enregistrement (ms).
  // o.cache : le modèle reste caché (ni bouton, ni courbe) jusqu'à reveler() ; on peut s'enregistrer avant.
  function comparer(zone, src, o) {
    const apres = o.apres || (() => {}), sansMicro = o.sansMicro || ".", duree = o.duree || 3000;
    let blob = null, urlMoi = null, courbeModele = null, courbeMoi = null, actif = true, cache = !!o.cache;
    const btnRec = zone.querySelector("#rec"), btnMoi = zone.querySelector("#moi"), btnModele = zone.querySelector("#modele");
    const btnDeux = zone.querySelector("#deux");
    const etat = zone.querySelector("#etat-micro"), boite = zone.querySelector(".courbe-boite");
    const canvas = zone.querySelector("canvas");
    if (cache) btnModele.hidden = true;

    const dessiner = () => { if (cache) return; boite.hidden = false; Ton.tracer(canvas, courbeModele, courbeMoi); };
    const lesDeux = async () => {   // modèle, puis vous, à la suite : la comparaison se fait à l'oreille
      await jouer(src);
      await new Promise((r) => setTimeout(r, 300));
      if (actif && urlMoi) await jouer(urlMoi);
    };
    const pModele = Ton.charger(src);
    pModele.then((b) => { courbeModele = Ton.courbe(b); if (actif && !boite.hidden) dessiner(); }).catch(() => {});

    btnModele.onclick = async () => {
      btnModele.textContent = "▶ Modèle";
      await jouer(src);
      if (actif && !Micro.dispo()) { dessiner(); apres(); }
    };
    btnMoi.onclick = () => { if (urlMoi) jouer(urlMoi); };
    btnDeux.onclick = lesDeux;

    btnRec.onclick = async () => {
      if (Micro.rec) { Micro.arreter(); return; }
      if (!Micro.dispo()) return;
      try {
        couper();
        blob = await Micro.enregistrer(() => {
          btnRec.textContent = "■ Arrêter"; btnRec.classList.add("enregistre");
          etat.textContent = "Parlez…";
        }, duree);
      } catch (e) {
        Micro.refuse = true;
        btnRec.disabled = true;
        etat.textContent = "Micro refusé ou indisponible : écoutez le modèle" + sansMicro;
        return;
      }
      if (!actif) return; // carte quittée pendant l'enregistrement
      btnRec.textContent = "● Recommencer"; btnRec.classList.remove("enregistre");
      etat.textContent = "";
      if (urlMoi) URL.revokeObjectURL(urlMoi);
      urlMoi = null;
      btnMoi.hidden = false;
      btnDeux.hidden = cache;
      btnModele.textContent = "▶ Modèle";
      apres();
      try {
        const b = await Ton.charger(blob);
        courbeMoi = Ton.courbe(b);
        if (!courbeMoi) etat.textContent = "Voix trop faible ou trop courte pour tracer la courbe.";
        // Votre voix ramenée au niveau sonore du modèle, pour comparer à volume égal
        try { urlMoi = URL.createObjectURL(Ton.wav(Ton.aligner(b, await pModele))); } catch (e) { /* son brut, ci-dessous */ }
      } catch (e) {
        etat.textContent = "Courbe impossible à calculer sur cet enregistrement.";
      }
      if (!urlMoi) urlMoi = URL.createObjectURL(blob);
      if (!actif) return;
      if (cache) return; // réponse pas encore donnée : on n'entend que sa voix, sur demande
      dessiner();
      await lesDeux();
    };

    if (!Micro.dispo()) etat.textContent = (Micro.refuse ? "Micro refusé : écoutez le modèle" : "Ce navigateur n'enregistre pas le son : écoutez") + sansMicro;
    return {
      modele: () => { if (!btnModele.hidden) btnModele.click(); },
      rec: () => btnRec.click(),
      enregistre: () => !!blob,
      // Montre le modèle ; si je me suis enregistré, joue le modèle puis ma voix et trace les deux courbes
      reveler: async () => {
        if (!cache) return;
        cache = false;
        Micro.arreter();
        btnModele.hidden = false;
        if (blob) {
          btnDeux.hidden = false;
          // L'enregistrement peut finir d'être traité un peu après : on attend sa version au niveau du modèle
          for (let i = 0; i < 20 && actif && !urlMoi; i++) await new Promise((r) => setTimeout(r, 100));
          if (!actif) return;
          dessiner();
          await lesDeux();
        } else jouer(src);
      },
      liberer: () => { actif = false; Micro.arreter(); if (urlMoi) URL.revokeObjectURL(urlMoi); },
    };
  }

  return { jouer, couper, Micro, html, comparer };
})();
