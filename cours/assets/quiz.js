/* Exercices à correction immédiate, avec niveau de confiance et récapitulatif.

   Deux types, déclarés directement dans le HTML :

   1. Réponse numérique
      <div class="exo" id="q1" data-type="num" data-reponse="200" data-tolerance="1" data-unite="MW"
           data-sujet="Diviseur de transit">
        <p>Énoncé…</p>
        <div class="solution">Explication détaillée…</div>
      </div>

   2. Choix multiple (data-reponse = position de la bonne réponse, à partir de 1)
      <div class="exo" id="q4" data-type="qcm" data-reponse="3" data-sujet="…">
        <p>Énoncé…</p>
        <ol class="choix"><li>…</li><li>…</li><li>…</li><li>…</li></ol>
        <div class="solution">Explication…</div>
      </div>

   3. Réponse écrite en chinois (caractères ou pinyin à tons)
      <div class="exo" id="q5" data-type="texte" data-reponse="三百零五|sānbǎi líng wǔ"
           data-dit="sānbǎi líng wǔ" data-sujet="…">
        <p>Énoncé…</p>
        <div class="solution">…</div>
      </div>
      data-reponse : formes acceptées, séparées par « | ». Une forme en caractères se compare aux
      caractères tapés ; une forme en pinyin se compare aux syllabes et aux tons, que l'apprenant
      tape les tons en accents (sān) ou en chiffres (san1, 5 ou rien pour le ton neutre). Espaces,
      apostrophes et ponctuation ne comptent pas ; ü s'écrit aussi v ou u:.
      data-dit (facultatif) : formes prononcées (changements de ton) ; les taper ne compte pas comme
      un essai, le retour rappelle que le pinyin écrit le ton du dictionnaire.
      Des syllabes justes sans aucun ton ne comptent pas non plus comme un essai : on demande les tons.

   Avant le premier essai, l'apprenant déclare sa confiance (sûr, j'hésite, au hasard).
   Le premier essai est celui qui compte pour le récapitulatif ; on peut ensuite réessayer
   ou consulter la solution, ce que le récapitulatif signale aussi.

   La solution n'est proposée qu'après une première tentative (pratique de la récupération).
   Un élément <span id="score-quiz"></span> facultatif affiche le décompte des réussites.

   Exercice « papier et stylo » : ajouter l'attribut data-papier sur le .exo. Il reçoit une étiquette
   et un bouton « Je le ferai sur papier » : sur téléphone, l'apprenant le reporte sans bloquer le
   récapitulatif, qui porte alors « q8 REPORTÉ (papier) | Sujet ». Un essai ultérieur annule le report.
   Variante data-papier="guide" (Ornithologie) : exercice à faire avec le guide de terrain en main ;
   étiquette « Avec le guide », bouton « Je le ferai avec le guide », récapitulatif « REPORTÉ (guide) ».

   Récapitulatif à coller dans le terminal (boucle de retour vers l'instructeur) :
      <div class="quiz-recap" data-quiz="PAR-0001"></div>
   Une ligne par exercice : « q2 FAUX(300) conf=sur, juste au 2e essai | Sujet ». */

(function () {
  "use strict";

  const CONFIANCE = [
    ["sur", "Sûr de moi"],
    ["hesitant", "J'hésite"],
    ["hasard", "Au hasard"],
  ];

  // id -> { sujet, confiance, premier: { ok, valeur } | null, essais, reussi, solutionVue }
  const resultats = new Map();
  let total = 0;

  function majScore() {
    const el = document.getElementById("score-quiz");
    if (!el) return;
    let n = 0;
    resultats.forEach(function (r) { if (r.reussi) n++; });
    el.textContent = n + " / " + total;
  }

  function lireNombre(texte) {
    // Accepte la virgule décimale et les espaces (« 1 200,5 »)
    const t = String(texte).replace(/\s| | /g, "").replace(",", ".");
    if (t === "" || isNaN(Number(t))) return null;
    return Number(t);
  }

  function retour(exo, ok, message) {
    const r = exo.querySelector(".retour");
    r.className = "retour " + (ok ? "retour-ok" : "retour-ko");
    r.textContent = message;
  }

  /* Ligne « Confiance : Sûr de moi / J'hésite / Au hasard », figée au premier essai. */
  function monterConfiance(exo, r) {
    const ligne = document.createElement("div");
    ligne.className = "confiance";
    const lib = document.createElement("span");
    lib.textContent = "Confiance :";
    ligne.appendChild(lib);
    const boutons = CONFIANCE.map(function (c) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c[1];
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (r.premier) return;
        boutons.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        r.confiance = c[0];
        ligne.classList.remove("confiance-manquante");
      });
      ligne.appendChild(b);
      return b;
    });
    return {
      ligne: ligne,
      figer: function () { boutons.forEach(function (b) { b.disabled = true; }); },
      signalerManque: function () { ligne.classList.add("confiance-manquante"); },
    };
  }

  /* Enregistre un essai ; renvoie false si la confiance manque encore. */
  function essai(exo, r, conf, ok, valeur) {
    if (!r.premier) {
      if (!r.confiance) {
        conf.signalerManque();
        retour(exo, false, "Indiquez d'abord votre confiance.");
        return false;
      }
      r.premier = { ok: ok, valeur: valeur };
      conf.figer();
      if (r.papier) r.papier.annuler();
    }
    r.essais++;
    if (ok && !r.reussi) {
      r.reussi = true;
      exo.classList.add("exo-reussi");
    }
    majScore();
    majRecap();
    return true;
  }

  function preparerSolution(exo, r) {
    const sol = exo.querySelector(".solution");
    if (!sol) return null;
    sol.hidden = true;
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "bouton-secondaire";
    bouton.textContent = "Voir la solution";
    bouton.hidden = true;
    bouton.addEventListener("click", function () {
      sol.hidden = false;
      bouton.hidden = true;
      if (!r.reussi) r.solutionVue = true;
      majRecap();
    });
    sol.parentNode.insertBefore(bouton, sol);
    return bouton;
  }

  function monterNum(exo, r) {
    const attendu = Number(exo.dataset.reponse);
    const tol = exo.dataset.tolerance !== undefined ? Number(exo.dataset.tolerance) : Math.abs(attendu) * 0.01;
    const unite = exo.dataset.unite || "";

    const ligne = document.createElement("div");
    ligne.className = "exo-saisie";
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Votre réponse");
    const u = document.createElement("span");
    u.className = "exo-unite";
    u.textContent = unite;
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = "Vérifier";
    const ret = document.createElement("span");
    ret.className = "retour";
    ret.setAttribute("aria-live", "polite");
    ligne.append(input, u, bouton, ret);

    const conf = monterConfiance(exo, r);
    const sol = exo.querySelector(".solution");
    exo.insertBefore(ligne, sol || null);
    exo.insertBefore(conf.ligne, ligne);
    const boutonSol = preparerSolution(exo, r);

    function verifier() {
      if (r.reussi) return;
      const v = lireNombre(input.value);
      if (v === null) {
        retour(exo, false, "Entrez un nombre.");
        return;
      }
      const ok = Math.abs(v - attendu) <= tol;
      if (!essai(exo, r, conf, ok, input.value.trim())) return;
      if (boutonSol && sol.hidden) boutonSol.hidden = false;
      if (ok) {
        retour(exo, true, "Juste.");
        input.readOnly = true;
      } else if (Math.abs(v + attendu) <= tol) {
        retour(exo, false, "Bonne valeur, mauvais signe : vérifiez le sens du transit.");
      } else {
        retour(exo, false, "Pas encore. Réessayez, ou consultez la solution.");
      }
    }
    bouton.addEventListener("click", verifier);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") verifier();
    });
  }

  /* Pinyin ou caractères → { lettres, tons, hz } pour comparer sans tenir compte de la graphie des tons. */
  const VOYELLES_TONS = {
    "ā": "a1", "á": "a2", "ǎ": "a3", "à": "a4", "ē": "e1", "é": "e2", "ě": "e3", "è": "e4",
    "ī": "i1", "í": "i2", "ǐ": "i3", "ì": "i4", "ō": "o1", "ó": "o2", "ǒ": "o3", "ò": "o4",
    "ū": "u1", "ú": "u2", "ǔ": "u3", "ù": "u4", "ǖ": "v1", "ǘ": "v2", "ǚ": "v3", "ǜ": "v4", "ü": "v",
  };
  function analyserChinois(texte) {
    const t = String(texte).normalize("NFC").toLowerCase().replace(/u:/g, "v");
    let lettres = "", tons = "", hz = "";
    for (const c of t) {
      const v = VOYELLES_TONS[c];
      if (v) { lettres += v[0]; tons += v.slice(1); }
      else if (c >= "a" && c <= "z") lettres += c;
      else if (c >= "1" && c <= "4") tons += c;
      else if (/[\u3007\u3400-\u9fff]/.test(c)) hz += c;
    }
    return { lettres: lettres, tons: tons, hz: hz };
  }
  function memeChinois(a, b) {
    if (a.hz || b.hz) return a.hz === b.hz && a.lettres === b.lettres;
    return a.lettres !== "" && a.lettres === b.lettres && a.tons === b.tons;
  }

  function monterTexte(exo, r) {
    const formes = (exo.dataset.reponse || "").split("|").map(analyserChinois);
    const dites = (exo.dataset.dit || "").split("|").filter(Boolean).map(analyserChinois);

    const ligne = document.createElement("div");
    ligne.className = "exo-saisie";
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("autocorrect", "off");
    input.spellcheck = false;
    input.placeholder = "汉字 ou pinyin : sān, san1";
    input.className = "saisie-texte";
    input.setAttribute("aria-label", "Votre réponse, en caractères ou en pinyin à tons");
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = "Vérifier";
    const ret = document.createElement("span");
    ret.className = "retour";
    ret.setAttribute("aria-live", "polite");
    ligne.append(input, bouton, ret);

    const conf = monterConfiance(exo, r);
    const sol = exo.querySelector(".solution");
    exo.insertBefore(ligne, sol || null);
    exo.insertBefore(conf.ligne, ligne);
    const boutonSol = preparerSolution(exo, r);

    function verifier() {
      if (r.reussi) return;
      const v = analyserChinois(input.value);
      if (!v.lettres && !v.hz) {
        retour(exo, false, "Écrivez des caractères ou du pinyin.");
        return;
      }
      if (dites.some(function (d) { return memeChinois(v, d); }) && !formes.some(function (f) { return memeChinois(v, f); })) {
        retour(exo, false, "C'est ce qu'on dit. Écrivez le ton du dictionnaire.");
        return;
      }
      if (!v.hz && !v.tons && formes.some(function (f) { return !f.hz && f.lettres === v.lettres; })) {
        retour(exo, false, "Syllabes justes : ajoutez les tons (accents, ou chiffres 1 à 4).");
        return;
      }
      const ok = formes.some(function (f) { return memeChinois(v, f); });
      if (!essai(exo, r, conf, ok, input.value.trim())) return;
      if (boutonSol && sol.hidden) boutonSol.hidden = false;
      if (ok) {
        retour(exo, true, "Juste.");
        input.readOnly = true;
      } else if (!v.hz && formes.some(function (f) { return !f.hz && f.lettres === v.lettres; })) {
        retour(exo, false, "Les syllabes sont justes, pas les tons. Réessayez, ou consultez la solution.");
      } else {
        retour(exo, false, "Pas encore. Réessayez, ou consultez la solution.");
      }
    }
    bouton.addEventListener("click", verifier);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") verifier();
    });
  }

  function monterQcm(exo, r) {
    const bonne = Number(exo.dataset.reponse);
    const items = Array.from(exo.querySelectorAll(".choix > li"));
    const liste = exo.querySelector(".choix");
    let choisi = null;

    const conf = monterConfiance(exo, r);
    const actions = document.createElement("div");
    actions.className = "exo-saisie";
    const verif = document.createElement("button");
    verif.type = "button";
    verif.textContent = "Vérifier";
    actions.appendChild(verif);
    const ret = document.createElement("div");
    ret.className = "retour";
    ret.setAttribute("aria-live", "polite");
    liste.after(conf.ligne, actions, ret);
    const boutonSol = preparerSolution(exo, r);

    const boutons = items.map(function (li, i) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choix-bouton";
      b.setAttribute("aria-pressed", "false");
      while (li.firstChild) b.appendChild(li.firstChild);
      li.appendChild(b);
      b.addEventListener("click", function () {
        if (r.reussi || b.disabled) return;
        boutons.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        choisi = i;
      });
      return b;
    });

    verif.addEventListener("click", function () {
      if (r.reussi) return;
      if (choisi === null) {
        retour(exo, false, "Choisissez une réponse.");
        return;
      }
      const b = boutons[choisi];
      const ok = choisi + 1 === bonne;
      // La lettre (A, B, C…) identifie le choix dans le récapitulatif
      if (!essai(exo, r, conf, ok, String.fromCharCode(65 + choisi))) return;
      if (boutonSol && exo.querySelector(".solution").hidden) boutonSol.hidden = false;
      b.setAttribute("aria-pressed", "false");
      if (ok) {
        b.classList.add("choix-ok");
        retour(exo, true, "Juste.");
        boutons.forEach(function (x) { if (x !== b) x.disabled = true; });
        verif.disabled = true;
      } else {
        b.classList.add("choix-ko");
        b.disabled = true;
        choisi = null;
        retour(exo, false, "Non. Réfléchissez encore, ou consultez la solution.");
      }
    });
  }

  /* Exercice data-papier : étiquette, et bouton pour le reporter sans bloquer le récapitulatif. */
  function monterPapier(exo, r) {
    const etiquette = document.createElement("span");
    etiquette.className = "etiquette-papier";
    const guide = exo.getAttribute("data-papier") === "guide";
    r.modeReport = guide ? "guide" : "papier";
    etiquette.textContent = guide ? "📖 Avec le guide" : "✎ Papier et stylo";
    const num = exo.querySelector(".num-exo");
    if (num) num.after(etiquette); else exo.prepend(etiquette);

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "bouton-secondaire bouton-papier";
    function maj() {
      bouton.textContent = guide
        ? (r.reporte ? "Reporté : à faire avec le guide (annuler)" : "Je le ferai avec le guide")
        : (r.reporte ? "Reporté : à faire sur papier (annuler)" : "Je le ferai sur papier");
      bouton.setAttribute("aria-pressed", r.reporte ? "true" : "false");
    }
    bouton.addEventListener("click", function () {
      if (r.premier) return;
      r.reporte = !r.reporte;
      maj();
      majRecap();
    });
    maj();
    const sol = exo.querySelector(".solution");
    const avant = sol && sol.previousElementSibling && sol.previousElementSibling.textContent === "Voir la solution" ? sol.previousElementSibling : sol;
    exo.insertBefore(bouton, avant || null);
    r.papier = { annuler: function () { r.reporte = false; bouton.hidden = true; } };
  }

  function ordinal(n) { return n === 1 ? "1er" : n + "e"; }

  function ligneRecap(id, r) {
    if (!r.premier && r.reporte) return id + " REPORTÉ (" + (r.modeReport || "papier") + ")" + (r.sujet ? " | " + r.sujet : "");
    let s = id + " ";
    if (r.premier.ok) {
      s += "OK";
    } else {
      s += "FAUX(" + r.premier.valeur + ")";
    }
    s += " conf=" + r.confiance;
    if (!r.premier.ok) {
      if (r.reussi) s += ", juste au " + ordinal(r.essais) + " essai";
      else s += ", pas encore résolu";
      if (r.solutionVue) s += ", solution vue";
    }
    if (r.sujet) s += " | " + r.sujet;
    return s;
  }

  function majRecap() {
    const boite = document.querySelector(".quiz-recap");
    if (!boite) return;
    let faits = 0, bons = 0, reportes = 0;
    resultats.forEach(function (r) {
      if (r.premier) { faits++; if (r.premier.ok) bons++; }
      else if (r.reporte) reportes++;
    });
    let html = '<div class="score-recap">' + bons + " / " + faits + " justes du premier coup" +
      (reportes ? " · " + reportes + " reporté(s)" : "") +
      (faits + reportes < total ? " · " + (total - faits - reportes) + " exercice(s) restant(s)" : "") + "</div>";
    faits += reportes;
    // Page publique (site GitHub, <html data-public>) : pas d'Agent Teach, donc pas de récapitulatif à coller.
    // On donne le score et les exercices à revoir, avec un lien vers chacun.
    if (document.documentElement.hasAttribute("data-public")) {
      if (faits < total) {
        html += "<p>Le bilan apparaîtra ici quand vous aurez tenté chaque exercice.</p>";
      } else {
        const aRevoir = [];
        resultats.forEach(function (r, id) {
          if (r.premier && !r.premier.ok) aRevoir.push('<li><a href="#' + id + '">' + id.replace(/^q/, "Exercice ") + "</a>" +
            (r.sujet ? " : " + r.sujet.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) : "") +
            (r.confiance === "sur" ? " <b>(raté en étant sûr : à relire en priorité)</b>" : "") + "</li>");
        });
        html += aRevoir.length
          ? "<p>À revoir :</p><ul>" + aRevoir.join("") + "</ul>"
          : "<p>Tout juste du premier coup.</p>";
      }
      boite.innerHTML = html;
      return;
    }
    if (faits < total) {
      html += "<p>Le récapitulatif à coller dans le terminal apparaîtra ici quand vous aurez tenté chaque exercice.</p>";
      boite.innerHTML = html;
      return;
    }
    const lignes = [boite.dataset.quiz || "QUIZ"];
    resultats.forEach(function (r, id) { lignes.push(ligneRecap(id, r)); });
    const code = lignes.join("\n");
    html += "<p>Copiez ce récapitulatif et collez-le dans le terminal : votre instructeur s'en sert pour calibrer la suite. " +
      "Une erreur commise avec assurance est le signal le plus utile.</p>";
    html += '<pre></pre><button type="button">Copier</button>';
    boite.innerHTML = html;
    const pre = boite.querySelector("pre");
    pre.textContent = code;
    const btn = boite.querySelector("button");
    btn.addEventListener("click", function () {
      function selectionner() {
        const plage = document.createRange();
        plage.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(plage);
        btn.textContent = "Texte sélectionné : copiez-le";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { btn.textContent = "Copié ✓"; }, selectionner);
      } else {
        selectionner();
      }
    });
  }

  function init() {
    const exos = document.querySelectorAll(".exo");
    total = exos.length;
    exos.forEach(function (exo, i) {
      const id = exo.id || "q" + (i + 1);
      const r = { sujet: exo.dataset.sujet || "", confiance: null, premier: null, essais: 0, reussi: false, solutionVue: false,
                  reporte: false, papier: null };
      resultats.set(id, r);
      if (exo.dataset.type === "num") monterNum(exo, r);
      else if (exo.dataset.type === "qcm") monterQcm(exo, r);
      else if (exo.dataset.type === "texte") monterTexte(exo, r);
      if (exo.hasAttribute("data-papier")) monterPapier(exo, r);
    });
    majScore();
    majRecap();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
