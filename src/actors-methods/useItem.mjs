import ETHERIA_CONST from "../constants.mjs";

/**
 * Use a item item
 * @param {string} attrKey - Attribute key what realize the Accuracy Roll
 * @param {string} itemName - Name of the Curative Item what will used
 * @param {object} [options] - Object option use in the methord
 * @param {boolean} [options.isCurativeItem] - Is item a Curative Item?
 * @returns 
 */
export default async function useItem(attrKey, itemName, options = {}) {
    const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    ui.notifications.error(
      `${ETHERIA_CONST.moduleName} | Error executing Actor#useItem | "${attrKey}" not is a valid attribute key`
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
  ui.notifications.info(`${ETHERIA_CONST.moduleName} | Executing Actor#useItem`);
  // Emit the socket for GMs
  etheriaSockerHelper.emitForGM(
    ETHERIA_CONST.socketTypes.requestItemUseGM,
    socketData
  );
}