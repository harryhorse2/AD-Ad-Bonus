"use strict";

GameDatabase.reality.upgrades = (function() {
  const rebuyable = props => {
    props.cost = () => getHybridCostScaling(
      player.reality.rebuyables[props.id],
      1e30,
      props.initialCost,
      props.costMult,
      props.costMult / 10,
      new Decimal("1e309"),
      1e3,
      props.initialCost * props.costMult
    );
    const { effect } = props;
    props.effect = () => Math.pow(effect, player.reality.rebuyables[props.id] *
      getAdjustedGlyphEffect("realityrow1pow"));
    props.formatEffect = value => formatX(value, 2, 0);
    props.formatCost = value => format(value, 2, 0);
    return props;
  };
  return [
    rebuyable({
      name: "Temporal Amplifier",
      id: 1,
      initialCost: 1,
      costMult: 30,
      description: () => `You gain Dilated Time ${formatInt(3)} times faster`,
      effect: 3
    }),
    rebuyable({
      name: "Replicative Amplifier",
      id: 2,
      initialCost: 1,
      costMult: 30,
      description: () => `You gain Replicanti ${formatInt(3)} times faster`,
      effect: 3
    }),
    rebuyable({
      name: "Eternal Amplifier",
      id: 3,
      initialCost: 2,
      costMult: 30,
      description: () => `You gain ${formatInt(3)} times more Eternities`,
      effect: 3
    }),
    rebuyable({
      name: "Superluminal Amplifier",
      id: 4,
      initialCost: 2,
      costMult: 30,
      description: () => `You gain ${formatInt(3)} times more Tachyon Particles`,
      effect: 3
    }),
    rebuyable({
      name: "Boundless Amplifier",
      id: 5,
      initialCost: 3,
      costMult: 50,
      description: () => `You gain ${formatInt(5)} times more Infinities`,
      effect: 5
    }),
    {
      name: "Cosmically Duplicate",
      id: 6,
      cost: 15,
      requirement: "Complete your first Eternity without using Replicanti Galaxies",
      hasFailed: () => !(player.noReplicantiGalaxies && player.noEternitiesThisReality),
      checkRequirement: () => player.noReplicantiGalaxies && player.noEternitiesThisReality,
      checkEvent: GAME_EVENT.ETERNITY_RESET_BEFORE,
      description: "Replicanti speed is multiplied based on Replicanti Galaxies",
      effect: () => 1 + Replicanti.galaxies.total / 50,
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "Innumerably Construct",
      id: 7,
      cost: 15,
      requirement: "Complete your first Infinity with at most 1 galaxy",
      hasFailed: () => !(player.galaxies <= 1 && player.noInfinitiesThisReality),
      checkRequirement: () => player.galaxies <= 1 && player.noInfinitiesThisReality,
      checkEvent: GAME_EVENT.BIG_CRUNCH_BEFORE,
      description: "Infinitied stat gain is boosted from Antimatter Galaxy count",
      effect: () => 1 + player.galaxies / 30,
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "Paradoxically Attain",
      id: 8,
      cost: 15,
      requirement: "Get to Eternity without any automatic achievements",
      hasFailed: () => player.reality.gainedAutoAchievements,
      checkRequirement: () => !player.reality.gainedAutoAchievements,
      checkEvent: GAME_EVENT.ETERNITY_RESET_BEFORE,
      description: "Tachyon Particle gain is boosted based on achievement multiplier",
      effect: () => Math.sqrt(Achievements.power),
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "Linguistically Expand",
      id: 9,
      cost: 15,
      requirement: () => `Reality using only a single level ${formatInt(3)}+ glyph.`,
      hasFailed: () => {
        const invalidEquippedGlyphs = Glyphs.activeList.length > 1 ||
          (Glyphs.activeList.length === 1 && Glyphs.activeList[0].level < 3);
        const hasValidGlyphInInventory = Glyphs.inventory.countWhere(g => g && g.level >= 3) > 0;
        return invalidEquippedGlyphs || (Glyphs.activeList.length === 0 && !hasValidGlyphInInventory);
      },
      checkRequirement: () => Glyphs.activeList.length === 1 && Glyphs.activeList[0].level >= 3,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: "Gain another glyph slot",
      effect: () => 1
    },
    {
      name: "Existentially Prolong",
      id: 10,
      cost: 15,
      requirement: () => `Complete your first Eternity with at least ${format("1e450")} IP`,
      hasFailed: () => !player.noEternitiesThisReality,
      checkRequirement: () => player.infinityPoints.exponent >= 450 && player.noEternitiesThisReality,
      checkEvent: GAME_EVENT.ETERNITY_RESET_BEFORE,
      description: () => `Start every Reality with ${formatInt(100)} Eternities (also applies to current Reality)`
    },
    {
      name: "The Boundless Flow",
      id: 11,
      cost: 50,
      requirement: () => `${format(1e12)} banked Infinities`,
      checkRequirement: () => player.infinitiedBank.exponent >= 12,
      checkEvent: [GAME_EVENT.ETERNITY_RESET_AFTER, GAME_EVENT.SAVE_CONVERTED_FROM_PREVIOUS_VERSION],
      description: "Every second, gain 10% of the Infinities you would normally gain by Infinitying",
      effect: () => gainedInfinities().times(0.1),
      formatEffect: value => `${format(value)} per second`
    },
    {
      name: "The Knowing Existence",
      id: 12,
      cost: 50,
      requirement: () => `Eternity for ${format(1e70)} EP without Eternity Challenge 1`,
      hasFailed: () => EternityChallenge(1).completions !== 0,
      checkRequirement: () => player.eternityPoints.exponent >= 70 && EternityChallenge(1).completions === 0,
      checkEvent: GAME_EVENT.ETERNITY_RESET_AFTER,
      description: "EP multiplier based on Reality and Time Theorem count",
      effect: () => player.timestudy.theorem
        .minus(1e3).clampMin(2)
        .pow(Math.log2(Math.min(player.realities, 1e4))).clampMin(1),
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "The Telemechanical Process",
      id: 13,
      cost: 50,
      requirement: () => `Eternity for ${format("1e4000")} EP without Time Dimensions 5-8`,
      hasFailed: () => !Array.range(5, 4).every(i => TimeDimension(i).amount.equals(0)),
      checkRequirement: () => player.eternityPoints.exponent >= 4000 &&
        Array.range(5, 4).every(i => TimeDimension(i).amount.equals(0)),
      checkEvent: GAME_EVENT.ETERNITY_RESET_AFTER,
      description: () => `Unlock Time Dimension, ${formatX(5)} EP multiplier, and improved Eternity autobuyers`
    },
    {
      name: "The Eternal Flow",
      id: 14,
      cost: 50,
      requirement: () => `${format(1e7)} Eternities`,
      checkRequirement: () => player.eternities.gte(1e7),
      checkEvent: [GAME_EVENT.ETERNITY_RESET_AFTER, GAME_EVENT.SAVE_CONVERTED_FROM_PREVIOUS_VERSION],
      description: "Gain Eternities per second equal to your Reality count",
      effect: () => player.realities * RA_UNLOCKS.TT_BOOST.effect.eternity(),
      formatEffect: value => `${format(value)} per second`
    },
    {
      name: "The Paradoxical Forever",
      id: 15,
      cost: 50,
      requirement: () => `Eternity for ${format(1e10)} EP without purchasing the ${formatX(5)} EP upgrade`,
      hasFailed: () => player.epmultUpgrades !== 0,
      checkRequirement: () => player.eternityPoints.exponent >= 10 && player.epmultUpgrades === 0,
      checkEvent: GAME_EVENT.ETERNITY_RESET_AFTER,
      description: () => `Boost Tachyon Particle gain based on ${formatX(5)} EP multiplier`,
      effect: () => Math.max(Math.sqrt(Decimal.log10(EternityUpgrade.epMult.effectValue)) / 3, 1),
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "Disparity of Rarity",
      id: 16,
      cost: 1500,
      requirement: () => `Reality with ${formatInt(4)} glyphs equipped of uncommon or better rarity`,
      hasFailed: () => {
        const availableGlyphs = Glyphs.inventory.countWhere(g => g && g.strength >= 1.5);
        const equipped = Glyphs.activeList.countWhere(g => g.strength >= 1.5);
        const availableSlots = Glyphs.activeSlotCount - Glyphs.activeList.length;
        return equipped + Math.min(availableGlyphs, availableSlots) < 4;
      },
      checkRequirement: () => Glyphs.activeList.countWhere(g => g.strength >= 1.5) === 4,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: "Improve the glyph rarity formula",
      effect: 1.3,
      formatCost: value => format(value, 1, 0)
    },
    {
      name: "Duplicity of Potency",
      id: 17,
      cost: 1500,
      requirement: () => `Reality with ${formatInt(4)} glyphs equipped, each having at least ${formatInt(2)} effects`,
      hasFailed: () => {
        const availableGlyphs = Glyphs.inventory.countWhere(g => g && countEffectsFromBitmask(g.effects) >= 2);
        const equipped = Glyphs.activeList.countWhere(g => countEffectsFromBitmask(g.effects) >= 2);
        const availableSlots = Glyphs.activeSlotCount - Glyphs.activeList.length;
        return equipped + Math.min(availableGlyphs, availableSlots) < 4;
      },
      checkRequirement: () => Glyphs.activeList.countWhere(g => countEffectsFromBitmask(g.effects) >= 2) === 4,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: () => `${formatPercents(0.5)} chance to get an additional effect on glyphs`,
      effect: 0.5,
      formatCost: value => format(value, 1, 0)
    },
    {
      name: "Measure of Forever",
      id: 18,
      cost: 1500,
      requirement: () => `Reality with ${formatInt(4)} glyphs equipped, each at level ${formatInt(10)} or higher`,
      hasFailed: () => {
        const availableGlyphs = Glyphs.inventory.countWhere(g => g && g.level >= 10);
        const equipped = Glyphs.activeList.countWhere(g => g.level >= 10);
        const availableSlots = Glyphs.activeSlotCount - Glyphs.activeList.length;
        return equipped + Math.min(availableGlyphs, availableSlots) < 4;
      },
      checkRequirement: () => Glyphs.activeList.countWhere(g => g.level >= 10) === 4,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: "Eternity count boosts glyph level",
      effect: () => Math.max(Math.sqrt(player.eternities.log10()) * 0.45, 1),
      formatCost: value => format(value, 1, 0)
    },
    {
      name: "Scour to Empower",
      id: 19,
      cost: 1500,
      requirement: () => `Have a total of ${formatInt(30)} or more glyphs at once`,
      hasFailed: () => Glyphs.active.concat(Glyphs.inventory).countWhere(g => g) < 30,
      checkRequirement: () => Glyphs.active.concat(Glyphs.inventory).countWhere(g => g) >= 30,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: "You can sacrifice glyphs for permanent bonuses (Shift + click)",
      formatCost: value => format(value, 1, 0)
    },
    {
      name: "Parity of Singularity",
      id: 20,
      cost: 1500,
      requirement: () => `${formatInt(1)} year total play time and the Black Hole unlocked`,
      hasFailed: () => !BlackHole(1).isUnlocked && player.reality.realityMachines.lt(100),
      checkRequirement: () => Time.totalTimePlayed.totalYears >= 1 && BlackHole(1).isUnlocked,
      checkEvent: GAME_EVENT.GAME_TICK_AFTER,
      description: "Unlock Black Hole 2",
      formatCost: value => format(value, 1, 0)
    },
    {
      name: "Cosmic Conglomerate",
      id: 21,
      cost: 100000,
      requirement: () => `${formatInt(2800)} total galaxies from all types`,
      checkRequirement: () => Replicanti.galaxies.total + player.galaxies + player.dilation.freeGalaxies >= 2800,
      checkEvent: GAME_EVENT.GAME_TICK_AFTER,
      description: "Remote galaxy scaling is removed"
    },
    {
      name: "Temporal Transcendence",
      id: 22,
      cost: 100000,
      requirement: () => `${format("1e28000")} time shards`,
      checkRequirement: () => player.timeShards.exponent >= 28000,
      checkEvent: GAME_EVENT.GAME_TICK_AFTER,
      description: "Time Dimension multiplier based on days spent in this Reality",
      effect: () => Decimal.pow10(Math.pow(1 + 2 * Math.log10(Time.thisReality.totalDays + 1), 1.6)),
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "Replicative Rapidity",
      id: 23,
      cost: 100000,
      requirement: () => `Reality in under ${formatInt(15)} minutes`,
      hasFailed: () => Time.thisReality.totalMinutes >= 15,
      checkRequirement: () => Time.thisReality.totalMinutes < 15,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: "Replicanti speed is boosted based on your fastest Reality",
      effect: () => 15 / Math.clamp(Time.bestReality.totalMinutes, 1 / 12, 15),
      cap: 180,
      formatEffect: value => formatX(value, 2, 2)
    },
    {
      name: "Synthetic Symbolism",
      id: 24,
      cost: 100000,
      requirement: () => `Reality for ${formatInt(5000)} RM without glyphs`,
      hasFailed: () => Glyphs.activeList.length > 0,
      checkRequirement: () => gainedRealityMachines().gte(5000) && Glyphs.activeList.length === 0,
      checkEvent: GAME_EVENT.REALITY_RESET_BEFORE,
      description: "Gain another glyph slot",
      effect: () => 1
    },
    {
      name: "Effortless Existence",
      id: 25,
      cost: 100000,
      requirement: () => `Reach ${format("1e11111")} EP`,
      checkRequirement: () => player.eternityPoints.exponent >= 11111,
      checkEvent: GAME_EVENT.ETERNITY_RESET_AFTER,
      description: "Reality autobuyer"
    },
  ];
}());
