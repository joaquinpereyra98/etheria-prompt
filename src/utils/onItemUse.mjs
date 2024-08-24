import ETHERIA_CONST from "../constants.mjs";
import rollDataToMessage from "./rolldataToMessage.mjs";
import { prepareRollData, prepareRollDamageData } from "./prepareRollData.mjs";
import createRequestingDialog from "./requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";
import {
  requestRollModifier,
  requestDamageModifier,
} from "./requestModifiers.mjs";
/**
 *
 * @param {Actor} actor -
 * @param {Object} attackAttribute
 * @param {User} user
 * @param {String} itemName
 */
export default async function onItemUse(
  actor,
  attackAttribute,
  user,
  itemName
) {
  const attackRollData = await prepareRollData.call(
    actor,
    attackAttribute.attrID,
    attackAttribute.attrKey
  );
  attackRollData.flavor = "Accuracy Roll";
  const newAttackRollData = await requestRollModifier(attackRollData);

  await rollDataToMessage(actor, user, newAttackRollData ?? attackRollData);
  const isValidAttack = await createRequestingDialog(attackRollData, "UseItem", {
    actorName: actor.name,
  });
  if (!isValidAttack) return;
  //ROLL DAMAGE PART
  const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
  await actor.sheet.useCIIcon(item.id, item.ciKey, true, true, true);
}
