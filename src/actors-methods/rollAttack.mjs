import ETHERIA_CONST from "../constants.mjs";
/**
 * Perform an attack roll using an attribute, and applying the damage done from an item.
 * @param {string} attrKey - The key of a actor attribute.
 * @param {string} itemName - The name of a actor's cItem.
 * @param {object} [options] - Options for the attack or damaga workflow
 * @param {boolean} [options.ignoreResistence] - Resistence affect on the damage calc?
 * @returns 
 */
export default async function rollAttack(attrKey, itemName, options = {}) {
  const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    ui.notifications.error(
      `${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | "${attrKey}" not is a valid attribute key`
    );
    return;
  }
  if (game.user.targets.size === 0) {
    ui.notifications.error(
      `${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | You must select one or more targets`
    );
    return;
  }
  const socketData = {
    userUuid: game.user.uuid,
    actorUuid: this.uuid,
    attrID: attributes[attrKey].id,
    attrKey,
    itemName,
    options
  };
  const etheriaSockerHelper = game.modules.get(
    ETHERIA_CONST.moduleID
  ).etheriaSockerHelper;
  // Emit the socket for GMs
  etheriaSockerHelper.emitForGM(
    ETHERIA_CONST.socketTypes.requestAttackGM,
    socketData
  );
}
