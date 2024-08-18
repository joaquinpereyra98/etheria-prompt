import { prepareRollData } from "./utils/prepareRollData.mjs";
import CONST from "./constants.mjs";

export default async function rollAttack({ attrKey, itemName }) {
  const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    ui.notifications.error(`${CONST.moduleName} | Error executing Actor#rollAttack | "${attrKey}" not is a valid attribute key`);
    return;
  }
  if(game.user.targets.size === 0){
    ui.notifications.error(`${CONST.moduleName} | Error executing Actor#rollAttack | You must select one or more targets`);
    return;
  }
  const socketData = {
    userUuid: game.user.uuid,
    actorUuid: this.uuid,
    attrID: attributes[attrKey].id,
    attrKey,
    itemName
  }
  const etheriaSockerHelper = game.modules.get(CONST.moduleID).etheriaSockerHelper;
  // Check is current user it GM, if its directly run the handleRequest, else emit the socket
  if(game.user.isGM){
    etheriaSockerHelper.handleRequest(socketData)
  } else {
    //Emit Socket
    etheriaSockerHelper.emit(CONST.socketTypes.requestGM, socketData);
  }
}
