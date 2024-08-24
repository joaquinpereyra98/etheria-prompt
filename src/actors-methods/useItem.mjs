import ETHERIA_CONST from "../constants.mjs";

export default async function useItem(attrKey, itemName) {
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