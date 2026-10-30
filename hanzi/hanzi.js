// Page Sinogrammes : ordre des cartes, note proposée, bilan. Logique pure, sans DOM (testable sous Node).
// La répétition espacée est celle de la page Pinyin (../srs.js).
"use strict";

const Hanzi = (() => {
  const S = typeof SRS !== "undefined" ? SRS : require("../srs.js");

  const TYPES = { e: "Écriture", s: "Sens", l: "Lecture", o: "Écoute" };
  // Une nouvelle carte d'écriture présente le mot (sens, son, ordre des traits). Ses autres cartes viennent
  // quelques mots plus tard, pour qu'on le retrouve de mémoire et non de l'écran précédent.
  const DECALAGE = { e: 0, s: 2, l: 4, o: 6 };
  const TONS = { 1: "1ᵉʳ ton", 2: "2ᵉ ton", 3: "3ᵉ ton", 4: "4ᵉ ton", 5: "ton neutre" };

  function mots(paquet) { return paquet.listes.flatMap((l) => l.mots); }

  function aCarte(paquet, type, m) { return type !== "o" || paquet.mots[m].son; }

  // Ordre de présentation des nouvelles cartes, pour les types choisis
  function ordre(paquet, types) {
    const l = [];
    mots(paquet).forEach((m, i) => Object.keys(TYPES).forEach((t, k) => {
      if (types[t] && aCarte(paquet, t, m)) l.push({ id: t + "-" + m, r: i + DECALAGE[t], k: k });
    }));
    return l.sort((a, b) => a.r - b.r || a.k - b.k).map((x) => x.id);
  }

  // L'état réduit aux cartes des types choisis (le quota du jour reste partagé)
  function vue(etat, types) {
    const cartes = {};
    for (const id in etat.cartes) if (types[id[0]]) cartes[id] = etat.cartes[id];
    return Object.assign({}, etat, { cartes: cartes });
  }

  // « ni3 men5 » → « nǐmen »
  function pinyin(syllabes) { return syllabes.map(S.marque).join(""); }
  function ton(s) { return +s.slice(-1); }

  // Note proposée pour une carte d'écriture. Par caractère : fautes = traits refusés,
  // aide = 0 (aucune), 1 (indice demandé), 2 (caractère montré). Le mot prend la note de son pire caractère.
  function noteEcriture(fautes, aides, nouvelle) {
    if (nouvelle) return 3;
    return Math.min(...fautes.map((f, k) => (aides[k] >= 2 || f >= 3 ? 1 : f || aides[k] ? 2 : 3)));
  }

  /* ---------- Bilan ---------- */

  const MIN = 60000;
  function seances(js) {
    let n = 0, prec = -Infinity;
    for (const e of js) { if (e.t - prec > 30 * MIN) n++; prec = e.t; }
    return n;
  }
  function trie(objet) { return Object.entries(objet).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)); }
  function repartition(js) {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0 };
    js.forEach((e) => c[e.n]++);
    return [1, 2, 3, 4].map((n) => `${S.NOTES[n]} ${c[n]}`).join(", ");
  }

  function bloc(js, paquet) {
    if (!js.length) return ["  Aucune réponse."];
    const M = (id) => paquet.mots[id.slice(2)];
    const L = [];
    const jours = new Set(js.map((e) => S.jour(e.t))).size;
    const ns = seances(js);
    L.push(`  ${js.length} réponses, ${ns} séance${ns > 1 ? "s" : ""} sur ${jours} jour${jours > 1 ? "s" : ""}.`);

    const ec = js.filter((e) => e.id[0] === "e" && e.f);
    if (ec.length) {
      const fautes = {}, montres = {}, indices = {};
      let car = 0, nets = 0;
      ec.forEach((e) => {
        const hz = M(e.id).hz;
        e.f.forEach((f, k) => {
          const c = hz[k];
          car++; if (!f && !e.a[k]) nets++;
          if (f) fautes[c] = (fautes[c] || 0) + f;
          if (e.a[k] === 1) indices[c] = (indices[c] || 0) + 1;
          if (e.a[k] === 2) montres[c] = (montres[c] || 0) + 1;
        });
      });
      const nouv = ec.filter((e) => e.nouv).length;
      L.push(`  Écriture (traits corrigés automatiquement) : ${ec.length} mots, dont ${nouv} découverts en suivant le modèle ; ${car} caractères, ${nets} sans faute ni aide.`);
      if (Object.keys(fautes).length) L.push("    Traits refusés : " + trie(fautes).map(([c, n]) => `${c} ×${n}`).join(", ") + ".");
      if (Object.keys(montres).length) L.push("    Oubliés (« Je ne sais pas ») : " + trie(montres).map(([c, n]) => `${c} ×${n}`).join(", ") + ".");
      if (Object.keys(indices).length) L.push("    Avec indice : " + trie(indices).map(([c, n]) => `${c} ×${n}`).join(", ") + ".");
      L.push(`    Notes données : ${repartition(ec)}.`);
    }

    const lec = js.filter((e) => e.id[0] === "l" && e.tons);
    if (lec.length) {
      const fausses = lec.filter((e) => !e.ok);
      L.push(`  Lecture, tons (corrigés automatiquement) : ${lec.length} mots, ${fausses.length} avec un ton faux` +
        (lec.some((e) => e.malTouche) ? ` ; ${lec.filter((e) => e.malTouche).length} déclarés « mal touché », comptés justes` : "") + ".");
      if (fausses.length) {
        const conf = {}, detail = {};
        fausses.forEach((e) => {
          const m = M(e.id);
          m.py.forEach((s, k) => {
            if (e.tons[k] === ton(s)) return;
            const cle = `${TONS[ton(s)]} pris pour ${TONS[e.tons[k]]}`;
            conf[cle] = (conf[cle] || 0) + 1;
            const cm = `${m.hz[k]} ${S.marque(s)} → ${TONS[e.tons[k]]}`;
            detail[cm] = (detail[cm] || 0) + 1;
          });
        });
        L.push("    Confusions : " + trie(conf).map(([k, n]) => `${k} ×${n}`).join(" ; ") + ".");
        L.push("    Détail : " + trie(detail).map(([k, n]) => `${k}` + (n > 1 ? ` ×${n}` : "")).join(" ; ") + ".");
      }
      const auto = lec.filter((e) => (e.ok || e.malTouche) && !e.silence);
      if (auto.length) L.push(`    Prononciation, tons justes (auto-évaluée) : ${repartition(auto)}.`);
      const voix = lec.filter((e) => e.voix).length, muets = lec.filter((e) => e.silence).length;
      if (voix || muets) L.push(`    Voix : ${voix} mot${voix > 1 ? "s" : ""} enregistré${voix > 1 ? "s" : ""} et comparé${voix > 1 ? "s" : ""} au modèle` +
        (muets ? ` ; ${muets} lu${muets > 1 ? "s" : ""} de tête (« Je ne peux pas parler ici »)` : "") + ".");
    }

    [["s", "Sens (caractères → français, auto-évalué)"], ["o", "Écoute (son → sens, auto-évaluée)"]].forEach(([t, titre]) => {
      const r = js.filter((e) => e.id[0] === t);
      if (!r.length) return;
      L.push(`  ${titre} : ${repartition(r)}.`);
      const aides = r.filter((e) => e.indice).length;
      if (aides) L.push(`    Avec aide-mémoire : ${aides}.`);
      const durs = {};
      r.filter((e) => e.n === 1).forEach((e) => { const hz = M(e.id).hz; durs[hz] = (durs[hz] || 0) + 1; });
      if (Object.keys(durs).length) L.push("    Notés « À revoir » : " + trie(durs).map(([k, n]) => k + (n > 1 ? ` ×${n}` : "")).join(", ") + ".");
    });
    return L;
  }

  function bilan(etat, paquet, t) {
    const depuis = etat.dernierBilan || 0;
    const recents = etat.journal.filter((e) => e.t > depuis);
    const L = [`Bilan Sinogrammes du ${S.date(t, true)}`, ""];
    L.push(depuis ? `Depuis le dernier bilan (${S.date(depuis, true)}) :` : "Depuis le début (premier bilan) :");
    L.push(...bloc(recents, paquet));
    if (depuis && etat.journal.length > recents.length) {
      L.push("", `Cumul depuis le ${S.date(etat.debut || etat.journal[0].t)} :`);
      L.push(...bloc(etat.journal, paquet));
    }
    const tous = ordre(paquet, { e: 1, s: 1, l: 1, o: 1 });
    const parType = Object.keys(TYPES).map((ty) => {
      const ids = tous.filter((id) => id[0] === ty);
      const vus = ids.filter((id) => etat.cartes[id]);
      const rev = vus.filter((id) => etat.cartes[id].etat === "revision").length;
      return `${TYPES[ty]} ${vus.length}/${ids.length} (${rev} en révision espacée)` + (etat.types && !etat.types[ty] ? " [désactivé]" : "");
    });
    const dues = Object.values(vue(etat, etat.types || { e: 1, s: 1, l: 1, o: 1 }).cartes).filter((c) => c.etat !== "nouvelle" && c.due <= t).length;
    L.push("", `Progression : ${parType.join(" ; ")}. ${dues} carte${dues > 1 ? "s" : ""} due${dues > 1 ? "s" : ""} maintenant.`);
    return L.join("\n");
  }

  return { TYPES, TONS, ordre, vue, pinyin, ton, noteEcriture, bilan, mots };
})();

if (typeof module !== "undefined") module.exports = Hanzi;
