import ETHERIA_CONST from "./constants.mjs";
import rollDataToMessage from "./utils/rolldataToMessage.mjs";
import {
  prepareRollData,
  prepareRollDamageData,
} from "./utils/prepareRollData.mjs";
import requestDialog from "./utils/requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";

export default class etheriaSockerHelper {
  constructor() {
    this.identifier = `module.${ETHERIA_CONST.moduleID}`;
    this._registerSocket();
  }
  /**
   * Registers the socket listener for the module's identifier.
   * @protected
   */
  _registerSocket() {
    game.socket.on(this.identifier, ({ type, payload, userTargetID }) => {
      if (userTargetID && game.userId !== userTargetID) return;

      console.log(
        `${ETHERIA_CONST.moduleName} | Receive Socket ${this.identifier}.${type} emit by ${payload.userUuid}`
      );

      this._handleEvent(type, payload);
    });
  }

  /**
   * Emits a socket event with the specified type and payload.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data to send with the event.
   * @param {string} [userTargetID] - The optional ID of the target user.
   */
  emit(type, payload, userTargetID) {
    console.log(
      `${ETHERIA_CONST.moduleName} | Emit Socket ${this.identifier}.${type}`
    );
    game.socket.emit(this.identifier, { type, payload, userTargetID });
  }

  /**
   * Emits an event for the GM or handles it locally if the current user is the GM.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data to send with the event.
   */
  emitForGM(type, payload) {
    const gmId = game.users.activeGM?.id;
    console.log(type, payload, gmId)
    if (game.user.isGM) {
      this._handleEvent(type, payload);
    } else if (gmId) {
      this.emit(type, payload, gmId);
    }
  }

  /**
   * Emits an event for a specific user or handles it locally if the user ID matches.
   * @param {string} userTargetID - The ID of the target user.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data to send with the event.
   */
  emitForUser(userTargetID, type, payload) {
    if (game.userId === userTargetID) {
      this._handleEvent(type, payload);
    } else {
      this.emit(type, payload, userTargetID);
    }
  }

  /**
   * Handles the different types of socket events based on the type.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data associated with the event.
   * @protected
   */
  _handleEvent(type, payload) {
    const { requestGM, createMsg } = ETHERIA_CONST.socketTypes;
    switch (type) {
      case requestGM:
        this.handleRequest(payload);
        break;
      case createMsg:
        this.createMsg(payload);
        break;
      default:
        throw new Error("Unknown socket type");
    }
  }

  /**
   * 
   * TODO move all this function out of the class
   * 
   */


  async createMsg(data) {
    const { messageData } = data;
    await ChatMessage.create(messageData);
  }
  async handleRequest(data) {
    if (!game.user.isGM) return;
    const { actorUuid, attrID, attrKey, userUuid, itemName } = data;
    const actor = await fromUuid(actorUuid);
    const user = await fromUuid(userUuid);
    const attackRollData = await prepareRollData.call(actor, attrID, attrKey);
    const targetsActor = game.users.get(user._id).targets.map((t) => t.actor);
    const { useData, rollDamageData } = await prepareRollDamageData(
      actor,
      itemName
    );
    for (const target of targetsActor) {
      const targetAttributes = target.system.attributes;
      //Request if attack roll is valid.
      await rollDataToMessage(actor, user, attackRollData);
      const isValidAttack = await requestDialog(attackRollData, "Attack", {
        targetName: target.name,
        actorName: actor.name,
      });

      if (!isValidAttack) return;

      const reactionKey = await this.#createReactionDialog(target);

      //if GM close the reacton dialog, dont roll damage.
      if (!reactionKey) return;

      //If reaction selected was Block, Dodge or Parry calc the reactionRoll and ask if hit or not.
      if (["block", "parry", "dodge"].includes(reactionKey)) {
        //TODO delete agi
        const attrID = targetAttributes[reactionKey].id;
        const reactionRollData = await prepareRollData.call(
          target,
          attrID,
          reactionKey
        );
        const targetDodged = await requestDialog(reactionRollData, "Reaction", {
          targetName: target.name,
          reactionKey: reactionKey.capitalize(),
        });
        //If GM select dont apply damage, dont rollDamage.
        if (!targetDodged) return;
        await rollDataToMessage(target, game.user, reactionRollData);
      }

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
    //Create Damage Message
    await rollDataToMessage(actor, user, rollDamageData);
    //Active Item
    await actor.sheet.activateCI(
      useData.id,
      useData.value,
      useData.iscon,
      rollDamageData.result
    );
  }

  async #createReactionDialog(target) {
    const reactionDialogContent = await renderTemplate(
      `modules/${ETHERIA_CONST.moduleID}/templates/reaction-dialog-template.hbs`,
      { target, reactionOption: ETHERIA_CONST.reactionOption }
    );

    return await Dialog.prompt({
      title: `Choose the reaction of ${target.name}`,
      content: reactionDialogContent,
      label: "Roll",
      callback: (html) => {
        return html.find("input[name=reactionOption]:checked").val();
      },
      rejectClose: false,
      render: (html) => {
        html.find(".etheria-checkbox").click((ev) => {
          $(ev.currentTarget).find('input[type="radio"]').prop("checked", true);
        });
      },
      options: {
        height: 267,
      },
    });
  }
}
