// Répétition espacée, pinyin et bilan : logique pure, sans DOM (testable sous Node).
"use strict";

const SRS = (() => {
  const MIN = 60000;
  const BASCULE = 4;          // un jour de révision commence à 4 h du matin
  const PAS = [1, 10];        // étapes d'apprentissage, en minutes
  const AVANCE = 20 * MIN;    // en fin de séance, on montre les cartes en apprentissage dues dans les 20 min
  const NOTES = { 1: "À revoir", 2: "Difficile", 3: "Bien", 4: "Facile" };

  /* ---------- Pinyin ---------- */

  const INITIALES = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h",
    "j", "q", "x", "r", "z", "c", "s", "y", "w"];
  const ACCENTS = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", "ü": "ǖǘǚǜ" };

  // « zhang1 » → « zhāng », « lv3 » → « lǚ ». Règle : a ou e portent l'accent ; dans ou, le o ; sinon la dernière voyelle.
  function marque(s) {
    const ton = +s.slice(-1);
    let corps = s.slice(0, -1).replace(/v/g, "ü");
    if (!(ton >= 1 && ton <= 4)) return corps;
    let i = corps.search(/[ae]/);
    if (i < 0) i = corps.indexOf("ou");
    if (i < 0) { for (let k = corps.length - 1; k >= 0; k--) if ("iouü".includes(corps[k])) { i = k; break; } }
    if (i < 0) return corps;
    return corps.slice(0, i) + ACCENTS[corps[i]][ton - 1] + corps.slice(i + 1);
  }

  // Même découpage que construire.py : après j, q, x, le i de la finale appartient à l'initiale, et u se dit ü.
  function traits(s) {
    const ton = s.slice(-1), corps = s.slice(0, -1);
    const ini = INITIALES.find((i) => corps.startsWith(i)) || "";
    let fin = corps.slice(ini.length);
    if ("jqx".includes(ini) && ini) {
      if (fin.startsWith("u")) fin = "v" + fin.slice(1);
      else if (fin.startsWith("i") && !["i", "in", "ing"].includes(fin)) fin = fin.slice(1);
    }
    return { initiale: ini, finale: fin.replace(/v/g, "ü"), ton: ton };
  }

  /* ---------- Jours ---------- */

  function jour(t) {
    const d = new Date(t - BASCULE * 3600000);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  // 4 h du matin, n jours après le jour de révision de t
  function dansNJours(t, n) {
    const d = new Date(t - BASCULE * 3600000);
    d.setHours(BASCULE, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.getTime();
  }

  /* ---------- Planification ---------- */

  function neuve() { return { etat: "nouvelle", ease: 2.5, ivl: 0, pas: 0, lapses: 0, vues: 0 }; }

  function diplomer(c, ivl, t) {
    c.etat = "revision"; c.ivl = ivl; c.pas = 0; delete c.retour;
    c.due = dansNJours(t, ivl);
    return c;
  }

  // Nouvel état d'une carte notée 1 (À revoir) à 4 (Facile) à l'instant t. Variante simplifiée de l'algorithme d'Anki.
  function noter(carte, note, t) {
    const c = Object.assign(neuve(), carte || {});
    c.vues++;
    if (c.etat === "nouvelle") { c.etat = "apprentissage"; c.pas = 0; }
    if (c.etat === "apprentissage") {
      if (note === 1) { c.pas = 0; c.due = t + PAS[0] * MIN; }
      else if (note === 2) c.due = t + PAS[c.pas] * MIN * 1.5;
      else if (note === 3) {
        if (c.pas + 1 >= PAS.length) return diplomer(c, c.retour || 1, t);
        c.pas++; c.due = t + PAS[c.pas] * MIN;
      } else return diplomer(c, Math.max(4, c.retour || 0), t);
      return c;
    }
    if (note === 1) {               // oubli : on réapprend (étape de 10 min), puis l'intervalle repart à moitié
      c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2);
      c.retour = Math.max(1, Math.round(c.ivl / 2));
      c.etat = "apprentissage"; c.pas = PAS.length - 1; c.due = t + PAS[c.pas] * MIN;
      return c;
    }
    const bien = Math.max(c.ivl + 1, Math.round(c.ivl * c.ease));
    if (note === 2) { c.ease = Math.max(1.3, c.ease - 0.15); c.ivl = Math.max(c.ivl + 1, Math.round(c.ivl * 1.2)); }
    else if (note === 3) c.ivl = bien;
    else { c.ease += 0.15; c.ivl = Math.max(bien + 1, Math.round(c.ivl * c.ease * 1.3)); }
    c.due = dansNJours(t, c.ivl);
    return c;
  }

  // « 1 min », « 10 min », « 3 j », « 2 mois » : délai avant le prochain passage si l'on donne cette note
  function delai(carte, note, t) {
    const c = noter(carte, note, t), ms = c.due - t;
    if (c.etat === "apprentissage") return Math.round(ms / MIN) + " min";
    if (c.ivl < 31) return c.ivl + " j";
    return Math.round(c.ivl / 30) + " mois";
  }

  function etatVide() {
    return { cartes: {}, journal: [], jour: { date: "", nouvelles: 0, bonus: 0 }, parJour: 20, dernierBilan: 0, debut: 0 };
  }

  function quota(etat, t) {
    const j = etat.jour.date === jour(t) ? etat.jour : { nouvelles: 0, bonus: 0 };
    return Math.max(0, etat.parJour + j.bonus - j.nouvelles);
  }

  function compter(etat, ordre, t) {
    const cs = Object.values(etat.cartes);
    const restantes = ordre.filter((id) => !etat.cartes[id]).length;
    return {
      dues: cs.filter((c) => c.etat !== "nouvelle" && c.due <= t).length,
      nouvelles: Math.min(quota(etat, t), restantes),
      restantes: restantes,
      bientot: cs.filter((c) => c.etat === "apprentissage" && c.due > t && c.due <= t + AVANCE).length,
      vues: ordre.length - restantes,
      total: ordre.length,
    };
  }

  // Prochaine carte : apprentissage dû, puis révisions (une nouvelle toutes les trois cartes), puis nouvelles,
  // puis apprentissage dû bientôt. Évite de reprendre la carte qu'on vient de voir quand une autre attend.
  function prochaine(etat, ordre, t, derniere, rang) {
    const ids = Object.keys(etat.cartes);
    const parDue = (a, b) => etat.cartes[a].due - etat.cartes[b].due;
    const sauf = (l) => (l.length > 1 && l[0] === derniere ? l.slice(1) : l);
    const appr = sauf(ids.filter((id) => etat.cartes[id].etat === "apprentissage" && etat.cartes[id].due <= t).sort(parDue));
    const rev = sauf(ids.filter((id) => etat.cartes[id].etat === "revision" && etat.cartes[id].due <= t).sort(parDue));
    const nouv = quota(etat, t) > 0 ? ordre.find((id) => !etat.cartes[id]) : undefined;
    const choix = [];
    if (appr.length && appr[0] !== derniere) choix.push({ id: appr[0] });
    if (rev.length && nouv && rang % 3 === 2) choix.push({ id: nouv, nouvelle: true });
    if (rev.length) choix.push({ id: rev[0] });
    if (nouv) choix.push({ id: nouv, nouvelle: true });
    if (appr.length) choix.push({ id: appr[0] });
    const bientot = ids.filter((id) => etat.cartes[id].etat === "apprentissage" && etat.cartes[id].due <= t + AVANCE).sort(parDue);
    if (bientot.length) choix.push({ id: sauf(bientot)[0] });
    return choix[0] || null;
  }

  // Enregistre une réponse : nouvel état de la carte, quota du jour, journal.
  function repondre(etat, id, note, t, extra) {
    const avant = etat.cartes[id];
    if (!avant) {
      if (etat.jour.date !== jour(t)) etat.jour = { date: jour(t), nouvelles: 0, bonus: 0 };
      etat.jour.nouvelles++;
      if (!etat.debut) etat.debut = t;
    }
    etat.cartes[id] = noter(avant, note, t);
    etat.journal.push(Object.assign({ t: t, id: id, n: note }, extra || {}));
  }

  function encoreDix(etat, t) {
    if (etat.jour.date !== jour(t)) etat.jour = { date: jour(t), nouvelles: 0, bonus: 0 };
    etat.jour.bonus += 10;
  }

  /* ---------- Bilan ---------- */

  function date(t, heure) {
    const d = new Date(t);
    const s = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
    return heure ? s + " " + String(d.getHours()).padStart(2, "0") + " h " + String(d.getMinutes()).padStart(2, "0") : s;
  }

  function seances(js) {
    let n = 0, prec = -Infinity;
    for (const e of js) { if (e.t - prec > 30 * MIN) n++; prec = e.t; }
    return n;
  }

  function trie(objet) { return Object.entries(objet).sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1)); }

  function bloc(js, paquet) {
    if (!js.length) return ["  Aucune réponse."];
    const L = [];
    const titre = {};
    paquet.groupes.forEach((g) => { titre[g.id] = g.titre.split(" :")[0]; });
    const groupeDe = (id) => paquet.cibles[id.slice(2)].groupe;
    const per = js.filter((e) => e.id.startsWith("e-"));
    const pro = js.filter((e) => e.id.startsWith("p-"));
    const jours = new Set(js.map((e) => jour(e.t))).size;
    L.push(`  ${js.length} réponses, ${seances(js)} séances sur ${jours} jour${jours > 1 ? "s" : ""}.`);

    const erreurs = per.filter((e) => e.choix && e.choix !== e.id.slice(2));
    L.push(`  Perception (corrigée automatiquement) : ${per.length} réponses, ${erreurs.length} erreurs, dont ${erreurs.filter((e) => e.sur).length} données « sûr ». Justes mais « hésitant » : ${per.filter((e) => e.choix === e.id.slice(2) && !e.sur).length}.`);
    if (per.length) {
      const pg = {};
      per.forEach((e) => {
        const g = groupeDe(e.id); pg[g] = pg[g] || { n: 0, err: 0 };
        pg[g].n++; if (e.choix && e.choix !== e.id.slice(2)) pg[g].err++;
      });
      L.push("    Erreurs par groupe : " + paquet.groupes.filter((g) => pg[g.id]).map((g) => `${titre[g.id]} ${pg[g.id].err}/${pg[g.id].n}`).join(" ; ") + ".");
    }
    if (erreurs.length) {
      const paires = {}, tr = {};
      erreurs.forEach((e) => {
        const cible = e.id.slice(2), k = marque(cible) + " entendu " + marque(e.choix);
        paires[k] = paires[k] || { n: 0, sur: 0 }; paires[k].n++; if (e.sur) paires[k].sur++;
        const a = traits(cible), b = traits(e.choix);
        [["initiale", a.initiale, b.initiale], ["finale", a.finale, b.finale], ["ton", a.ton, b.ton]].forEach(([nom, x, y]) => {
          if (x !== y) { const k2 = `${nom} ${x || "∅"} → ${y || "∅"}`; tr[k2] = tr[k2] || { n: 0 }; tr[k2].n++; }
        });
      });
      L.push("    Confusions : " + trie(paires).map(([k, v]) => `${k} ×${v.n}` + (v.sur ? ` (${v.sur} sûr)` : "")).join(" ; ") + ".");
      L.push("    Par trait : " + trie(tr).map(([k, v]) => `${k} ×${v.n}`).join(" ; ") + ".");
    }

    if (pro.length) {
      const c = { 1: 0, 2: 0, 3: 0, 4: 0 };
      pro.forEach((e) => c[e.n]++);
      L.push(`  Production (auto-évaluée) : ${pro.length} notes. ` + [1, 2, 3, 4].map((n) => `${NOTES[n]} ${c[n]}`).join(", ") + ".");
      const pg = {};
      pro.forEach((e) => {
        const g = groupeDe(e.id); pg[g] = pg[g] || { n: 0, dur: 0 };
        pg[g].n++; if (e.n <= 2) pg[g].dur++;
      });
      L.push("    « À revoir » ou « Difficile » par groupe : " + paquet.groupes.filter((g) => pg[g.id]).map((g) => `${titre[g.id]} ${pg[g.id].dur}/${pg[g.id].n}`).join(" ; ") + ".");
      const durs = {};
      pro.filter((e) => e.n === 1).forEach((e) => { const k = marque(e.id.slice(2)); durs[k] = durs[k] || { n: 0 }; durs[k].n++; });
      if (Object.keys(durs).length) L.push("    Notées « À revoir » : " + trie(durs).map(([k, v]) => `${k} ×${v.n}`).join(", ") + ".");
      const sans = pro.filter((e) => e.sansMicro).length;
      if (sans) L.push(`    Dont ${sans} sans enregistrement (micro indisponible).`);
    }
    return L;
  }

  function bilan(etat, paquet, ordre, t) {
    const depuis = etat.dernierBilan || 0;
    const recents = etat.journal.filter((e) => e.t > depuis);
    const c = compter(etat, ordre, t);
    const cs = Object.values(etat.cartes);
    const L = [`Bilan Pinyin du ${date(t, true)}`, ""];
    L.push(depuis ? `Depuis le dernier bilan (${date(depuis, true)}) :` : "Depuis le début (premier bilan) :");
    L.push(...bloc(recents, paquet));
    if (depuis && etat.journal.length > recents.length) {
      L.push("", `Cumul depuis le ${date(etat.debut || etat.journal[0].t)} :`);
      L.push(...bloc(etat.journal, paquet));
    }
    L.push("", `Progression : ${c.vues}/${c.total} cartes vues ; ${cs.filter((x) => x.etat === "revision").length} en révision espacée (intervalle médian ${mediane(cs.filter((x) => x.etat === "revision").map((x) => x.ivl))} j), ${cs.filter((x) => x.etat === "apprentissage").length} en apprentissage ; ${c.dues} cartes dues maintenant.`);
    return L.join("\n");
  }

  function mediane(l) {
    if (!l.length) return 0;
    const s = l.slice().sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  return { marque, traits, jour, noter, delai, etatVide, quota, compter, prochaine, repondre, encoreDix, bilan, date, NOTES };
})();

if (typeof module !== "undefined") module.exports = SRS;
