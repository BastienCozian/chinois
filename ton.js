// Courbe de ton : fréquence fondamentale (algorithme YIN) et tracé superposé du modèle et de l'apprenant.
"use strict";

const Ton = (() => {
  const SR = 16000;              // on travaille à 16 kHz : assez pour une voix, et rapide sur téléphone
  const FMIN = 70, FMAX = 500;   // plage de la voix parlée, en Hz
  const PAS = 0.01, FENETRE = 0.03;
  // Seuil de YIN ; à défaut de creux sous le seuil, on prend le minimum global s'il reste sous SEUIL_MAX.
  // Indispensable sur la voix réelle : la fin d'un 4ᵉ ton ou le creux d'un 3ᵉ, rapides et souvent soufflés,
  // ne descendent pas sous 0,15.
  const SEUIL = 0.2, SEUIL_MAX = 0.45;
  let ctx = null;

  function contexte() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // Safari n'accepte longtemps que la forme à fonctions de rappel de decodeAudioData
  function decoder(octets) {
    const c = contexte();
    return new Promise((ok, ko) => c.decodeAudioData(octets, ok, ko));
  }

  // Moyenne par paquets : rééchantillonnage grossier vers 16 kHz (moyenner fait office de filtre passe-bas)
  function vers16k(buffer) {
    const x = buffer.getChannelData(0), k = Math.max(1, Math.round(buffer.sampleRate / SR));
    const y = new Float32Array(Math.floor(x.length / k));
    for (let i = 0; i < y.length; i++) {
      let s = 0;
      for (let j = 0; j < k; j++) s += x[i * k + j];
      y[i] = s / k;
    }
    return { x: y, sr: buffer.sampleRate / k };
  }

  // f0 de chaque trame (NaN si non voisée), d'après de Cheveigné et Kawahara (2002)
  function f0(buffer) {
    const { x, sr } = vers16k(buffer);
    const W = Math.round(FENETRE * sr), H = Math.round(PAS * sr);
    const tmin = Math.floor(sr / FMAX), tmax = Math.ceil(sr / FMIN);
    const d = new Float32Array(tmax + 1);
    const res = [], energie = [];
    for (let s = 0; s + W + tmax < x.length; s += H) {
      let e = 0;
      for (let j = 0; j < W; j++) e += x[s + j] * x[s + j];
      energie.push(Math.sqrt(e / W));
      for (let tau = 1; tau <= tmax; tau++) {
        let somme = 0;
        for (let j = 0; j < W; j++) { const v = x[s + j] - x[s + j + tau]; somme += v * v; }
        d[tau] = somme;
      }
      // Différence normalisée par la moyenne cumulée, puis premier creux sous le seuil
      let cumul = 0, trouve = -1;
      d[0] = 1;
      for (let tau = 1; tau <= tmax; tau++) { cumul += d[tau]; d[tau] = cumul ? d[tau] * tau / cumul : 1; }
      for (let tau = tmin; tau < tmax; tau++) {
        if (d[tau] < SEUIL) {
          while (tau + 1 < tmax && d[tau + 1] < d[tau]) tau++;
          trouve = tau;
          break;
        }
      }
      if (trouve < 0) {
        let m = tmin;
        for (let tau = tmin + 1; tau < tmax; tau++) if (d[tau] < d[m]) m = tau;
        if (d[m] < SEUIL_MAX) trouve = m;
      }
      if (trouve < 0) { res.push(NaN); continue; }
      // Interpolation parabolique autour du creux
      const a = d[trouve - 1], b = d[trouve], c = d[trouve + 1];
      const decal = (a - 2 * b + c) ? (a - c) / (2 * (a - 2 * b + c)) : 0;
      res.push(sr / (trouve + decal));
    }
    // Trames trop faibles : silence ou souffle, pas de voix
    const emax = Math.max(...energie, 1e-9);
    return res.map((f, i) => (energie[i] > 0.08 * emax ? f : NaN));
  }

  function mediane(l) {
    const s = l.slice().sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : NaN;
  }

  // Courbe en demi-tons autour de la médiane du locuteur, temps ramené à [0, 1] sur la partie voisée.
  // On garde la forme du ton, pas la hauteur absolue : une voix grave se compare ainsi à une voix aiguë.
  function courbe(buffer) {
    let f = f0(buffer);
    // Sauts d'octave : la voix craquée au creux du 3ᵉ ton donne souvent la moitié de la vraie fréquence,
    // et YIN saute parfois au double. On ramène chaque trame près de la médiane de l'énoncé.
    const centre = mediane(f.filter((v) => !isNaN(v)));
    f = f.map((v) => (isNaN(v) ? v : v / centre < 0.6 ? v * 2 : v / centre > 1.7 ? v / 2 : v));
    // Lissage : médiane glissante sur 5 trames, qui efface les sauts d'octave isolés
    f = f.map((v, i) => {
      if (isNaN(v)) return NaN;
      const voisins = f.slice(Math.max(0, i - 2), i + 3).filter((u) => !isNaN(u));
      return mediane(voisins);
    });
    // Îlots voisés de moins de 4 trames (40 ms) : bruit
    for (let i = 0; i < f.length;) {
      if (isNaN(f[i])) { i++; continue; }
      let j = i;
      while (j < f.length && !isNaN(f[j])) j++;
      if (j - i < 4) for (let k = i; k < j; k++) f[k] = NaN;
      i = j;
    }
    const idx = f.map((v, i) => (isNaN(v) ? -1 : i)).filter((i) => i >= 0);
    if (idx.length < 5) return null;
    const debut = idx[0], fin = idx[idx.length - 1];
    const ref = mediane(idx.map((i) => f[i]));
    const pts = [];
    for (let i = debut; i <= fin; i++) {
      pts.push(isNaN(f[i]) ? null : { t: (i - debut) / Math.max(1, fin - debut), st: 12 * Math.log2(f[i] / ref) });
    }
    return { pts: pts, duree: (fin - debut) * PAS, ref: ref };
  }

  // Décode un son, depuis son adresse ou depuis un enregistrement
  async function charger(source) {
    const octets = source instanceof Blob ? await source.arrayBuffer() : await (await fetch(source)).arrayBuffer();
    return decoder(octets);
  }

  // Niveau sonore : moyenne quadratique des trames de 20 ms où la voix est présente
  // (puissance au-dessus de 1 % du maximum, soit −20 dB) ; les silences avant et après ne comptent pas.
  function niveau(buffer) {
    const x = buffer.getChannelData(0), H = Math.round(buffer.sampleRate * 0.02), p = [];
    for (let i = 0; i + H <= x.length; i += H) {
      let s = 0;
      for (let j = 0; j < H; j++) s += x[i + j] * x[i + j];
      p.push(s / H);
    }
    const max = Math.max(...p, 1e-12), actives = p.filter((v) => v > 0.01 * max);
    return Math.sqrt(actives.reduce((a, b) => a + b, 0) / Math.max(1, actives.length));
  }

  // Copie de l'enregistrement amenée au niveau du modèle. Au-delà de 0,8, écrêtage doux (tangente hyperbolique)
  // plutôt qu'une saturation brutale : les quelques crêtes qui dépasseraient restent propres.
  function aligner(buffer, modele) {
    const x = buffer.getChannelData(0), y = new Float32Array(x.length);
    const gain = Math.min(40, Math.max(0.3, niveau(modele) / Math.max(niveau(buffer), 1e-6)));
    for (let i = 0; i < x.length; i++) {
      const v = x[i] * gain, a = Math.abs(v);
      y[i] = a < 0.8 ? v : Math.sign(v) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
    }
    return { donnees: y, sr: buffer.sampleRate, gain: gain };
  }

  // Son → fichier WAV (16 bits, mono), rejoué par le même lecteur que le modèle :
  // sur iPhone, l'audio Web se tait quand le bouton silencieux est mis, pas un élément <audio>.
  function wav(son) {
    const n = son.donnees.length, buf = new ArrayBuffer(44 + 2 * n), v = new DataView(buf);
    const texte = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    texte(0, "RIFF"); v.setUint32(4, 36 + 2 * n, true); texte(8, "WAVE");
    texte(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, son.sr, true); v.setUint32(28, son.sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    texte(36, "data"); v.setUint32(40, 2 * n, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + 2 * i, Math.max(-1, Math.min(1, son.donnees[i])) * 0x7fff, true);
    return new Blob([buf], { type: "audio/wav" });
  }

  // Tracé : modèle et apprenant superposés, de −8 à +8 demi-tons
  function tracer(canvas, modele, moi) {
    const dpr = window.devicePixelRatio || 1;
    const L = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = L * dpr; canvas.height = H * dpr;
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const couleur = (v) => css.getPropertyValue(v).trim();
    const mg = 8, Y = (st) => H / 2 - (Math.max(-8, Math.min(8, st)) / 8) * (H / 2 - mg);
    const X = (t) => mg + t * (L - 2 * mg);
    g.clearRect(0, 0, L, H);
    g.strokeStyle = couleur("--rule"); g.lineWidth = 1;
    [-6, -3, 0, 3, 6].forEach((st) => {
      g.setLineDash(st ? [2, 4] : []);
      g.beginPath(); g.moveTo(mg, Y(st)); g.lineTo(L - mg, Y(st)); g.stroke();
    });
    g.setLineDash([]);
    const ligne = (c, coul, ep) => {
      if (!c) return;
      g.strokeStyle = coul; g.lineWidth = ep; g.lineJoin = g.lineCap = "round";
      g.beginPath();
      let leve = true;
      c.pts.forEach((p) => {
        if (!p) { leve = true; return; }
        if (leve) g.moveTo(X(p.t), Y(p.st)); else g.lineTo(X(p.t), Y(p.st));
        leve = false;
      });
      g.stroke();
    };
    ligne(modele, couleur("--accent"), 4);
    ligne(moi, couleur("--warm"), 3);
  }

  return { contexte, charger, courbe, niveau, aligner, wav, tracer };
})();
