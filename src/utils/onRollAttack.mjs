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
  let accuracyRollData = await prepareRollData.call(
    actor,
    attackAttribute.attrID,
    attackAttribute.attrKey
  );
  accuracyRollData.flavor = "Accuracy Roll";
  accuracyRollData.options = {
    maximizeDamageOnCritic: options.maximizeDamageOnCritic ?? true,
    applyEffectsOnHit: options.applyEffectsOnHit ?? true,
  };
  const targetsActor = game.users.get(user._id).targets.map((t) => t.actor);

  const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
  const citem = await auxMeth.getcItem(item.id, item.ciKey);
  const damageType = citem.system.attributes.damageType.value
    ?.toLowerCase()
    .trim();

  let { useData, rollDamageData } = await prepareRollDamageData(
    actor,
    itemName
  );

  rollDamageData.damageType = damageType;
  rollDamageData.options = {
    isHealing: options.isHealing ?? false,
    ignoreResistence:
      damageType === "true" || options.ignoreResistence ? true : false,
  };

  for (const target of targetsActor) {
    const targetAttributes = target.system.attributes;
    accuracyRollData = await requestRollModifier(accuracyRollData, true);

    //set is attack critic for maximize the damage later.
    rollDamageData.isCriticalHit = accuracyRollData.options
      .maximizeDamageOnCritic
      ? accuracyRollData.iscrit
      : false;

    /**
     * A hook event that fires before of run Attack roll.
     * @function etheria-prompt.preRollAttack
     * @memberof hookEvents
     * @param {Actor} actor - Actor document who was realize the attack.
     * @param {Object} accuracyRollData - Attack roll data before of rollead in the Chat but after of GM modifer.
     * @param {Actor} target - Actor document who was recieve the attack.
     * @returns {boolean} - Explicitly return `false` to prevent the roll.
     */
    if (
      Hooks.call("etheria-prompt.preRollAttack", actor, accuracyRollData) ===
      false
    )
      return;

    //Request if the attack roll is valid.
    await rollDataToMessage(actor, user, accuracyRollData);
    const isValidAttack = await createRequestingDialog(
      accuracyRollData,
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

      /**
       * A hook event that fires before of run Attack roll.
       * @function etheria-prompt.preReactionRoll
       * @memberof hookEvents
       * @param {Actor} target - Actor document who was realize the reaction.
       * @param {Object} reactionRollData - The data from the Reaction roll data before of be confirmed by GM.
       * @param {Object} accuracyRollData - The data from the Attack roll triggered the reaction.
       * @returns {boolean} - Explicitly return `false` to prevent the roll.
       */
      if (
        Hooks.call(
          "etheria-prompt.preReactionRoll",
          target,
          reactionRollData,
          accuracyRollData
        ) === false
      )
        break;

      const targetDodged = await createRequestingDialog(
        reactionRollData,
        "Reaction",
        {
          targetName: target.name,
          reactionKey: reactionKey.capitalize(),
        }
      );
      /**
       * A hook event that fires before of run Attack roll.
       * @function etheria-prompt.onReactionRoll
       * @memberof hookEvents
       * @param {Actor} target - Actor document who was realize the reaction.
       * @param {Object} reactionRollData - The data from the Reaction roll.
       * @param {Object} accuracyRollData - The data from the Attack roll.
       */
      Hooks.callAll(
        "etheria-prompt.onReactionRoll",
        target,
        reactionRollData,
        accuracyRollData
      );
      //If GM select dont apply damage, dont rollDamage.
      if (!targetDodged) return;
      await rollDataToMessage(target, game.user, reactionRollData);
    }

    rollDamageData = await requestDamageModifier(
      rollDamageData,
      rollDamageData.damageType,
      target.system.attributes
    );

    await target.applyDamage({
      value: rollDamageData.result,
      type: rollDamageData.damageType,
      ignoreResistence: rollDamageData.options.ignoreResistence,
      isHealing: rollDamageData.options.isHealing,
    });

    //Apply active effecto to target if applyEffectsOnHit is true
    if (accuracyRollData.options.applyEffectsOnHit) {
      const targetEffects = target.effects;
      const newEffects = [];
      const effectsUpdates = [];
      const deltaEffects = [];
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
          deltaEffects.push({
            id: effectOnActor._id,
            stack: itemStack,
            deltaStack: deltaEffects,
          });
        } else {
          newEffects.push(ef.clone());
        }
      }
      /**
       * A hook event that fires before a apply effects on the target.
       * @function etheria-prompt.preApplyEffects
       * @memberof hookEvents
       * @param {Actor} target - Actor Document to which the effects will be applied
       * @param {ActiveEffect[]} newEffects An array of ActiveEffect data to be created
       * @param {Object[]} deltaEffects - An array of ids, stack value before the change and delta stack of the modified ActiveEffects
       * @returns {boolean} - Explicitly return `false` to prevent apply effects.
       */
      if (
        Hooks.call(
          "etheria-prompt.preApplyEffects",
          target,
          newEffects,
          deltaEffects
        ) === false
      )
        continue;

      const createdEffects = await target.createEmbeddedDocuments(
        "ActiveEffect",
        newEffects
      );
      await target.updateEmbeddedDocuments("ActiveEffect", effectsUpdates);

      /**
       * A hook event that fires after a apply effects on the target.
       * @function etheria-prompt.onApplyEffects
       * @memberof hookEvents
       * @param {Actor} target - Actor Document to which the effects was applied
       * @param {ActiveEffect[]} createdEffects - An array of created ActiveEffect Documents instances
       * @param {Object[]} effectsUpdates - An array of differential data objects, each used to update a single Active Effect Document
       */
      Hooks.callAll(
        "etheria-prompt.onApplyEffects",
        target,
        createdEffects,
        effectsUpdates
      );
    }
  }
  await rollDataToMessage(actor, user, rollDamageData);

  /**
   * A hook event that fires after a Attack roll.
   * @function etheria-prompt.onRollAttack
   * @memberof hookEvents
   * @param {Actor} actor
   * @param {Object} accuracyRollData
   * @param {Object} rollDamageData
   */
  Hooks.callAll(
    "etheria-prompt.onRollAttack",
    actor,
    accuracyRollData,
    rollDamageData
  );

  //Active Item
  await actor.sheet.activateCI(
    useData.id,
    useData.value,
    useData.iscon,
    rollDamageData.result
  );
}
