import ETHERIA_CONST from "../constants.mjs";

/**
 * 
 * @param {string} attrKey 
 * @param {string} itemName 
 * @param {object} [options]
 * @param {boolean} [options.isCurativeItem] 
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
  // Emit the socket for GMs
  etheriaSockerHelper.emitForGM(
    ETHERIA_CONST.socketTypes.requestItemUseGM,
    socketData
  );
}