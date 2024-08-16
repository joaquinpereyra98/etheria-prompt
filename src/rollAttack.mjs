import prepareRollData from "./utils/prepareRollData.mjs";
import CONST from "./constants.mjs";

export default async function rollAttack({ attrKey, itemName }) {
  const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    console.error(`${CONST.moduleName} | Error executing Actor#rollAttack | "${attrKey}" not is a valid attribute key`);
    return;
  }
  const attrID = attributes[attrKey].id;
  const rollData = await prepareRollData.call(this, attrID, attrKey);
  if(game.user.targets.size === 0){
    console.error(`${CONST.moduleName} | Error executing Actor#rollAttack | You must select one or more targets`);
    return;
  }
  const socketData = {
    user: game.user,
    actor: this,
    rollData,
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
