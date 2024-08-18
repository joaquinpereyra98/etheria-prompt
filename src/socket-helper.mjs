import CONST from "./constants.mjs";
import rollDataToMessage from "./utils/rolldataToMessage.mjs";
import {
  prepareRollData,
  prepareRollDamageData,
} from "./utils/prepareRollData.mjs";
import requestDialog from "./utils/requestDialog.mjs";
import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";

export default class etheriaSockerHelper {
  constructor() {
    this.identifier = `module.${CONST.moduleID}`;
    this.registerSocket();
  }

  registerSocket() {
    game.socket.on(this.identifier, ({ type, payload }) => {
      console.log(
        `${CONST.moduleName} | Receive Socket ${this.identifier}.${type} emit by ${payload.userUuid}`
      );
      switch (type) {
        case CONST.socketTypes.requestGM:
          this.handleRequest(payload);
          break;
        default:
          throw new Error("Unknown socket type");
      }
    });
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
      const isValidAttack = await requestDialog(attackRollData, "Attack", {
        targetName: target.name,
        actorName: actor.name,
      });

      if (!isValidAttack) return;
      await rollDataToMessage(actor, user, attackRollData);
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
        await rollDataToMessage(target, game.user ,reactionRollData);
      }

      const item = game.system.api.ActorcItem_GetFromName(actor, itemName);
      const citem = await auxMeth.getcItem(item.id, item.ciKey);
      const damageType = citem.system.attributes.damageType.value
        ?.toLowerCase()
        .trim();
      const resistanceAttribute = targetAttributes[`${damageType}resistance`];
      if (!damageType || !resistanceAttribute) {
        ui.notifications.error(
          `${CONST.moduleName} | Error executing Actor#rollAttack | damageType ${damageType} property is invalid`
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
  emit(type, payload) {
    console.log(`${CONST.moduleName} | Emit Socket ${this.identifier}.${type}`);
    game.socket.emit(this.identifier, { type, payload });
  }
  async #createReactionDialog(target) {
    const reactionDialogContent = await renderTemplate(
      `modules/${CONST.moduleID}/templates/reaction-dialog-template.hbs`,
      { target, reactionOption: CONST.reactionOption }
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
    });
  }
}
