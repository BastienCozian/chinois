/* Tableaux lisibles sur téléphone.
   Sur un écran étroit, cours.css empile les lignes de table.phrases et cache la ligne
   d'en-tête. Ce script recopie le titre de chaque colonne dans l'attribut data-label de
   ses cellules, que le CSS affiche devant la valeur (« Sur le côté : 亻 »), et marque
   « vide » les cellules sans contenu (« — » ou rien), que le CSS cache sur téléphone.
   Rien ne change sur un grand écran. */
(function () {
  function etiqueter(table) {
    var lignes = table.querySelectorAll("tr");
    if (!lignes.length) return;
    var titres = Array.prototype.map.call(lignes[0].querySelectorAll("th"), function (th) {
      return th.textContent.replace(/\s+/g, " ").trim();
    });
    if (!titres.length) return;
    table.classList.add("etiquete");
    for (var i = 1; i < lignes.length; i++) {
      var cellules = lignes[i].querySelectorAll("td, th");
      for (var j = 0; j < cellules.length; j++) {
        var c = cellules[j];
        if (titres[j] && !c.hasAttribute("data-label")) c.setAttribute("data-label", titres[j]);
        var texte = c.textContent.replace(/\s+/g, "");
        if ((texte === "" || texte === "—") && !c.querySelector("button, img, svg")) c.classList.add("vide");
      }
    }
  }
  function tout() { document.querySelectorAll("table.phrases").forEach(etiqueter); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tout);
  else tout();
})();
