import ETHERIA_CONST from "../constants.mjs";
 
/**
 * Use a curative item, this method is a proxy of Actor#useItem
 * @param {string} attrKey - Attribute key what realize the Accuracy Roll
 * @param {string} itemName - Name of the Curative Item what will used
 * @returns 
 */
export default async function useCurativeItem(attrKey, itemName) {
    const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    ui.notifications.error(
      `${ETHERIA_CONST.moduleName} | Error executing Actor#useCurativeItem | "${attrKey}" not is a valid attribute key`
    );
    return;
  }
  const socketData = {
    userUuid: game.user.uuid,
    actorUuid: this.uuid,
    attrID: attributes[attrKey].id,
    attrKey,
    itemName,
    options : { isCurativeItem: true }
  };
  const etheriaSockerHelper = game.modules.get(
    ETHERIA_CONST.moduleID
  ).etheriaSockerHelper;
  ui.notifications.info(`${ETHERIA_CONST.moduleName} | Executing Actor#useCurativeItem`);
  // Emit the socket for GMs
  etheriaSockerHelper.emitForGM(
    ETHERIA_CONST.socketTypes.requestItemUseGM,
    socketData
  );
}