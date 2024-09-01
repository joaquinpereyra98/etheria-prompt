import rollDataToMessage from "./rolldataToMessage.mjs";
import { prepareRollData, prepareRollDamageData } from "./prepareRollData.mjs";
import createRequestingDialog from "./requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";
import { requestRollModifier } from "./requestModifiers.mjs";
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
  let accuracyRollData = await prepareRollData.call(
    actor,
    attackAttribute.attrID,
    attackAttribute.attrKey
  );
  accuracyRollData.flavor = "Accuracy Roll";
  accuracyRollData.options = {
    maximizeDamageOnCritic: options.maximizeDamageOnCritic ?? false,
  };
  accuracyRollData = await requestRollModifier(accuracyRollData, false);

  const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
  const citem = await auxMeth.getcItem(item.id, item.ciKey);

  /**
   * A hook event that fires before of a use Item and roll the accuracy roll.
   * @function etheria-prompt.preUseItem
   * @memberof hookEvents
   * @param {Actor} actor - Actor document who will realize the attack.
   * @param {Object} accuracyRollData - Attack roll data before of rollead in the Chat but after of GM modifer.
   * @param {User} user - User document who will use the item.
   * @param {Item} item - Item that will be used
   * @returns {boolean} - Explicitly return `false` to prevent the roll.
   */
  if (
    Hooks.call("etheria-prompt.preUseItem", actor, accuracyRollData, user, citem) ===
    false
  )
    return;

  await rollDataToMessage(actor, user, accuracyRollData);
  const isValidAttack = await createRequestingDialog(
    accuracyRollData,
    "UseItem",
    {
      actorName: actor.name,
    }
  );
  if (!isValidAttack) return;
  if (options.isCurativeItem) {
    
    const damageType = citem.system.attributes.damageType.value
      ?.toLowerCase()
      .trim();
    const { useData, rollDamageData } = await prepareRollDamageData(
      actor,
      itemName
    );
    rollDamageData.damageType = damageType;
    rollDamageData.options = { isHealing: true, ignoreResistence: false };
    for (let target of game.user.targets) {
      /**
       * A hook event that fires before of  use a curative Item.
       * @function etheria-prompt.preUseCurativeItem
       * @memberof hookEvents
       * @param {Actor} actor - Actor document who will use the item.
       * @param {User} user - User document who will use the curative item.
       * @param {Actor} target - Actor document who will apply the healing
       * @param {Item} item - Item that will be used
       * @param {Object} rollHealData - Data of the healing roll
       * @param {Object} useData - use data of the curative data
       * @returns {boolean} - Explicitly return `false` to prevent the roll.
       */
      if (
        Hooks.call(
          "etheria-prompt.preUseCurativeItem",
          actor,
          citem,
          user,
          target.actor,
          rollDamageData,
          useData
        ) === false
      )
        return;

      await target.actor.applyDamage({
        value: rollDamageData.result,
        type: damageType,
        isHealing: true,
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
    /**
     * A hook event that fires after of  use a curative Item.
     * @function etheria-prompt.onUseCurativeItem
     * @memberof hookEvents
     * @param {Actor} actor - Actor document who was use the item.
     * @param {Object} accuracyRollData - Accuracy roll data of the use item roll.
     * @param {User} user - User document who was use the item.
     * @param {Item} item - Curative Item used
     * @param {Actor[]} targets - Actors document who recieve the healing
     * @param {Object} rollHealData - Data of the healing roll
     */
    Hooks.callAll(
      "etheria-prompt.onUseCurativeItem",
      actor,
      accuracyRollData,
      user,
      citem,
      game.user.targets.map(t => t.actor),
      rollDamageData,
    );
  } else {
    //Use consumable item
    await actor.sheet.useCIIcon(item.id, item.ciKey, true, true, true);
    /**
     * A hook event that fires after of use Item.
     * @function etheria-prompt.onUseItem
     * @memberof hookEvents
     * @param {Actor} actor - Actor document who was realize the attack.
     * @param {Object} accuracyRollData - Accuracy roll data realized by the actor
     * @param {Item} item - Item used
     */
    Hooks.callAll("etheria-prompt.onUseItem", actor, accuracyRollData, item);
  }
}
