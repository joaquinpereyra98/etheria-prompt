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

  //Emit Socket
  game.modules
    .get(CONST.moduleID)
    .etheriaSockerHelper.emit(CONST.socketTypes.requestGM, {
      actor: this,
      rollData,
      targets: game.user.targets
    });
}
