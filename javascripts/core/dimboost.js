"use strict";

class DimBoostRequirement {
  constructor(tier, amount) {
    this.tier = tier;
    this.amount = amount;
  }

  get isSatisfied() {
    const dimension = AntimatterDimension(this.tier);
    return dimension.totalAmount.gte(this.amount);
  }
}

class DimBoost {
  static get power() {
    if (NormalChallenge(8).isRunning) {
      return new Decimal(1);
    }

    let boost = Effects.max(
      2,
      InfinityUpgrade.dimboostMult,
      InfinityChallenge(7).reward,
      InfinityChallenge(7),
      TimeStudy(81)
    )
      .toDecimal()
      .timesEffectsOf(
        TimeStudy(83),
        TimeStudy(231),
        Achievement(117),
        Achievement(142),
        GlyphEffect.dimBoostPower
      ).powEffectsOf(InfinityUpgrade.dimboostMult.chargedEffect);
    if (GlyphAlteration.isAdded("effarig")) boost = boost.pow(getSecondaryGlyphEffect("effarigforgotten"));
    return boost;
  }

  static multiplierToNDTier(tier) {
    return DimBoost.power.pow(this.totalBoosts + 1 - tier).clampMin(1);
  }

  static get maxDimensionsUnlockable() {
    return NormalChallenge(10).isRunning ? 6 : 8;
  }

  static get canUnlockNewDimension() {
    return DimBoost.purchasedBoosts + 4 < DimBoost.maxDimensionsUnlockable;
  }

  static get challenge8MaxBoosts() {
    // In Challenge 8, the only boosts that are useful are the first 5
    // (the fifth unlocks sacrifice). In IC1 (Challenge 8 and Challenge 10
    // combined, among other things), only the first 2 are useful
    // (they unlock new dimensions).
    // There's no actual problem with bulk letting the player get
    // more boosts than this; it's just that boosts beyond this are pointless.
    return NormalChallenge(10).isRunning ? 2 : 5;
  }

  static get canBeBought() {
    if (Currency.antimatter.gt(Player.infinityLimit)) return false;
    if (NormalChallenge(8).isRunning && DimBoost.purchasedBoosts >= this.challenge8MaxBoosts) return false;
    if (Ra.isRunning) return false;
    if (player.records.thisInfinity.maxAM.gt(Player.infinityGoal) &&
       (!player.break || Player.isInAntimatterChallenge)) return false;
    return true;
  }

  static get lockText() {
    if (NormalChallenge(8).isRunning && DimBoost.purchasedBoosts >= this.challenge8MaxBoosts) {
      return "Locked (8th Antimatter Dimension Autobuyer Challenge)";
    }
    if (Ra.isRunning) return "Locked (Ra's reality)";
    return null;
  }

  static get requirement() {
    return this.bulkRequirement(1);
  }

  static bulkRequirement(bulk) {
    const targetResets = DimBoost.purchasedBoosts + bulk;
    const tier = Math.min(targetResets + 3, this.maxDimensionsUnlockable);
    let amount = 20;
    const discount = Effects.sum(
      TimeStudy(211),
      TimeStudy(222)
    );
    if (tier === 6 && NormalChallenge(10).isRunning) {
      amount += Math.ceil((targetResets - 3) * (20 - discount));
    } else if (tier === 8) {
      amount += Math.ceil((targetResets - 5) * (15 - discount));
    }
    if (EternityChallenge(5).isRunning) {
      amount += Math.pow(targetResets - 1, 3) + targetResets - 1;
    }

    amount -= Effects.sum(InfinityUpgrade.resetBoost);
    if (InfinityChallenge(5).isCompleted) amount -= 1;

    amount *= InfinityUpgrade.resetBoost.chargedEffect.effectOrDefault(1);

    amount = Math.ceil(amount);

    return new DimBoostRequirement(tier, amount);
  }

  static get purchasedBoosts() {
    return Math.floor(player.dimensionBoosts);
  }

  static get freeBoosts() {
    // This was originally used for Time Compression, probably use it for something in Lai'tela now
    return 0;
  }

  static get totalBoosts() {
    return Math.floor(this.purchasedBoosts + this.freeBoosts);
  }

  static get startingDimensionBoosts() {
    return Effects.max(
      0,
      InfinityUpgrade.skipReset1,
      InfinityUpgrade.skipReset2,
      InfinityUpgrade.skipReset3,
      InfinityUpgrade.skipResetGalaxy,
    );
  }
}

function loseDimensionBoost() {
  player.dimensionBoosts = Math.max(0, player.dimensionBoosts - 1);
  Reset.dimensionBoost.reset({ force: true });
  Currency.antimatter.reset();
}

function purchasableDimensionBoostAmount() {
  // Boosts that unlock new dims are bought one at a time, unlocking the next dimension
  if (DimBoost.canUnlockNewDimension && DimBoost.requirement.isSatisfied) return 1;
  const req1 = DimBoost.bulkRequirement(1);
  if (!req1.isSatisfied) return 0;
  const req2 = DimBoost.bulkRequirement(2);
  if (!req2.isSatisfied) return 1;

  // Linearly extrapolate dimboost costs. req1 = a * 1 + b, req2 = a * 2 + b
  // so a = req2 - req1, b = req1 - a = 2 req1 - req2, num = (dims - b) / a
  const increase = req2.amount - req1.amount;
  const dim = AntimatterDimension(req1.tier);
  let maxBoosts = Math.min(Number.MAX_VALUE,
    1 + Math.floor((dim.totalAmount.toNumber() - req1.amount) / increase));
  if (DimBoost.bulkRequirement(maxBoosts).isSatisfied) {
    return maxBoosts;
  }
  // But in case of EC5 it's not, so do binary search for appropriate boost amount
  let minBoosts = 2;
  while (maxBoosts !== minBoosts + 1) {
    const middle = Math.floor((maxBoosts + minBoosts) / 2);
    if (DimBoost.bulkRequirement(middle).isSatisfied) minBoosts = middle;
    else maxBoosts = middle;
  }
  return minBoosts;
}
