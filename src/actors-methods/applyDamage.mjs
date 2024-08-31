/**
 * Represents a source of damage or healing.
 *
 * @typedef {object} DamageDescription
 * @property {number} value - The amount of damage or healing.
 * @property {string} type - The type of damage or healing.
 * @property {boolean} [isHealing=false] - Indicates if this is healing (true) or damage (false).
 * @property {boolean} [ignoreResistence=false] - If true, resistance does not affect this damage.
 */

/**
 * Applies damage or healing to the Actor's health pool.
 *
 * @param {DamageDescription} damage - The description of the damage or healing.
 * @returns {Promise<Actor>} - Returns true if the health was updated, false otherwise.
 */
export default async function applyDamage(damage) {
  const hp = this.system.attributes.hp;
  const deltaHP = damage.isHealing 
    ? calculateHeal.call(this, damage) 
    : calculateDamage.call(this, damage);

  if (!deltaHP) return this;

  const updates = {
    "system.attributes.hp.value": Math.max(hp.value - deltaHP, 0),
  };
  if(this.getActiveTokens(true)){
    const tokens = this.getActiveTokens(true);
    const text = `Apply ${deltaHP > 0 ? "Damage": "Heal"} ${Math.abs(deltaHP)}`;
    for (const t of tokens) {
      if ( !t.visible || !t.renderable ) continue;
      canvas.interface.createScrollingText(t.center, text,{
        duration: 2500,
        anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        direction: deltaHP < 0 ? CONST.TEXT_ANCHOR_POINTS.TOP : CONST.TEXT_ANCHOR_POINTS.BOTTOM,
        distance: (t.h*0.60),
        jitter: 0.25,
        fill: deltaHP > 0 ? "#d20000":"#009d00",
        fontSize: 40,
        fontWeight: "bold",
        strokeThickness: 3
      })
    }
  }
  return await this.update(updates);
}

/**
 * Calculates the damage to apply, considering resistances.
 *
 * @param {DamageDescription} damage - The description of the damage.
 * @returns {number|false} - The final damage to apply, or false if an error occurred.
 */
function calculateDamage(damage) {
  const resistanceAttribute = this.system.attributes[`${damage.type}resistance`];

  if (damage.ignoreResistence || !resistanceAttribute) {
    return damage.value;
  }

  if (!damage.type || resistanceAttribute === undefined) {
    ui.notifications.error(
      `${ETHERIA_CONST.moduleName} | Error executing Actor#applyDamage | damage type "${damage.type}" is invalid`
    );
    return false;
  }

  let finalDamage = Math.floor(damage.value * (resistanceAttribute.value / 100));
  
  if (["bludgeoning", "piercing", "slashing"].includes(damage.type)) {
    finalDamage -= this.system.attributes.armorkeytest.value;
  }

  return finalDamage;
}

/**
 * Calculates the healing to apply, considering conditions.
 *
 * @param {DamageDescription} damage - The description of the healing.
 * @returns {number|false} - The final healing amount, or false if an error occurred.
 */
function calculateHeal(damage) {
  if (this.effects.getName('Decayed')) return false;

  const undead = game.system.api.ActorcItem_GetFromName(this, 'Undead');
  
  return (damage.type === 'holy' && undead) ? damage.value : -damage.value;
}
