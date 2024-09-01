# Actors Methods
## Apply Damage or Heal to the actor
### Actor#applyDamage
```js
/**
 * Represents a source of damage or healing.
 *
 * @typedef {object} DamageDescription
 * @property {number} value - The amount of damage or healing.
 * @property {string} type - The type of damage or healing.
 * @property {boolean} [isHealing=false] - Indicates if this is healing (true) or damage (false).
 * @property {boolean} [ignoreResistence=false] - If true, resistance does not affect this damage.
 */

/**
 * Applies damage or healing to the Actor's health pool.
 *
 * @param {DamageDescription} damage - The description of the damage or healing.
 * @returns {Promise<Actor>} - Returns true if the health was updated, false otherwise.
 */
```
## Actor realize a attack
### Actor#rollAttack
```js
/**
 * Perform an attack roll using an attribute, and applying the damage done from an item.
 * @param {string} attrKey - The key of a actor attribute.
 * @param {string} itemName - The name of a actor's cItem.
 * @param {object} [options] - Options for the attack or damaga workflow
 * @param {boolean} [options.isHealing] - Indicates if this is healing (true) or damage (false).
 * @param {boolean} [options.ignoreResistence] - Resistence affect on the damage calc?
 * @param {boolean} [options.maximizeDamageOnCritic] - Maximize damage roll when it's a critical hit?
 * @param {boolean} [options.applyEffectsOnHit] - Applu all item active effect on target actor on hit?
 */
```
## Actor Use Item
### Actor#useItem
```js
/**
 * Use a item item
 * @param {string} attrKey - Attribute key what realize the Accuracy Roll
 * @param {string} itemName - Name of the Curative Item what will used
 * @param {object} [options] - Object option use in the methord
 * @param {boolean} [options.isCurativeItem] - Is item a Curative Item?
 * @returns 
 */
```
### Actor#useCurativeItem
```js
/**
 * Use a curative item, this method is a proxy of Actor#useItem
 * @param {string} attrKey - Attribute key what realize the Accuracy Roll
 * @param {string} itemName - Name of the Curative Item what will used
 * @returns 
 */
```
# Hooks
```js
/**
 * A hook event that fires before of run Attack roll.
 * @function etheria-prompt.preRollAttack
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who was realize the attack.
 * @param {Object} accuracyRollData - Attack roll data before of rollead in the Chat but after of GM modifer.
 * @param {Actor} target - Actor document who was recieve the attack.
 * @returns {boolean} - Explicitly return `false` to prevent the roll.
 */
/**
 * A hook event that fires after a Attack roll.
 * @function etheria-prompt.onRollAttack
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who was realize the attack
 * @param {Object} accuracyRollData - The data from the Attack roll.
 * @param {Object} rollDamageData - The data from the Damage roll
 */
/**
 * A hook event that fires before of run Attack roll.
 * @function etheria-prompt.preReactionRoll
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who was realize the reaction.
 * @param {Object} reactionRollData - The data from the Reaction roll data before of be confirmed by GM.
 * @param {Object} accuracyRollData - The data from the Attack roll triggered the reaction.
 * @returns {boolean} - Explicitly return `false` to prevent the roll.
 */
/**
 * A hook event that fires before of run Attack roll.
 * @function etheria-prompt.onReactionRoll
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who was realize the reaction.
 * @param {Object} reactionRollData - The data from the Reaction roll.
 * @param {Object} accuracyRollData - The data from the Attack roll.
 */
/**
 * A hook event that fires before a apply effects on the target.
 * @function etheria-prompt.preApplyEffects
 * @memberof hookEvents
 * @param {Actor} target - Actor Document to which the effects will be applied
 * @param {ActiveEffect[]} newEffects An array of ActiveEffect data to be created
 * @param {Object[]} deltaEffects - An array of ids, stack value before the change and delta stack of the modified ActiveEffects
 * @returns {boolean} - Explicitly return `false` to prevent the roll.
 */
/**
 * A hook event that fires after a apply effects on the target.
 * @function etheria-prompt.onApplyEffects
 * @memberof hookEvents
 * @param {Actor} target - Actor Document to which the effects was applied
 * @param {ActiveEffect[]} createdEffects - An array of created ActiveEffect Documents instances
 * @param {Object[]} effectsUpdates - An array of differential data objects, each used to update a single Active Effect Document
 */
/**
 * A hook event that fires before a apply effects on the target.
 * @function etheria-prompt.preApplyDamage
 * @memberof hookEvents
 * @param {Actor} actor - Actor Document to which the damage/heal will be applied
 * @param {DamageDescription} damage - Source of damage or healing
 * @returns {boolean} - Explicitly return `false` to prevent the roll.
 */
/**
 * A hook event that fires before a apply effects on the target.
 * @function etheria-prompt.onApplyDamage
 * @memberof hookEvents
 * @param {Actor} actor - Updated Actor Document  which the damage/heal was be applied
 * @param {DamageDescription} damage - Source of damage or healing
 * @param {Number} deltaHP - The quantity of HP subtracted
 */
/**
 * A hook event that fires before of  use a curative Item.
 * @function etheria-prompt.preUseCurativeItem
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who will use the item.
 * @param {User} user - User document who was use the curative item.
 * @param {Actor} target - Actor document who was apply the healing
 * @param {Object} rollHealData - Data of the healing roll
 * @param {Object} useData - use data of the curative data
 * @returns {boolean} - Explicitly return `false` to prevent the roll.
 */
/**
 * A hook event that fires after of  use a curative Item.
 * @function etheria-prompt.onUseCurativeItem
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who was use the item.
 * @param {Object} accuracyRollData - Accuracy roll data of the use item roll.
 * @param {User} user - User document who was use the item.
 * @param {Actor} target - Actor document who was apply the healing
 * @param {Object} rollHealData - Data of the healing roll
 * @param {Object} useData - Item use data
 */
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
/**
 * A hook event that fires after of use Item.
 * @function etheria-prompt.onUseItem
 * @memberof hookEvents
 * @param {Actor} actor - Actor document who was realize the attack.
 * @param {Object} accuracyRollData - Accuracy roll data realized by the actor
 * @param {Item} item - Item used
 */
```