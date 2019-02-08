
// There is a little too much stuff about glyph effects to put in constants.

// The last glyph type you can only get if you got teresa reality
const GLYPH_TYPES = ["time", "dilation", "replication", "infinity", "power", "teresa"]
const GLYPH_SYMBOLS = { time: "Δ", dilation: "Ψ", replication: "Ξ", infinity: "∞", power: "Ω", teresa: "Ϙ" }

const GlyphCombiner = Object.freeze({
  add: x => x.reduce(Number.sumReducer, 0),
  multiply: x => x.reduce(Number.prodReducer, 1),
});

/**
 * Multiple glyph effects are combined into a summary object of this type.
 * @typedef {Object} GlyphEffectConfig__combine_result
 * @property {number | Decimal} value The final effect value (boost to whatever)
 * @property {boolean} capped whether or not a cap or limit was applied (softcaps, etc)
*/
class GlyphEffectConfig {
  /**
  * @param {Object} setup The fields here mostly match the properties of GlyphEffectConfig
  * @param {string} setup.id powerpow, etc
  * @param {string[]} setup.glyphTypes
  * @param {string} setup.singleDesc Specify how to show a single glyph's effect. Use a string with {value}
  *  somewhere in it; that will be replaced with a number.
  * @param {string} [setup.totalDesc] (Defaults to singleDesc) specify how to show the combined effect of many
  *  glyphs.
  * @param {string} [setup.genericDesc] (Defaults to singleDesc with {value} replaced with "x") Generic
  *  description of the glyph's effect
  * @param {NumericToString<number | Decimal>} [setup.formatEffect] Format the effect's value into a string. Defaults
  *  to toFixed(3)
  * @param {NumericFunction<number | Decimal>} [setup.softcap] An optional softcap to be applied after glyph
  *  effects are combined.
  * @param {((function(number[]): GlyphEffectConfig__combine_result) | function(number[]): number)} setup.combine
  *  Specification of how multiple glyphs combine. Can be GlyphCombiner.add or GlyphCombiner.multiply for most glyphs.
  *  Otherwise, should be a function that takes a potentially empty array of numbers (each glyph's effect value)
  *  and returns a combined effect or an object with the combined effect amd a capped indicator.
  *
  */
  constructor(setup) {
    GlyphEffectConfig.checkInputs(setup);
    /** @member{string}   unique key for the effect -- powerpow, etc */
    this.id = setup.id;
    /** @member{string[]} the types of glyphs this effect can occur on */
    this.glyphTypes = setup.glyphTypes;
    /** @member{string} See info about setup, above*/
    this.singleDesc = setup.singleDesc;
    /** @member{string} See info about setup, above*/
    this.totalDesc = setup.totalDesc || setup.singleDesc;
    /** @member {string} genericDesc description of the effect without a specific value  */
    this.genericDesc = setup.genericDesc || setup.singleDesc.replace("{value}", "x");
    /** @member {NumericToString<number | Decimal>} formatEffect formatting function for the effect
    *  (just the number conversion). Combined with the description strings to make descriptions */
    this.formatEffect = setup.formatEffect || (x => x.toFixed(3));
    /** @member {function(number[]): GlyphEffectConfig__combine_result} combine Function that combines
    * multiple glyph effects into one value (adds up, applies softcaps, etc)
    */
    this.combine = GlyphEffectConfig.setupCombine(setup);
    /** @member {string[]} Split up single effect description (prefix and suffix to formatted value)*/
    this.singleDescSplit = GlyphEffectConfig.splitOnFormat(this.singleDesc);
    /** @member {string[]} Split up total effect description (prefix and suffix to formatted value)*/
    this.totalDescSplit = GlyphEffectConfig.splitOnFormat(this.totalDesc);
  }

  /** @private */
  static checkInputs(setup) {
    const KNOWN_KEYS = ["id", "glyphTypes", "singleDesc", "totalDesc", "genericDesc", "formatEffect", "combine", "softcap"]
    const unknownField = Object.keys(setup).find(k => !KNOWN_KEYS.includes(k));
    if (unknownField !== undefined) {
      throw crash(`Glyph effect "${setup.id}" includes unrecognized field "${unknownField}"`);
    }

    const unknownGlyphType = setup.glyphTypes.find(e => !GLYPH_TYPES.includes(e));
    if (unknownGlyphType !== undefined) {
      throw crash(`Glyph effect "${setup.id}" references unknown glyphType "${unknownGlyphType}"`);
    }

    let emptyCombine = setup.combine([]);
    if (typeof emptyCombine !== "number") {
      if (emptyCombine.value === undefined || emptyCombine.capped === undefined) {
        throw crash(`combine function for glyph effect "${setup.id}" has invalid return type`);
      }
    }
  }

  /**
   * @param {string} str
   * @returns {string[]}
   * @private
   */
  static splitOnFormat(str) {
    if (str.indexOf("{value}") == -1) {
      console.error(`Glyph description "${str}" does not include {value}`)
      return [str, ""];
    } else {
      return str.split("{value}");
    }
  }

  /**
   * @private
   */
  static setupCombine(setup) {
    let combine = setup.combine;
    let softcap = setup.softcap;
    let emptyCombine = combine([]);
    if (typeof (emptyCombine) === "number") {   // no supplied capped indicator
      if (softcap === undefined) {
        return effects => ({ value: combine(effects), capped: false });
      } else {
        return effects => {
          let rawValue = combine(effects);
          let cappedValue = softcap(rawValue);
          return { value: cappedValue, capped: rawValue !== cappedValue };
        }
      }
    } else {
      if (softcap !== undefined) {
        let neqTest = emptyCombine.value instanceof Decimal ? (a, b) => a.neq(b) : (a, b) => a !== b;
        return combine = effects => {
          let rawValue = combine(effects);
          let cappedValue = softcap(rawValue.value);
          return { value: cappedValue, capped: rawValue.capped || neqTest(rawValue.value, cappedValue) };
        }
      } else {
        return combine;
      }
    }
  }
}

GameDatabase.reality.glyphEffects = [
  {
    id: "timepow",
    glyphTypes: ["time"],
    singleDesc: "Time Dimension multipliers ^{value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "timespeed",
    glyphTypes: ["time"],
    singleDesc: "Multiply game speed by {value}",
    totalDesc: "Game runs × {value} faster ",
    genericDesc: "Game speed multiplier",
    combine: GlyphCombiner.multiply,
  }, {
    id: "timefreeTickMult",
    glyphTypes: ["time"],
    singleDesc: "Free tickspeed threshold multiplier ×{value}",
    genericDesc: "Free tickspeed cost multiplier",
    // accurately represent what the multiplier actually does in code, assuming TS171
    // The multiplier is applied only to the part of the multiplier > 1, which means it has less effect
    // than the description implies.
    /** @type{function(number): string} */
    formatEffect: x => (x + (1 - x) / TS171_MULTIPLIER).toFixed(3),
    combine: GlyphCombiner.multiply,
    /** @type{function(number): number} */
    softcap: value => Math.max(1e-5, value), // Cap it at "effectively zero", but this effect only ever reduces the threshold by 20%
  }, {
    id: "timeeternity",
    glyphTypes: ["time"],
    singleDesc: "Multiply EP gain by {value}",
    totalDesc: "EP gain ×{value}",
    genericDesc: "EP gain multiplier",
    formatEffect: x => shorten(x, 2, 0),
    combine: GlyphCombiner.multiply,
  }, {
    id: "dilationdilationMult",
    glyphTypes: ["dilation"],
    singleDesc: "Multiply Dilated Time gain by {value}",
    totalDesc: "DT gain ×{value}",
    formatEffect: x => shorten(x, 2, 0),
    combine: GlyphCombiner.multiply,
  }, {
    id: "dilationgalaxyThreshold",
    glyphTypes: ["dilation"],
    singleDesc: "Free galaxy threshold multiplier ×{value}",
    genericDesc: "Free galaxy cost multiplier",
    combine: GlyphCombiner.multiply,
  }, {  // TTgen generates slowly TT, value amount is per second, displayed per hour
    id: "dilationTTgen",
    glyphTypes: ["dilation"],
    singleDesc: "Generates {value} TT per hour",
    totalDesc: "Generating {value} TT per hour",
    genericDesc: "TT generation",
    /** @type {function(number): string} */
    formatEffect: x => (3600 * x).toFixed(2),
    combine: GlyphCombiner.add,
  }, {
    id: "dilationpow",
    glyphTypes: ["dilation"],
    // FIXME, <br> is a little weird to have here
    singleDesc: "Normal Dimension multipliers <br>^{value} while dilated",
    totalDesc: "Normal Dimension multipliers ^{value} while dilated",
    genericDesc: "Normal Dimensions ^x while dilated",
    combine: GlyphCombiner.multiply,
    /** @type {function(number): number} */
    softcap: value => value > 10 ? 10 + Math.pow(value - 10, 0.5) : value,
  }, {
    id: "replicationspeed",
    glyphTypes: ["replication"],
    singleDesc: "Multiply replication speed by {value}",
    totalDesc: "Replication speed ×{value}",
    genericDesc: "Replication speed multiplier",
    formatEffect: x => shorten(x, 2, 0),
    combine: GlyphCombiner.multiply,
  }, {
    id: "replicationpow",
    glyphTypes: ["replication"],
    singleDesc: "Replicanti multiplier ^{value}",
    combine: effects => {
      // Combines things additively, while keeping a null value of 1.
      return { value: effects.reduce(Number.sumReducer, 1 - effects.length), capped: false };
    }
  }, {
    id: "replicationdtgain",
    glyphTypes: ["replication"],
    singleDesc: "Multiply DT gain by <br>log₁₀(replicanti)×{value}",
    totalDesc: "DT gain from log₁₀(replicanti)×{value}",
    genericDesc: "DT gain multiplier (log₁₀(replicanti))",
    formatEffect: x => x.toFixed(5),
    combine: GlyphCombiner.add,
  }, {
    id: "replicationglyphlevel",
    glyphTypes: ["replication"],
    singleDesc: "Replicanti scaling for next glyph level: <br>^0.4 ➜ ^(0.4 + {value})",
    totalDesc: "Replicanti scaling for next glyph level: ^0.4 ➜ ^(0.4 + {value})",
    genericDesc: "Replicanti scaling for glyph level",
    combine: effects => {
      let sum = effects.reduce(Number.sumReducer, 0);
      if (effects.length > 2) sum *= 6 / (effects.length + 4);
      return sum > 0.1
        ? { value: 0.1 + 0.2 * (sum - 0.1), capped: true }
        : { value: sum, capped: effects.length > 2 };
    }
  }, {
    id: "infinitypow",
    glyphTypes: ["infinity"],
    singleDesc: "Infinity Dimension multipliers ^{value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "infinityrate",
    glyphTypes: ["infinity"],

    singleDesc: "Infinity power conversion rate: <br>^7 ➜ ^(7 + {value})",
    totalDesc: "Infinity power conversion rate: ^7 ➜ ^(7 + {value})",
    genericDesc: "Infinity power conversion rate",
    formatEffect: x => x.toFixed(2),
    combine: GlyphCombiner.add,
    /** @type {function(number):number} */
    softcap: value => value > 0.7 ? 0.7 + 0.2 * (value - 0.7) : value,
  }, {
    id: "infinityipgain",
    glyphTypes: ["infinity"],
    singleDesc: "Multiply IP gain by {value}",
    totalDesc: "IP gain ×{value}",
    genericDesc: "IP gain multiplier",
    formatEffect: x => shorten(x, 2, 0),
    combine: GlyphCombiner.multiply,
  }, {
    id: "infinityinfmult",
    glyphTypes: ["infinity"],
    singleDesc: "Multiply infinitied stat gain by {value}",
    totalDesc: "Infinitied stat gain ×{value}",
    genericDesc: "Infinitied stat gain multiplier",
    formatEffect: x => shorten(x, 2, 0),
    combine: GlyphCombiner.multiply,
  }, {  //  * pow is for exponent on time dim multiplier (^1.02) or something like that
    id: "powerpow",
    glyphTypes: ["power"],
    singleDesc: "Normal Dimension multipliers ^{value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "powermult",
    glyphTypes: ["power"],
    singleDesc: "Normal Dimension multipliers ×{value}",
    formatEffect: x => shorten(x, 2, 0),
    combine: effects => ({ value: effects.reduce(Decimal.prodReducer, new Decimal(1)), capped: false }),
  }, {
    id: "powerdimboost",
    glyphTypes: ["power"],
    singleDesc: "Dimension Boost multiplier ×{value}",
    genericDesc: "Dimension Boost multiplier",
    formatEffect: x => x.toFixed(2),
    combine: GlyphCombiner.multiply,
  }, {
    id: "powerbuy10",
    glyphTypes: ["power"],
    singleDesc: "Multiplies the bonus gained from buying 10 Dimensions by {value}",
    totalDesc: "Multiplier from \"Buy 10\" ×{value}",
    genericDesc: "\"Buy 10\" bonus multiplier",
    formatEffect: x => x.toFixed(2),
    combine: GlyphCombiner.multiply,
  }, {
    id: "teresawormhole",
    glyphTypes: ["teresa"],
    singleDesc: "Time modifier raised to the power of ^{value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "teresarm",
    glyphTypes: ["teresa"],
    singleDesc: "Reality Machine multiplier x{value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "teresaglyph",
    glyphTypes: ["teresa"],
    singleDesc: "Instability starting glyph level +{value}",
    combine: GlyphCombiner.add,
  }, {
    id: "teresaachievement",
    glyphTypes: ["teresa"],
    singleDesc: "Raise all achievement related effects to a power of ^{value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "teresaforgotten",
    glyphTypes: ["teresa"],
    singleDesc: "Forgotten effect {value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "teresaunknown",
    glyphTypes: ["teresa"],
    singleDesc: "Unkown celestial effect {value}",
    combine: GlyphCombiner.multiply,
  }, {
    id: "teresaantimatter",
    glyphTypes: ["teresa"],
    singleDesc: "Antimatter effect {value}",
    combine: GlyphCombiner.multiply,
  }
].reduce((prev, effect) => {
  prev[effect.id] = new GlyphEffectConfig(effect);
  return prev;
}, {});

function findGlyphTypeEffects(glyphType) {
  return Object.values(GameDatabase.reality.glyphEffects).filter(e => e.glyphTypes.includes(glyphType));
}

// These names are short; that's how we current store effect inside player
// The name is concatenated with the glyph type to make the full effect name
const timeEffects = ["pow", "speed", "freeTickMult", "eternity"]
const replicationEffects = ["speed", "pow", "dtgain", "glyphlevel"]
const dilationEffects = ["dilationMult", "galaxyThreshold", "TTgen", "pow"]
const infinityEffects = ["pow", "rate", "ipgain", "infmult"]
const powerEffects = ["pow", "mult", "dimboost", "buy10"]
const teresaEffects = ["wormhole", "rm", "glyph", "achievement", "forgotten", "unknown", "antimatter"]

/**
 * @typedef {Object} GlyphTypeInfo
 * @property {string} name
 * @property {string} symbol
 * @property {GlyphEffectConfig[]} effects
 * @property {string} color Used for glyph borders
 * @constant
 * @type {GlyphTypeInfo[]}
 */
const GlyphTypeList = [
  {
    name: "time",
    symbol: GLYPH_SYMBOLS.time,
    effects: findGlyphTypeEffects("time"),
    color: "#B241E3",
  }, {
    name: "dilation",
    symbol: GLYPH_SYMBOLS.dilation,
    effects: findGlyphTypeEffects("dilation"),
    color: "#64DD17",
  }, {
    name: "replication",
    symbol: GLYPH_SYMBOLS.replication,
    effects: findGlyphTypeEffects("replication"),
    color: "#03A9F4",
  }, {
    name: "infinity",
    symbol: GLYPH_SYMBOLS.infinity,
    effects: findGlyphTypeEffects("infinity"),
    color: "#B67F33",
  }, {
    name: "power",
    symbol: GLYPH_SYMBOLS.power,
    effects: findGlyphTypeEffects("power"),
    color: "#22aa48",
  }, {
    name: "teresa",
    symbol: GLYPH_SYMBOLS.teresa,
    effects: findGlyphTypeEffects("teresa"),
    color: "#e21717"
  }
];

/**
 * @type {Object.<string, GlyphTypeInfo>}
 */
const GlyphTypes = Object.freeze(GlyphTypeList.reduce((out, eff) => {
  out[eff.name] = eff;
  return out;
}, {}))
