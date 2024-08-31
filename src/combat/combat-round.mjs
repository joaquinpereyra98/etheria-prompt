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
    const { bleed, poison, regain } = findCombatEffect(actor.effects);

    if (regain.stack > 0) {
      await actor.applyDamage({
        value: bleed.stack > 0 ? regain.stack / 2 : regain.stack,
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

    if (bleed.stack > 0) {
      await actor.applyDamage({ value: bleed.stack, type: "blood" });
      if(bleed.stack - 1 === 0) await bleed.effect.delete();
      else await bleed.effect.setFlag(ETHERIA_CONST.moduleID, "stack", bleed.stack - 1);
    }

    if (poison.stack > 0) {
      await actor.applyDamage({ value: poison.stack, type: "nature" });
      if(poison.stack - 1 === 0) await poison.effect.delete();
      else await poison.effect.setFlag(ETHERIA_CONST.moduleID, "stack", poison.stack - 1);

    }
  }
}

function findCombatEffect(effects) {
  const getEffect = (name) => {
    const effect = effects.getName(name);
    return {
      effect: effect || {},
      stack: effect?.getFlag(ETHERIA_CONST.moduleID, "stack") ?? 0,
    };
  };

  return {
    bleed: getEffect("Bleed"),
    poison: getEffect("Poison"),
    regain: getEffect("Healing Over Time"),
  };
}
