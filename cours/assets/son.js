/* Boutons d'écoute et repli du pinyin ou du français.

   Son : <button class="son" data-son="xiexie">▶</button> joue assets/son-xiexie.mp3.
   Les sons viennent d'audio-cmn (mots du HSK lus par Yue Tan, CC BY-SA) : voir RESOURCES.md.
   Autre fichier de assets/ : <button class="son" data-fichier="dialogue02-xiexie.mp3">▶</button>. Les dialogues
   de « Conversation intensive » (chine-nouvelle.com) ne portent pas le préfixe son- : ils restent hors du site
   public des élèves (pinyin/cours/construire.py ne copie que son-*.mp3), et leurs boutons sont en data-public="non".

   Repli : un conteneur .repli avec des éléments .masquable.zh (caractères, pinyin) ou .masquable.fr,
   et des cases <input type="checkbox" data-masquer="zh|fr"> qui posent masquer-zh ou masquer-fr
   sur le conteneur. Un toucher sur un élément masqué le dévoile. */

(function () {
  "use strict";
  var base = document.currentScript.src.replace(/[^/]*$/, "");
  var courant = null;

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("button.son");
    if (b) {
      if (courant) courant.pause();
      courant = new Audio(base + (b.dataset.fichier || "son-" + b.dataset.son + ".mp3"));
      courant.play().catch(function () { b.textContent = "✕"; b.title = "Son indisponible"; });
      return;
    }
    var m = ev.target.closest(".masquable");
    if (m) m.classList.toggle("vu");
  });

  document.addEventListener("change", function (ev) {
    var c = ev.target.closest("input[data-masquer]");
    if (!c) return;
    var repli = c.closest(".repli") || document.querySelector(".repli");
    repli.classList.toggle("masquer-" + c.dataset.masquer, c.checked);
    repli.querySelectorAll(".masquable.vu").forEach(function (e) { e.classList.remove("vu"); });
  });
})();
