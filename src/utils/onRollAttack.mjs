import ETHERIA_CONST from "../constants.mjs";
import rollDataToMessage from "./rolldataToMessage.mjs";
import { prepareRollData, prepareRollDamageData } from "./prepareRollData.mjs";
import createRequestingDialog from "./requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";
import createReactionDialog from "./createReactionDialog.mjs";
import {
  requestRollModifier,
  requestDamageModifier,
} from "./requestModifiers.mjs";
import rollAttack from "../actors-methods/rollAttack.mjs";
/**
 *
 * @param {Actor} actor - Actor who executed the attack
 * @param {Object} attackAttribute - Attribute with which the attack is performed
 * @param {User} user - User who executed the attack
 * @param {String} itemName - the name of the cItem with which the damage will be roll
 * @param {object} [options] - Options for the attack or damaga workflow
 * @param {boolean} [options.isHealing] - Indicates if this is healing (true) or damage (false).
 * @param {boolean} [options.ignoreResistence] - Resistence affect on the damage calc?
 * @param {boolean} [options.maximizeDamageOnCritic] - Maximize damage roll when it's a critical hit?
 * @param {boolean} [options.applyEffectsOnHit] - Applu all item active effect on target actor on hit?
 */
export default async function onRollAttack(
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
  attackRollData.options = {
    maximizeDamageOnCritic: options.maximizeDamageOnCritic ?? true,
    applyEffectsOnHit: options.applyEffectsOnHit ?? true,
  };
  const targetsActor = game.users.get(user._id).targets.map((t) => t.actor);

  let { useData, rollDamageData } = await prepareRollDamageData(
    actor,
    itemName
  );

  rollDamageData.options = {
    isHealing: options.isHealing ?? false,
    ignoreResistence: options.ignoreResistence ?? false,
  };

  for (const target of targetsActor) {
    const targetAttributes = target.system.attributes;
    attackRollData = await requestRollModifier(attackRollData, true);

    //set is attack critic for maximize the damage later.
    rollDamageData.isCriticalHit = attackRollData.options.maximizeDamageOnCritic
      ? attackRollData.iscrit
      : false;

    //Request if the attack roll is valid.
    await rollDataToMessage(actor, user, attackRollData);
    const isValidAttack = await createRequestingDialog(
      attackRollData,
      "Attack",
      {
        targetName: target.name,
        actorName: actor.name,
      }
    );
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
      let reactionRollData = await prepareRollData.call(
        target,
        attrID,
        reactionKey
      );
      reactionRollData.flavor = `${reactionKey.capitalize()} Roll`;
      reactionRollData = await requestRollModifier(reactionRollData);
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
    const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
    const citem = await auxMeth.getcItem(item.id, item.ciKey);

    const damageType = citem.system.attributes.damageType.value
      ?.toLowerCase()
      .trim();
    if (damageType === "true") rollDamageData.options.ignoreResistence = true;
    rollDamageData = await requestDamageModifier(
      rollDamageData,
      damageType,
      target.system.attributes
    );

    await target.applyDamage({
      value: rollDamageData.result,
      type: rollDamageData.damageType ?? damageType,
      ignoreResistence: rollDamageData.options.ignoreResistence,
      isHealing: rollDamageData.options.isHealing,
    });

    //Apply active effecto to target if applyEffectsOnHit is true
    if (attackRollData.options.applyEffectsOnHit) {
      const targetEffects = target.effects;
      const newEffects = [];
      const effectsUpdates = [];
      for (let ef of citem.effects) {
        const effectOnActor = targetEffects.getName(ef.name);
        if (effectOnActor) {
          const itemStack = ef.getFlag(ETHERIA_CONST.moduleID, "stack");
          const effectStack = effectOnActor.getFlag(
            ETHERIA_CONST.moduleID,
            "stack"
          );
          effectsUpdates.push({
            _id: effectOnActor._id,
            [`flags.${ETHERIA_CONST.moduleID}.stack`]: itemStack + effectStack,
          });
        } else {
          newEffects.push(ef.clone());
        }
      }
      await target.createEmbeddedDocuments("ActiveEffect", newEffects);
      await target.updateEmbeddedDocuments("ActiveEffect", effectsUpdates);
    }
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
