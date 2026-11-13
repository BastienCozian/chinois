// Écran « Retrouver mon niveau », commun aux deux pages : sauvegarde perdue, ou nouvel appareil sans sauvegarde,
// l'élève dit élément par élément (mot, syllabe) où il en est. La logique est dans srs.js (SRS.niveau, SRS.declarer).
"use strict";

const Niveau = (() => {
  // o : { zone, titre, intro, nom (« mot », « syllabe »), sections: [{ titre, elements: [{ cle, html, ids }] }],
  //       etat, sauver(), retour() }
  function ecran(o) {
    const { zone, etat } = o, N = SRS.NIVEAUX;
    const options = (choisi, vide) => (vide ? `<option value="">—</option>` : "") +
      N.map((nom, n) => `<option value="${n}"${n === choisi ? " selected" : ""}>${nom}</option>`).join("");
    let h = `<div class="haut"><button class="lien" id="annuler">← Retour</button></div>
      <header><h1>Retrouver mon niveau</h1><p class="sous-titre">${o.intro}</p></header>
      <p class="info">Choisissez un niveau pour chaque ${o.nom}, ou pour toute une liste d'un coup. Les cartes repartent de là,
      en révision espacée : « Je débute » revient dans les trois jours, « Je le connais » dans la semaine, « Je le maîtrise » dans le mois.
      Une carte trop facile ou oubliée se recale toute seule à la révision suivante. Seuls les ${o.nom}s que vous changez sont touchés.</p>
      <input type="search" class="cherche" id="cherche" placeholder="Chercher un ${o.nom} (caractères, pinyin sans tons, sens)" aria-label="Chercher">`;
    o.sections.forEach((s, i) => {
      h += `<section class="bloc niveaux"><h2>${s.titre}</h2>
        <p class="tout"><label>Toute la liste <select data-liste="${i}">${options(-1, true)}</select></label></p>
        <ul>${s.elements.map((e) => {
          const n = SRS.niveau(etat, e.ids);
          return `<li><span class="element">${e.html}</span><select data-cle="${e.cle}" data-avant="${n}" aria-label="Niveau">${options(n)}</select></li>`;
        }).join("")}</ul></section>`;
    });
    h += `<div class="barre-choix"><button class="lien" id="annuler-bas">Annuler</button><button class="principal" id="ok">Aucun changement</button></div>`;
    zone.innerHTML = h;
    window.scrollTo(0, 0);

    const elements = {};
    o.sections.forEach((s) => s.elements.forEach((e) => { elements[e.cle] = e; }));
    const choix = () => [...zone.querySelectorAll("select[data-cle]")];
    const changes = () => choix().filter((x) => x.value !== x.dataset.avant);
    const majBouton = () => {
      const k = changes().length;
      zone.querySelector("#ok").textContent = k ? `Enregistrer (${k} ${o.nom}${k > 1 ? "s" : ""})` : "Aucun changement";
    };
    zone.querySelectorAll("select[data-cle]").forEach((x) => { x.onchange = majBouton; });
    zone.querySelectorAll("select[data-liste]").forEach((x) => {
      x.onchange = () => {
        if (x.value === "") return;
        x.closest("section").querySelectorAll("select[data-cle]").forEach((y) => { y.value = x.value; });
        majBouton();
      };
    });
    // Recherche : sans accents ni tons (« xie » trouve xièxie), sur les caractères, le pinyin et le sens
    const plat = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
    zone.querySelector("#cherche").oninput = (ev) => {
      const q = plat(ev.target.value);
      zone.querySelectorAll("section.niveaux").forEach((s) => {
        let vus = 0;
        s.querySelectorAll("li").forEach((li) => {
          const ok = !q || plat(li.querySelector(".element").textContent).includes(q);
          li.hidden = !ok; vus += ok;
        });
        s.hidden = !vus;
        s.querySelector(".tout").hidden = !!q;   // « Toute la liste » n'a pas de sens sur une liste filtrée
      });
    };
    zone.querySelector("#annuler").onclick = o.retour;
    zone.querySelector("#annuler-bas").onclick = o.retour;
    zone.querySelector("#ok").onclick = () => {
      const ch = changes();
      if (!ch.length) return o.retour();
      const effaces = ch.filter((x) => x.value === "0" && x.dataset.avant !== "0").length;
      if (effaces && !confirm(`${effaces} ${o.nom}${effaces > 1 ? "s" : ""} « ${N[0]} » : leur progression sera effacée. Continuer ?`)) return;
      SRS.declarer(etat, ch.map((x) => ({ cle: x.dataset.cle, ids: elements[x.dataset.cle].ids, n: +x.value })), Date.now());
      o.sauver();
      o.retour();
    };
  }

  return { ecran };
})();

if (typeof module !== "undefined") module.exports = Niveau;
