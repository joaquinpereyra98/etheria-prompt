/**
 * Description of a source of damage.
 *
 * @typedef {object} DamageDescription
 * @property {number} value - Amount of damage.
 * @property {string} type - Type of damage.
 * @property {boolean} [isHealing] - Is Healing?
 * @property {boolean} [isResistanceActive] - Did resistance affect this description?
 */
/**
 *  Apply a certain amount of damage or healing to the health pool for Actor
 * @param {DamageDescription} damage
 */
export default async function applyDamage(damage) {
  const hp = this.system.attributes.hp;
  const resistanceAttribute =
    this.system.attributes[`${damage.type}resistance`];

  if (!damage.type || !resistanceAttribute) {
    ui.notifications.error(
      `${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | damageType ${damageType} property is invalid`
    );
    return;
  }

  let deltaHP = Math.floor(damage.value * (resistanceAttribute.value / 100));

  //If the damage is physical, subtracts the armor
  if (["bludgeoning", "piercing", "slashing"].includes(damage.type))
    deltaHP -= this.system.attributes.armorkeytest.value;

  //Update target actor
  const updates = {
    "system.attributes.hp.value": Math.max(hp.value - deltaHP, 0),
  };
  await this.update(updates);
}
