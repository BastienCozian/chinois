// Généré par construire.py : ne pas modifier l'en-tête à la main.
// Cache hors ligne : la page marche sans réseau une fois ouverte.
const VERSION = "hanzi-ac45633cff";
const FICHIERS = [
 "./",
 "index.html",
 "hanzi.css",
 "app.js",
 "hanzi.js",
 "paquet.js",
 "hanzi-writer.min.js",
 "manifest.json",
 "icone-180.png",
 "icone-512.png",
 "../style.css",
 "../srs.js",
 "traits/4E00.json",
 "traits/4E09.json",
 "traits/4E0A.json",
 "traits/4E0B.json",
 "traits/4E24.json",
 "traits/4E8C.json",
 "traits/4EEC.json",
 "traits/4F60.json",
 "traits/518D.json",
 "traits/53EA.json",
 "traits/5417.json",
 "traits/5947.json",
 "traits/597D.json",
 "traits/59CB.json",
 "traits/5C3E.json",
 "traits/5DF4.json",
 "traits/5F00.json",
 "traits/5F97.json",
 "traits/5FEB.json",
 "traits/602A.json",
 "traits/665A.json",
 "traits/6709.json",
 "traits/6735.json",
 "traits/6CA1.json",
 "traits/771F.json",
 "traits/8001.json",
 "traits/8033.json",
 "traits/864E.json",
 "traits/89C1.json",
 "traits/8BFE.json",
 "traits/8C22.json",
 "traits/8DD1.json",
 "traits/95EE.json",
 "traits/9898.json",
 "sons/er.mp3",
 "sons/erduo.mp3",
 "sons/hao.mp3",
 "sons/kaishi.mp3",
 "sons/kuai.mp3",
 "sons/laohu.mp3",
 "sons/liang.mp3",
 "sons/ma.mp3",
 "sons/meiyou.mp3",
 "sons/ni.mp3",
 "sons/nimen.mp3",
 "sons/pao.mp3",
 "sons/qiguai.mp3",
 "sons/san.mp3",
 "sons/wanshang.mp3",
 "sons/weiba.mp3",
 "sons/wenti.mp3",
 "sons/xiake.mp3",
 "sons/xiexie.mp3",
 "sons/yi.mp3",
 "sons/you.mp3",
 "sons/zaijian.mp3",
 "sons/zhen.mp3",
 "sons/zhi.mp3"
];
// --- fin de l'en-tête ---

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // Ne touche qu'à ses propres caches : la page Pinyin, au-dessus, a les siens
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k.startsWith("hanzi-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  // Son propre cache seulement : la page Pinyin garde aussi srs.js et style.css, peut-être dans une autre version
  e.respondWith(caches.open(VERSION).then(c => c.match(e.request, { ignoreSearch: true })).then(r => r || fetch(e.request)));
});
