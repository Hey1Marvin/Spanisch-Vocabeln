/* Konjugations-Engine: regelmäßige Regeln + Unregelmäßigkeiten für 7 Zeitformen. */
window.Vamos = window.Vamos || {};

Vamos.conj = (function () {

  var TENSES = {
    presente: "Presente",
    perfecto: "Pretérito Perfecto",
    indefinido: "Indefinido",
    imperfecto: "Imperfecto",
    futuro: "Futuro",
    condicional: "Condicional",
    subjuntivo: "Subjuntivo Presente"
  };
  var PERSONS = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos"];

  var END = {
    presente: { ar: ["o", "as", "a", "amos", "áis", "an"], er: ["o", "es", "e", "emos", "éis", "en"], ir: ["o", "es", "e", "imos", "ís", "en"] },
    indefinido: { ar: ["é", "aste", "ó", "amos", "asteis", "aron"], er: ["í", "iste", "ió", "imos", "isteis", "ieron"], ir: ["í", "iste", "ió", "imos", "isteis", "ieron"] },
    imperfecto: { ar: ["aba", "abas", "aba", "ábamos", "abais", "aban"], er: ["ía", "ías", "ía", "íamos", "íais", "ían"], ir: ["ía", "ías", "ía", "íamos", "íais", "ían"] },
    subjuntivo: { ar: ["e", "es", "e", "emos", "éis", "en"], er: ["a", "as", "a", "amos", "áis", "an"], ir: ["a", "as", "a", "amos", "áis", "an"] }
  };
  var FUT_END = ["é", "ás", "á", "emos", "éis", "án"];
  var COND_END = ["ía", "ías", "ía", "íamos", "íais", "ían"];
  var HABER = ["he", "has", "ha", "hemos", "habéis", "han"];

  /* Unregelmäßige Formen/Stämme. Nur angeben, was von der Regel abweicht. */
  var IRREG = {
    ser: { presente: ["soy", "eres", "es", "somos", "sois", "son"], indefinido: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"], imperfecto: ["era", "eras", "era", "éramos", "erais", "eran"], subjuntivo: ["sea", "seas", "sea", "seamos", "seáis", "sean"] },
    estar: { presente: ["estoy", "estás", "está", "estamos", "estáis", "están"], indefinido: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"], subjuntivo: ["esté", "estés", "esté", "estemos", "estéis", "estén"] },
    ir: { presente: ["voy", "vas", "va", "vamos", "vais", "van"], indefinido: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"], imperfecto: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"], subjuntivo: ["vaya", "vayas", "vaya", "vayamos", "vayáis", "vayan"] },
    ver: { presente: ["veo", "ves", "ve", "vemos", "veis", "ven"], imperfecto: ["veía", "veías", "veía", "veíamos", "veíais", "veían"], participio: "visto" },
    tener: { presente: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"], indefinido: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"], futStem: "tendr", subjuntivo: ["tenga", "tengas", "tenga", "tengamos", "tengáis", "tengan"] },
    hacer: { presente: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"], indefinido: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"], futStem: "har", participio: "hecho", subjuntivo: ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"] },
    poder: { presente: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"], indefinido: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"], futStem: "podr", subjuntivo: ["pueda", "puedas", "pueda", "podamos", "podáis", "puedan"] },
    querer: { presente: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"], indefinido: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"], futStem: "querr", subjuntivo: ["quiera", "quieras", "quiera", "queramos", "queráis", "quieran"] },
    saber: { presente: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"], indefinido: ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"], futStem: "sabr", subjuntivo: ["sepa", "sepas", "sepa", "sepamos", "sepáis", "sepan"] },
    venir: { presente: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"], indefinido: ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"], futStem: "vendr", subjuntivo: ["venga", "vengas", "venga", "vengamos", "vengáis", "vengan"] },
    decir: { presente: ["digo", "dices", "dice", "decimos", "decís", "dicen"], indefinido: ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"], futStem: "dir", participio: "dicho", subjuntivo: ["diga", "digas", "diga", "digamos", "digáis", "digan"] },
    dar: { presente: ["doy", "das", "da", "damos", "dais", "dan"], indefinido: ["di", "diste", "dio", "dimos", "disteis", "dieron"], subjuntivo: ["dé", "des", "dé", "demos", "deis", "den"] },
    poner: { presente: ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"], indefinido: ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"], futStem: "pondr", participio: "puesto", subjuntivo: ["ponga", "pongas", "ponga", "pongamos", "pongáis", "pongan"] },
    salir: { presente: ["salgo", "sales", "sale", "salimos", "salís", "salen"], futStem: "saldr", subjuntivo: ["salga", "salgas", "salga", "salgamos", "salgáis", "salgan"] },
    volver: { presente: ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"], participio: "vuelto", subjuntivo: ["vuelva", "vuelvas", "vuelva", "volvamos", "volváis", "vuelvan"] },
    pedir: { presente: ["pido", "pides", "pide", "pedimos", "pedís", "piden"], indefinido: ["pedí", "pediste", "pidió", "pedimos", "pedisteis", "pidieron"], subjuntivo: ["pida", "pidas", "pida", "pidamos", "pidáis", "pidan"] },
    dormir: { presente: ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"], indefinido: ["dormí", "dormiste", "durmió", "dormimos", "dormisteis", "durmieron"], subjuntivo: ["duerma", "duermas", "duerma", "durmamos", "durmáis", "duerman"] },
    empezar: { presente: ["empiezo", "empiezas", "empieza", "empezamos", "empezáis", "empiezan"], indefinido: ["empecé", "empezaste", "empezó", "empezamos", "empezasteis", "empezaron"], subjuntivo: ["empiece", "empieces", "empiece", "empecemos", "empecéis", "empiecen"] },
    encontrar: { presente: ["encuentro", "encuentras", "encuentra", "encontramos", "encontráis", "encuentran"], subjuntivo: ["encuentre", "encuentres", "encuentre", "encontremos", "encontréis", "encuentren"] },
    entender: { presente: ["entiendo", "entiendes", "entiende", "entendemos", "entendéis", "entienden"], subjuntivo: ["entienda", "entiendas", "entienda", "entendamos", "entendáis", "entiendan"] },
    escribir: { participio: "escrito" },
    abrir: { participio: "abierto" },
    haber: { presente: ["he", "has", "ha", "hemos", "habéis", "han"], indefinido: ["hube", "hubiste", "hubo", "hubimos", "hubisteis", "hubieron"], futStem: "habr", subjuntivo: ["haya", "hayas", "haya", "hayamos", "hayáis", "hayan"] }
  };

  /* yo-Form Presente inkl. -zc-Regel (conocer → conozco, conducir → conduzco) */
  function presenteYo(inf, stem, c) {
    if (/[aeiou]cer$/.test(inf) || /[aeiou]cir$/.test(inf)) return stem.slice(0, -1) + "zco";
    return stem + END.presente[c][0];
  }

  function classOf(inf) {
    if (/ar$/.test(inf)) return "ar";
    if (/er$/.test(inf)) return "er";
    if (/ir$/.test(inf)) return "ir";
    return null;
  }

  function participio(inf) {
    var irr = IRREG[inf];
    if (irr && irr.participio) return irr.participio;
    var c = classOf(inf);
    var stem = inf.slice(0, -2);
    return c === "ar" ? stem + "ado" : stem + "ido";
  }

  /* Liefert Array mit 6 Formen oder null, wenn kein gültiges Verb. */
  function conjugate(inf, tense) {
    inf = inf.toLowerCase().trim();
    var c = classOf(inf);
    if (!c) return null;
    var irr = IRREG[inf] || {};
    if (irr[tense]) return irr[tense];

    var stem = inf.slice(0, -2);
    if (tense === "futuro" || tense === "condicional") {
      var base = irr.futStem || inf;
      var ends = tense === "futuro" ? FUT_END : COND_END;
      return ends.map(function (e) { return base + e; });
    }
    if (tense === "perfecto") {
      var p = participio(inf);
      return HABER.map(function (h) { return h + " " + p; });
    }
    if (tense === "subjuntivo") {
      // Regel: yo-Form Presente minus -o + Subjuntiv-Endung (deckt g- und zc-Verben ab)
      var pres = irr.presente ? irr.presente[0] : presenteYo(inf, stem, c);
      var subStem = /o$/.test(pres) ? pres.slice(0, -1) : stem;
      return END.subjuntivo[c].map(function (e) { return subStem + e; });
    }
    if (!END[tense]) return null;
    var forms = END[tense][c].map(function (e) { return stem + e; });
    if (tense === "presente") forms[0] = presenteYo(inf, stem, c);
    return forms;
  }

  function isKnownIrregular(inf) {
    return !!IRREG[inf.toLowerCase().trim()];
  }

  return {
    TENSES: TENSES, PERSONS: PERSONS,
    conjugate: conjugate, participio: participio, isKnownIrregular: isKnownIrregular,
    irregularVerbs: Object.keys(IRREG)
  };
})();
