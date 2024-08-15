import CONST from "./constants.mjs";
import rollDataToMessage from "./utils/rolldataToMessage.mjs"

export default class etheriaSockerHelper {
  constructor() {
    this.identifier = `module.${CONST.moduleID}`;
    this.registerSocket();
  }

  registerSocket() {
    game.socket.on(this.identifier, ({ type, payload }) => {
      console.log(`${CONST.moduleName} | Receive Socket ${this.identifier}.${type} emit by ${payload.user.name}`);
      switch (type) {
        case CONST.socketTypes.requestGM:
          this.handleRequest(payload);
          break;
        default:
          throw new Error("Unknown socket type");
      }
    });
  }
  handleRequest(data) {
    if(!game.user.isGM) return;
    const { actor, rollData, user } = data;
    const targetsActor = game.users.get(user.id).targets.map(t => t.actor);
  
    targetsActor.forEach(async target => {
      const template = await renderTemplate(`modules/${CONST.moduleID}/templates/roll-dialog-template.hbs`, {...data, target});
      const isValidAttack = await Dialog.wait({
        title: `Attack roll made against ${target.name}`,
        content: template,
        buttons: {
          confirm: {
            label: "Confirm Roll",
            icon: '<i class="fa-regular fa-circle-check"></i>',
            callback: (html) => { return true }
          },
          reject: {
            label: "Reject Roll",
            icon: '<i class="fa-solid fa-ban"></i>',
            callback: (htlm) => { return false }
          }
        },
        close: () => { return false },
        rejectClose: false,
      });
      if(!isValidAttack) return;
      rollDataToMessage(rollData);
    });
  }
  emit(type, payload) {
    console.log(`${CONST.moduleName} | Emit Socket ${this.identifier}.${type}`);
    game.socket.emit(this.identifier, { type, payload });
  }
}
