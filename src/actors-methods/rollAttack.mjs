import ETHERIA_CONST from "../constants.mjs";

export default async function rollAttack(attrKey, itemName) {
  const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    ui.notifications.error(`${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | "${attrKey}" not is a valid attribute key`);
    return;
  }
  if(game.user.targets.size === 0){
    ui.notifications.error(`${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | You must select one or more targets`);
    return;
  }
  const socketData = {
    userUuid: game.user.uuid,
    actorUuid: this.uuid,
    attrID: attributes[attrKey].id,
    attrKey,
    itemName
  }
  const etheriaSockerHelper = game.modules.get(ETHERIA_CONST.moduleID).etheriaSockerHelper;
  // Check is current user it GM, if its directly run the handleRequest, else emit the socket
  if(game.user.isGM){
    etheriaSockerHelper.handleRequest(socketData)
  } else {
    //Emit Socket
    etheriaSockerHelper.emit(ETHERIA_CONST.socketTypes.requestGM, socketData);
  }
}
