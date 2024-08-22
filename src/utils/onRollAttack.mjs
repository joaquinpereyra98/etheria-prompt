import ETHERIA_CONST from "../constants.mjs";
import rollDataToMessage from "./rolldataToMessage.mjs";
import { prepareRollData, prepareRollDamageData } from "./prepareRollData.mjs";
import createRequestingDialog from "./requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";
import createReactionDialog from "./createReactionDialog.mjs";
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
  const targetsActor = game.users.get(user._id).targets.map((t) => t.actor);
  const { useData, rollDamageData } = await prepareRollDamageData(
    actor,
    itemName
  );
  for (const target of targetsActor) {
    const targetAttributes = target.system.attributes;
    //Request if the attack roll is valid.
    await rollDataToMessage(actor, user, attackRollData);
    const isValidAttack = await createRequestingDialog(attackRollData, "Attack", {
      targetName: target.name,
      actorName: actor.name,
    });
    if (!isValidAttack) return;

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
      const targetDodged = await createRequestingDialog(
        reactionRollData,
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
    //TODO CREATE Actor#applyDamge and make this there.
    const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
      const citem = await auxMeth.getcItem(item.id, item.ciKey);
      const damageType = citem.system.attributes.damageType.value
        ?.toLowerCase()
        .trim();
      const resistanceAttribute = targetAttributes[`${damageType}resistance`];
      if (!damageType || !resistanceAttribute) {
        ui.notifications.error(
          `${ETHERIA_CONST.moduleName} | Error executing Actor#rollAttack | damageType ${damageType} property is invalid`
        );
        return;
      }

      let realDamage = Math.floor(
        rollDamageData.result * (resistanceAttribute.value / 100)
      );

      //If the damage is physical, subtracts the armor
      if (["bludgeoning", "piercing", "slashing"].includes(damageType))
        realDamage -= targetAttributes.armorkeytest.value;

      //Update  target actor
      await target.update({
        "system.attributes.hp.value": targetAttributes.hp.value - realDamage,
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
}
