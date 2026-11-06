/* Ancres dans un encadré replié (<details>).
   Un lien vers « fiche.html#i-nuls » vise parfois un élément caché dans un <details> fermé :
   on déplie l'encadré et ceux qui l'englobent, puis on défile jusqu'à lui.
   Marche à l'arrivée sur la page, sur changement d'ancre et sur clic d'un lien interne à la page.
   Usage : <script src="../assets/ancres-details.js" defer></script> */

(function () {
  function deplier(id) {
    var cible = id && document.getElementById(id);
    if (!cible) return false;
    var deplie = false;
    for (var d = cible; d; d = d.parentElement) {
      if (d.tagName === "DETAILS" && !d.open) {
        d.open = true;
        deplie = true;
      }
    }
    return deplie ? cible : false;
  }

  function depuisAdresse() {
    var cible = deplier(decodeURIComponent(location.hash.slice(1)));
    if (!cible) return;
    cible.scrollIntoView();
    // Les schémas et les polices changent la hauteur de la page une fois chargés : on recale.
    window.addEventListener("load", function () { cible.scrollIntoView(); }, { once: true });
  }

  depuisAdresse();
  window.addEventListener("hashchange", depuisAdresse);

  // À l'impression, tout est déplié (certains navigateurs n'impriment pas un <details> fermé),
  // puis chaque encadré retrouve son état.
  var fermes = [];
  window.addEventListener("beforeprint", function () {
    fermes = Array.prototype.filter.call(document.querySelectorAll("details"), function (d) { return !d.open; });
    fermes.forEach(function (d) { d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    fermes.forEach(function (d) { d.open = false; });
    fermes = [];
  });

  // Lien « #ancre » dans la même page : on déplie avant que le navigateur ne défile.
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (a) deplier(decodeURIComponent(a.getAttribute("href").slice(1)));
  });
})();
