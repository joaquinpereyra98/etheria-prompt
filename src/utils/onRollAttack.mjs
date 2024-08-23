import ETHERIA_CONST from "../constants.mjs";
import rollDataToMessage from "./rolldataToMessage.mjs";
import { prepareRollData, prepareRollDamageData } from "./prepareRollData.mjs";
import createRequestingDialog from "./requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";
import createReactionDialog from "./createReactionDialog.mjs";
import { requestRollModifier } from "./requestModifiers.mjs";
/**
 *
 * @param {Actor} actor -
 * @param {Object} attackAttribute
 * @param {User} user
 * @param {String} itemName
 */
export default async function onRollAttack(
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
  attackRollData.flavor = "Accuracy Roll"
  const targetsActor = game.users.get(user._id).targets.map((t) => t.actor);
  const { useData, rollDamageData } = await prepareRollDamageData(
    actor,
    itemName
  );
  for (const target of targetsActor) {
    const targetAttributes = target.system.attributes;
    const newAttackRollData = await requestRollModifier(attackRollData);
    //Request if the attack roll is valid.
    await rollDataToMessage(actor, user, newAttackRollData ?? attackRollData);
    const isValidAttack = await createRequestingDialog(attackRollData, "Attack", {
      targetName: target.name,
      actorName: actor.name,
    });
    if (!isValidAttack) continue;

    const reactionKey = await createReactionDialog(target);
    //if GM close the reacton dialog, dont roll damage.
    if (!reactionKey) return;
    //If reaction selected was Block, Dodge or Parry calc the reactionRoll and ask if hit or not.
    if (["block", "parry", "dodge"].includes(reactionKey)) {
      const attrID = targetAttributes[reactionKey]?.id;
      if (!attrID) {
        ui.notifications.error(
          `${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | The target ${target.name} does not have the attribute ${attrID}`
        );
        continue;
      }
      const reactionRollData = await prepareRollData.call(
        target,
        attrID,
        reactionKey
      );
      reactionRollData.flavor = `${reactionKey.capitalize()} Roll`
      const newReactionRollData = await requestRollModifier(reactionRollData)
      const targetDodged = await createRequestingDialog(
        newReactionRollData ?? reactionRollData,
        "Reaction",
        {
          targetName: target.name,
          reactionKey: reactionKey.capitalize(),
        }
      );
      //If GM select dont apply damage, dont rollDamage.
      if (!targetDodged) return;
      await rollDataToMessage(target, game.user, reactionRollData);
    }

    //ROLL DAMAGE PART
    const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
      const citem = await auxMeth.getcItem(item.id, item.ciKey);
      const damageType = citem.system.attributes.damageType.value
        ?.toLowerCase()
        .trim();
      await target.applyDamage({ value: rollDamageData.result, type: damageType });

  }
  await rollDataToMessage(actor, user, rollDamageData);
  //Active Item
  await actor.sheet.activateCI(
    useData.id,
    useData.value,
    useData.iscon,
    rollDamageData.result
  );
}
