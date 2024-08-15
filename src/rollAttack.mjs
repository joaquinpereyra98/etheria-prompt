import prepareRollData from "./prepareRollData.mjs";
import CONST from "./constants.mjs";

export default async function rollAttack({ attrKey, itemName }) {
  const { attributes } = this.system;
  if (!typeof attrKey === "string" || !attributes[attrKey]) {
    new Error(`${attrKey} not is a valid attribute key`);
    return;
  }
  const attrID = attributes[attrKey].id;
  const rollData = await prepareRollData.call(this, attrID, attrKey);
  const socketData = {
    user: game.user,
    actor: this,
    rollData,
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
