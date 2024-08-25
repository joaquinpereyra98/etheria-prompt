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
    isCurativeItem: true
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