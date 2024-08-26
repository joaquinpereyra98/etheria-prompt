import rollDataToMessage from "./rolldataToMessage.mjs";
import { prepareRollData, prepareRollDamageData } from "./prepareRollData.mjs";
import createRequestingDialog from "./requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";
import {
  requestRollModifier,
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
  itemName,
  options = {}
) {
  let attackRollData = await prepareRollData.call(
    actor,
    attackAttribute.attrID,
    attackAttribute.attrKey
  );
  attackRollData.flavor = "Accuracy Roll";
  attackRollData.options = {maximizeDamageOnCritic: options.maximizeDamageOnCritic ?? false};
  attackRollData = await requestRollModifier(attackRollData, false);

  await rollDataToMessage(actor, user, attackRollData);
  const isValidAttack = await createRequestingDialog(attackRollData, "UseItem", {
    actorName: actor.name,
  });
  if (!isValidAttack) return;
  if(options.isCurativeItem){
    const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
    const citem = await auxMeth.getcItem(item.id, item.ciKey);
    const damageType = citem.system.attributes.damageType.value
      ?.toLowerCase()
      .trim();
      const { useData, rollDamageData } = await prepareRollDamageData(
        actor,
        itemName
      );
      for(let target of game.user.targets){
        await target.actor.applyDamage({
          value: rollDamageData.result,
          type: damageType,
          isHealing: true
        });
      }
    await rollDataToMessage(actor, user, rollDamageData);
    //Active Item
    await actor.sheet.activateCI(
      useData.id,
      useData.value,
      useData.iscon,
      rollDamageData.result
    );

  } else{
    //Use consumable item
    const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
    await actor.sheet.useCIIcon(item.id, item.ciKey, true, true, true);
  }
}
