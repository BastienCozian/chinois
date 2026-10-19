// Généré par construire.py à partir de paquet.txt : ne pas modifier à la main.
const PAQUET = {
 "groupes": [
  {
   "id": "initiales",
   "titre": "Initiales : j · z · zh et leurs cousines",
   "contrastes": [
    {
     "id": "j-z-zh",
     "libelle": "j · z · zh",
     "cibles": [
      "zhang1",
      "zang1",
      "jiang1",
      "zhao3",
      "zao3",
      "jiao3"
     ]
    },
    {
     "id": "q-c-ch",
     "libelle": "q · c · ch",
     "cibles": [
      "chang2",
      "cang2",
      "qiang2"
     ]
    },
    {
     "id": "x-s-sh",
     "libelle": "x · s · sh",
     "cibles": [
      "shao3",
      "sao3",
      "xiao3",
      "shan1",
      "san1",
      "xian1"
     ]
    },
    {
     "id": "r-l",
     "libelle": "r · l",
     "cibles": [
      "re4",
      "le4",
      "ru4",
      "lu4"
     ]
    }
   ]
  },
  {
   "id": "finales",
   "titre": "Finales nasales : ang · eng · ong, -n · -ng",
   "contrastes": [
    {
     "id": "ang-eng-ong",
     "libelle": "ang · eng · ong",
     "cibles": [
      "dang1",
      "deng1",
      "dong1",
      "tang2",
      "teng2",
      "tong2"
     ]
    },
    {
     "id": "an-ang",
     "libelle": "an · ang",
     "cibles": [
      "ban1",
      "bang1"
     ]
    },
    {
     "id": "en-eng",
     "libelle": "en · eng",
     "cibles": [
      "fen1",
      "feng1"
     ]
    },
    {
     "id": "in-ing",
     "libelle": "in · ing",
     "cibles": [
      "xin1",
      "xing1"
     ]
    },
    {
     "id": "ian-iang",
     "libelle": "ian · iang",
     "cibles": [
      "nian2",
      "niang2"
     ]
    }
   ]
  },
  {
   "id": "u-cache",
   "titre": "Le ü caché : ju, qu, xu se disent ü",
   "contrastes": [
    {
     "id": "ju-zhu",
     "libelle": "ju · zhu",
     "cibles": [
      "ju4",
      "zhu4"
     ]
    },
    {
     "id": "qu-chu",
     "libelle": "qu · chu",
     "cibles": [
      "qu4",
      "chu4"
     ]
    },
    {
     "id": "xu-shu",
     "libelle": "xu · shu",
     "cibles": [
      "xu1",
      "shu1"
     ]
    },
    {
     "id": "lv-lu",
     "libelle": "lü · lu",
     "cibles": [
      "lv3",
      "lu3"
     ]
    },
    {
     "id": "nv-nu",
     "libelle": "nü · nu",
     "cibles": [
      "nv3",
      "nu3"
     ]
    }
   ]
  },
  {
   "id": "trois-i",
   "titre": "Les trois i : zi · zhi · ji",
   "contrastes": [
    {
     "id": "zi-zhi-ji",
     "libelle": "zi · zhi · ji",
     "cibles": [
      "zi4",
      "zhi4",
      "ji4"
     ]
    },
    {
     "id": "si-shi-xi",
     "libelle": "si · shi · xi",
     "cibles": [
      "si1",
      "shi1",
      "xi1"
     ]
    }
   ]
  },
  {
   "id": "aspiration",
   "titre": "L'aspiration : b · p, d · t, g · k, z · c",
   "contrastes": [
    {
     "id": "b-p",
     "libelle": "b · p",
     "cibles": [
      "ba4",
      "pa4"
     ]
    },
    {
     "id": "d-t",
     "libelle": "d · t",
     "cibles": [
      "da4",
      "ta4"
     ]
    },
    {
     "id": "g-k",
     "libelle": "g · k",
     "cibles": [
      "ge1",
      "ke1"
     ]
    },
    {
     "id": "z-c",
     "libelle": "z · c",
     "cibles": [
      "zai4",
      "cai4"
     ]
    }
   ]
  },
  {
   "id": "tons",
   "titre": "Les tons : 2ᵉ contre 3ᵉ, 1ᵉʳ contre 4ᵉ",
   "contrastes": [
    {
     "id": "ton2-ton3",
     "libelle": "2ᵉ ton · 3ᵉ ton",
     "cibles": [
      "ma2",
      "ma3",
      "yu2",
      "yu3",
      "shi2",
      "shi3",
      "hu2",
      "hu3"
     ]
    },
    {
     "id": "ton1-ton4",
     "libelle": "1ᵉʳ ton · 4ᵉ ton",
     "cibles": [
      "tang1",
      "tang4"
     ]
    }
   ]
  }
 ],
 "cibles": {
  "zhang1": {
   "groupe": "initiales",
   "contraste": "j-z-zh",
   "distracteurs": [
    "zang1",
    "jiang1",
    "zhang3"
   ]
  },
  "zang1": {
   "groupe": "initiales",
   "contraste": "j-z-zh",
   "distracteurs": [
    "zhang1",
    "jiang1",
    "zang4"
   ]
  },
  "jiang1": {
   "groupe": "initiales",
   "contraste": "j-z-zh",
   "distracteurs": [
    "zhang1",
    "zang1",
    "jiang3"
   ]
  },
  "zhao3": {
   "groupe": "initiales",
   "contraste": "j-z-zh",
   "distracteurs": [
    "zao3",
    "jiao3",
    "zhao4"
   ]
  },
  "zao3": {
   "groupe": "initiales",
   "contraste": "j-z-zh",
   "distracteurs": [
    "zhao3",
    "jiao3",
    "zao4"
   ]
  },
  "jiao3": {
   "groupe": "initiales",
   "contraste": "j-z-zh",
   "distracteurs": [
    "zhao3",
    "zao3",
    "jiao4"
   ]
  },
  "chang2": {
   "groupe": "initiales",
   "contraste": "q-c-ch",
   "distracteurs": [
    "cang2",
    "qiang2",
    "chang3"
   ]
  },
  "cang2": {
   "groupe": "initiales",
   "contraste": "q-c-ch",
   "distracteurs": [
    "chang2",
    "qiang2",
    "cang1"
   ]
  },
  "qiang2": {
   "groupe": "initiales",
   "contraste": "q-c-ch",
   "distracteurs": [
    "chang2",
    "cang2",
    "qiang3"
   ]
  },
  "shao3": {
   "groupe": "initiales",
   "contraste": "x-s-sh",
   "distracteurs": [
    "sao3",
    "xiao3",
    "shao4"
   ]
  },
  "sao3": {
   "groupe": "initiales",
   "contraste": "x-s-sh",
   "distracteurs": [
    "shao3",
    "xiao3",
    "sao4"
   ]
  },
  "xiao3": {
   "groupe": "initiales",
   "contraste": "x-s-sh",
   "distracteurs": [
    "shao3",
    "sao3",
    "xiao4"
   ]
  },
  "shan1": {
   "groupe": "initiales",
   "contraste": "x-s-sh",
   "distracteurs": [
    "san1",
    "xian1",
    "shan4"
   ]
  },
  "san1": {
   "groupe": "initiales",
   "contraste": "x-s-sh",
   "distracteurs": [
    "shan1",
    "xian1",
    "san3"
   ]
  },
  "xian1": {
   "groupe": "initiales",
   "contraste": "x-s-sh",
   "distracteurs": [
    "shan1",
    "san1",
    "xian4"
   ]
  },
  "re4": {
   "groupe": "initiales",
   "contraste": "r-l",
   "distracteurs": [
    "le4",
    "she4",
    "re3"
   ]
  },
  "le4": {
   "groupe": "initiales",
   "contraste": "r-l",
   "distracteurs": [
    "re4",
    "ne4",
    "lei4"
   ]
  },
  "ru4": {
   "groupe": "initiales",
   "contraste": "r-l",
   "distracteurs": [
    "lu4",
    "shu4",
    "ru3"
   ]
  },
  "lu4": {
   "groupe": "initiales",
   "contraste": "r-l",
   "distracteurs": [
    "ru4",
    "nu4",
    "lu3"
   ]
  },
  "dang1": {
   "groupe": "finales",
   "contraste": "ang-eng-ong",
   "distracteurs": [
    "deng1",
    "dong1",
    "dan1"
   ]
  },
  "deng1": {
   "groupe": "finales",
   "contraste": "ang-eng-ong",
   "distracteurs": [
    "dang1",
    "dong1",
    "deng3"
   ]
  },
  "dong1": {
   "groupe": "finales",
   "contraste": "ang-eng-ong",
   "distracteurs": [
    "dang1",
    "deng1",
    "dong4"
   ]
  },
  "tang2": {
   "groupe": "finales",
   "contraste": "ang-eng-ong",
   "distracteurs": [
    "teng2",
    "tong2",
    "tan2"
   ]
  },
  "teng2": {
   "groupe": "finales",
   "contraste": "ang-eng-ong",
   "distracteurs": [
    "tang2",
    "tong2",
    "ting2"
   ]
  },
  "tong2": {
   "groupe": "finales",
   "contraste": "ang-eng-ong",
   "distracteurs": [
    "tang2",
    "teng2",
    "tong3"
   ]
  },
  "ban1": {
   "groupe": "finales",
   "contraste": "an-ang",
   "distracteurs": [
    "bang1",
    "ben1",
    "ban3"
   ]
  },
  "bang1": {
   "groupe": "finales",
   "contraste": "an-ang",
   "distracteurs": [
    "ban1",
    "beng1",
    "bang3"
   ]
  },
  "fen1": {
   "groupe": "finales",
   "contraste": "en-eng",
   "distracteurs": [
    "feng1",
    "fan1",
    "fen4"
   ]
  },
  "feng1": {
   "groupe": "finales",
   "contraste": "en-eng",
   "distracteurs": [
    "fen1",
    "fang1",
    "feng4"
   ]
  },
  "xin1": {
   "groupe": "finales",
   "contraste": "in-ing",
   "distracteurs": [
    "xing1",
    "xun1",
    "xin4"
   ]
  },
  "xing1": {
   "groupe": "finales",
   "contraste": "in-ing",
   "distracteurs": [
    "xin1",
    "xiang1",
    "xing2"
   ]
  },
  "nian2": {
   "groupe": "finales",
   "contraste": "ian-iang",
   "distracteurs": [
    "niang2",
    "nin2",
    "nian3"
   ]
  },
  "niang2": {
   "groupe": "finales",
   "contraste": "ian-iang",
   "distracteurs": [
    "nian2",
    "ning2",
    "niang4"
   ]
  },
  "ju4": {
   "groupe": "u-cache",
   "contraste": "ju-zhu",
   "distracteurs": [
    "zhu4",
    "qu4",
    "ju3"
   ]
  },
  "zhu4": {
   "groupe": "u-cache",
   "contraste": "ju-zhu",
   "distracteurs": [
    "ju4",
    "chu4",
    "zhu3"
   ]
  },
  "qu4": {
   "groupe": "u-cache",
   "contraste": "qu-chu",
   "distracteurs": [
    "chu4",
    "cu4",
    "qu3"
   ]
  },
  "chu4": {
   "groupe": "u-cache",
   "contraste": "qu-chu",
   "distracteurs": [
    "qu4",
    "cu4",
    "chu3"
   ]
  },
  "xu1": {
   "groupe": "u-cache",
   "contraste": "xu-shu",
   "distracteurs": [
    "shu1",
    "su1",
    "xu3"
   ]
  },
  "shu1": {
   "groupe": "u-cache",
   "contraste": "xu-shu",
   "distracteurs": [
    "xu1",
    "su1",
    "shu3"
   ]
  },
  "lv3": {
   "groupe": "u-cache",
   "contraste": "lv-lu",
   "distracteurs": [
    "lu3",
    "nv3",
    "lv4"
   ]
  },
  "lu3": {
   "groupe": "u-cache",
   "contraste": "lv-lu",
   "distracteurs": [
    "lv3",
    "nu3",
    "lu4"
   ]
  },
  "nv3": {
   "groupe": "u-cache",
   "contraste": "nv-nu",
   "distracteurs": [
    "nu3",
    "lv3",
    "nv4"
   ]
  },
  "nu3": {
   "groupe": "u-cache",
   "contraste": "nv-nu",
   "distracteurs": [
    "nv3",
    "lu3",
    "nu4"
   ]
  },
  "zi4": {
   "groupe": "trois-i",
   "contraste": "zi-zhi-ji",
   "distracteurs": [
    "zhi4",
    "ji4",
    "zi3"
   ]
  },
  "zhi4": {
   "groupe": "trois-i",
   "contraste": "zi-zhi-ji",
   "distracteurs": [
    "zi4",
    "ji4",
    "zhi3"
   ]
  },
  "ji4": {
   "groupe": "trois-i",
   "contraste": "zi-zhi-ji",
   "distracteurs": [
    "zi4",
    "zhi4",
    "ji3"
   ]
  },
  "si1": {
   "groupe": "trois-i",
   "contraste": "si-shi-xi",
   "distracteurs": [
    "shi1",
    "xi1",
    "si4"
   ]
  },
  "shi1": {
   "groupe": "trois-i",
   "contraste": "si-shi-xi",
   "distracteurs": [
    "si1",
    "xi1",
    "shi2"
   ]
  },
  "xi1": {
   "groupe": "trois-i",
   "contraste": "si-shi-xi",
   "distracteurs": [
    "si1",
    "shi1",
    "xi2"
   ]
  },
  "ba4": {
   "groupe": "aspiration",
   "contraste": "b-p",
   "distracteurs": [
    "pa4",
    "ma4",
    "ba3"
   ]
  },
  "pa4": {
   "groupe": "aspiration",
   "contraste": "b-p",
   "distracteurs": [
    "ba4",
    "pa2",
    "pai4"
   ]
  },
  "da4": {
   "groupe": "aspiration",
   "contraste": "d-t",
   "distracteurs": [
    "ta4",
    "na4",
    "da3"
   ]
  },
  "ta4": {
   "groupe": "aspiration",
   "contraste": "d-t",
   "distracteurs": [
    "da4",
    "ta1",
    "te4"
   ]
  },
  "ge1": {
   "groupe": "aspiration",
   "contraste": "g-k",
   "distracteurs": [
    "ke1",
    "he1",
    "ge4"
   ]
  },
  "ke1": {
   "groupe": "aspiration",
   "contraste": "g-k",
   "distracteurs": [
    "ge1",
    "he1",
    "ke3"
   ]
  },
  "zai4": {
   "groupe": "aspiration",
   "contraste": "z-c",
   "distracteurs": [
    "cai4",
    "sai4",
    "zai3"
   ]
  },
  "cai4": {
   "groupe": "aspiration",
   "contraste": "z-c",
   "distracteurs": [
    "zai4",
    "sai4",
    "cai2"
   ]
  },
  "ma2": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "ma3",
    "ma1",
    "ma4"
   ]
  },
  "ma3": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "ma2",
    "ma1",
    "ma4"
   ]
  },
  "yu2": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "yu3",
    "yu1",
    "yu4"
   ]
  },
  "yu3": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "yu2",
    "yu1",
    "yu4"
   ]
  },
  "shi2": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "shi3",
    "shi1",
    "shi4"
   ]
  },
  "shi3": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "shi2",
    "shi1",
    "shi4"
   ]
  },
  "hu2": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "hu3",
    "hu1",
    "hu4"
   ]
  },
  "hu3": {
   "groupe": "tons",
   "contraste": "ton2-ton3",
   "distracteurs": [
    "hu2",
    "hu1",
    "hu4"
   ]
  },
  "tang1": {
   "groupe": "tons",
   "contraste": "ton1-ton4",
   "distracteurs": [
    "tang4",
    "tang2",
    "tang3"
   ]
  },
  "tang4": {
   "groupe": "tons",
   "contraste": "ton1-ton4",
   "distracteurs": [
    "tang1",
    "tang2",
    "tang3"
   ]
  }
 },
 "ordre": [
  "p-zhang1",
  "p-zang1",
  "p-jiang1",
  "p-zhao3",
  "p-zao3",
  "p-jiao3",
  "p-chang2",
  "p-cang2",
  "p-qiang2",
  "e-zhang1",
  "e-zang1",
  "e-jiang1",
  "e-zhao3",
  "e-zao3",
  "e-jiao3",
  "p-shao3",
  "p-sao3",
  "p-xiao3",
  "p-shan1",
  "p-san1",
  "p-xian1",
  "e-chang2",
  "e-cang2",
  "e-qiang2",
  "p-re4",
  "p-le4",
  "p-ru4",
  "p-lu4",
  "e-shao3",
  "e-sao3",
  "e-xiao3",
  "e-shan1",
  "e-san1",
  "e-xian1",
  "p-dang1",
  "p-deng1",
  "p-dong1",
  "p-tang2",
  "p-teng2",
  "p-tong2",
  "e-re4",
  "e-le4",
  "e-ru4",
  "e-lu4",
  "p-ban1",
  "p-bang1",
  "e-dang1",
  "e-deng1",
  "e-dong1",
  "e-tang2",
  "e-teng2",
  "e-tong2",
  "p-fen1",
  "p-feng1",
  "e-ban1",
  "e-bang1",
  "p-xin1",
  "p-xing1",
  "e-fen1",
  "e-feng1",
  "p-nian2",
  "p-niang2",
  "e-xin1",
  "e-xing1",
  "p-ju4",
  "p-zhu4",
  "e-nian2",
  "e-niang2",
  "p-qu4",
  "p-chu4",
  "e-ju4",
  "e-zhu4",
  "p-xu1",
  "p-shu1",
  "e-qu4",
  "e-chu4",
  "p-lv3",
  "p-lu3",
  "e-xu1",
  "e-shu1",
  "p-nv3",
  "p-nu3",
  "e-lv3",
  "e-lu3",
  "p-zi4",
  "p-zhi4",
  "p-ji4",
  "e-nv3",
  "e-nu3",
  "p-si1",
  "p-shi1",
  "p-xi1",
  "e-zi4",
  "e-zhi4",
  "e-ji4",
  "p-ba4",
  "p-pa4",
  "e-si1",
  "e-shi1",
  "e-xi1",
  "p-da4",
  "p-ta4",
  "e-ba4",
  "e-pa4",
  "p-ge1",
  "p-ke1",
  "e-da4",
  "e-ta4",
  "p-zai4",
  "p-cai4",
  "e-ge1",
  "e-ke1",
  "p-ma2",
  "p-ma3",
  "p-yu2",
  "p-yu3",
  "p-shi2",
  "p-shi3",
  "p-hu2",
  "p-hu3",
  "e-zai4",
  "e-cai4",
  "p-tang1",
  "p-tang4",
  "e-ma2",
  "e-ma3",
  "e-yu2",
  "e-yu3",
  "e-shi2",
  "e-shi3",
  "e-hu2",
  "e-hu3",
  "e-tang1",
  "e-tang4"
 ]
};
const TABLEAU = [
 {
  "id": "consonnes",
  "titre": "Les consonnes (initiales)",
  "intro": "Une consonne ne se dit jamais seule : chaque ligne se lit avec sa voyelle d'appel, la même pour toute la ligne.",
  "colonnes": [
   "non aspirée",
   "aspirée",
   "frottée",
   "nasale",
   "l, r"
  ],
  "lignes": [
   {
    "titre": "Les deux lèvres (f : lèvre et dents) · avec o",
    "cases": [
     [
      "b",
      "bo1"
     ],
     [
      "p",
      "po1"
     ],
     [
      "f",
      "fo1"
     ],
     [
      "m",
      "mo1"
     ],
     null
    ]
   },
   {
    "titre": "Pointe de la langue derrière les dents du haut · avec e",
    "cases": [
     [
      "d",
      "de1"
     ],
     [
      "t",
      "te1"
     ],
     null,
     [
      "n",
      "ne1"
     ],
     [
      "l",
      "le1"
     ]
    ]
   },
   {
    "titre": "Fond de la langue contre le palais mou · avec e",
    "cases": [
     [
      "g",
      "ge1"
     ],
     [
      "k",
      "ke1"
     ],
     [
      "h",
      "he1"
     ],
     null,
     null
    ]
   },
   {
    "titre": "Langue à plat contre le palais, lèvres étirées · avec i",
    "cases": [
     [
      "j",
      "ji1"
     ],
     [
      "q",
      "qi1"
     ],
     [
      "x",
      "xi1"
     ],
     null,
     null
    ]
   },
   {
    "titre": "Pointe de la langue retroussée · avec i",
    "cases": [
     [
      "zh",
      "zhi1"
     ],
     [
      "ch",
      "chi1"
     ],
     [
      "sh",
      "shi1"
     ],
     null,
     [
      "r",
      "ri1"
     ]
    ]
   },
   {
    "titre": "Pointe de la langue contre les dents · avec i",
    "cases": [
     [
      "z",
      "zi1"
     ],
     [
      "c",
      "ci1"
     ],
     [
      "s",
      "si1"
     ],
     null,
     null
    ]
   }
  ],
  "notes": [
   "Les trois dernières lignes se lisent aussi en colonnes : <b>j · zh · z</b>, <b>q · ch · c</b>, <b>x · sh · s</b>, les confusions travaillées par les cartes.",
   "Aspirée : un souffle net sort avec la consonne (mettez la main devant la bouche). Non aspirée : pas de souffle, mais pas sonore non plus : b se rapproche d'un p français.",
   "y et w ne sont pas des consonnes : ils écrivent i, u, ü en début de syllabe (tableau suivant)."
  ]
 },
 {
  "id": "voyelles",
  "titre": "Les voyelles (finales)",
  "intro": "Une ligne par voyelle de base, une colonne par voyelle d'attaque (médiane) : i, u ou ü. Sans consonne, une finale qui commence par i, u ou ü s'écrit avec y ou w : c'est la syllabe entendue.",
  "colonnes": [
   "sans médiane",
   "i…",
   "u…",
   "ü…"
  ],
  "lignes": [
   {
    "titre": null,
    "cases": [
     null,
     [
      "i",
      "yi1"
     ],
     [
      "u",
      "wu1"
     ],
     [
      "ü",
      "yu1"
     ]
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "a",
      "a1"
     ],
     [
      "ia",
      "ya1"
     ],
     [
      "ua",
      "wa1"
     ],
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "o",
      "o1"
     ],
     null,
     [
      "uo",
      "wo1"
     ],
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "e",
      "e1"
     ],
     [
      "ie",
      "ye1"
     ],
     null,
     [
      "üe",
      "yue1"
     ]
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "ai",
      "ai1"
     ],
     null,
     [
      "uai",
      "wai1"
     ],
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "ei",
      "ei1"
     ],
     null,
     [
      "uei",
      "wei1"
     ],
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "ao",
      "ao1"
     ],
     [
      "iao",
      "yao1"
     ],
     null,
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "ou",
      "ou1"
     ],
     [
      "iou",
      "you1"
     ],
     null,
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "an",
      "an1"
     ],
     [
      "ian",
      "yan1"
     ],
     [
      "uan",
      "wan1"
     ],
     [
      "üan",
      "yuan1"
     ]
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "en",
      "en1"
     ],
     [
      "in",
      "yin1"
     ],
     [
      "uen",
      "wen1"
     ],
     [
      "ün",
      "yun1"
     ]
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "ang",
      "ang1"
     ],
     [
      "iang",
      "yang1"
     ],
     [
      "uang",
      "wang1"
     ],
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "eng",
      "eng1"
     ],
     [
      "ing",
      "ying1"
     ],
     [
      "ueng",
      "weng1"
     ],
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "ong",
      "dong1"
     ],
     [
      "iong",
      "yong1"
     ],
     null,
     null
    ]
   },
   {
    "titre": null,
    "cases": [
     [
      "er",
      "er1"
     ],
     null,
     null,
     null
    ]
   }
  ],
  "notes": [
   "ong ne se dit jamais sans consonne : on l'entend ici dans dōng.",
   "Après une consonne, iou, uei et uen s'écrivent <b>iu</b>, <b>ui</b>, <b>un</b> (liù, guì, lùn) ; après j, q, x, y, ü s'écrit <b>u</b> (jù, quán, xué, yún).",
   "Le e de ie et üe, et le a de ian, se disent presque « è »."
  ]
 },
 {
  "id": "trois-i",
  "titre": "Trois sons écrits i",
  "intro": "Après z, c, s et après zh, ch, sh, r, la lettre i ne se dit pas « i » : la voyelle prolonge la consonne.",
  "colonnes": [
   "après j, q, x",
   "après z, c, s",
   "après zh, ch, sh, r"
  ],
  "lignes": [
   {
    "titre": null,
    "cases": [
     [
      "i",
      "ji1"
     ],
     [
      "i",
      "zi1"
     ],
     [
      "i",
      "zhi1"
     ]
    ]
   }
  ],
  "notes": []
 }
];
