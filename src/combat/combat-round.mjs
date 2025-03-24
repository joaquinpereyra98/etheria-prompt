import ETHERIA_CONST from "../constants.mjs";

/**
 * Handle end of combat round effects
 * @param {Combat} combat - The combat instance being updated
 * @param {Object} updateData - The properties being updated, including round and turn
 * @param {Object} updateOptions - Options like time advance and direction
 */
export async function onEndCombatRound(combat, updateData, updateOptions) {
  if (!game.user.isGM || updateOptions.direction < 0) return;

  for (const actor of combat.combatants.map((c) => c.actor)) {
    const {
      manarecovery,
      mana_prop,
      manamax,
      staminarecovery,
      stamina_prop,
      staminamax,
    } = actor.system.attributes;
    const { bleed, poison, regain, burn } = findCombatEffects(actor.effects);

    const bleedStack = bleed.reduce((sum, e) => sum + e.stack, 0);

    if (regain.stack > 0) {
      const regainStack = regain.reduce((sum, e) => sum + e.stack, 0);
      await actor.applyDamage({
        value: bleedStack > 0 ? regainStack / 2 : regainStack,
        type: "Healing",
        isHealing: true,
      });
    }
    await actor.update({
      "system.attributes.mana_prop.value": Math.min(
        manamax.value,
        mana_prop.value + manarecovery.value
      ),
      "system.attributes.stamina_prop.value": Math.min(
        staminamax.value,
        stamina_prop.value + staminarecovery.value
      ),
    });

    const tokens = actor.getActiveTokens(true);
    if (tokens) {
      const text = `Recover Stamina and Mana`;
      for (const t of tokens) {
        if (!t.visible || !t.renderable) continue;
        canvas.interface.createScrollingText(t.center, text, {
          duration: 2500,
          anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
          direction: CONST.TEXT_ANCHOR_POINTS.TOP,
          distance: t.h * 0.6,
          jitter: 0.25,
          fill: "#ffffff",
          fontSize: 40,
          fontWeight: "bold",
          strokeThickness: 3,
        });
      }
    }

    await actor.applyDamage({ value: bleedStack, type: "blood" });
    for (const bleedEffect of bleed) {
      if (bleedEffect.stack - 1 === 0) await bleedEffect.effect.delete();
      else await bleedEffect.effect.setFlag(ETHERIA_CONST.moduleID, "stack", bleedEffect.stack - 1);
    }

    const poisonStack = poison.reduce((sum, e) => sum + e.stack, 0);
    await actor.applyDamage({ value: poisonStack, type: "nature" });
    for (const poisonEffect of poison) {
      if (poisonEffect.stack - 1 === 0) await poisonEffect.effect.delete();
      else await poisonEffect.effect.setFlag(ETHERIA_CONST.moduleID, "stack", poisonEffect.stack - 1);
    }

    const burnStack = burn.reduce((sum, e) => sum + e.stack, 0);
    await actor.applyDamage({ value: burnStack * 2, type: "fire" });
    for (const burnEffect of burn) {
      if (Math.floor(burnEffect.stack * 0.5) === 0) await burnEffect.effect.delete();
      else await burnEffect.effect.setFlag(ETHERIA_CONST.moduleID, "stack", Math.floor(burnEffect.stack * 0.5));
    }
  }
}

function findCombatEffects(effects) {
  const getEffects = (name) => {
    return effects
      .filter((e) => e.name === name)
      .map((effect) => ({
        effect: effect,
        stack: effect?.getFlag(ETHERIA_CONST.moduleID, "stack") ?? 0,
      }));
  };

  return {
    bleed: getEffects("Bleed"),
    poison: getEffects("Poison"),
    regain: getEffects("Healing Over Time"),
    burn: getEffects("Burning"),
  };
}
