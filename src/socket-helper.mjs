import ETHERIA_CONST from "./constants.mjs";
import onRollAttack from "./utils/onRollAttack.mjs";
import onItemUse from "./utils/onItemUse.mjs"

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
    const { requestAttackGM, createMsg, requestItemUseGM } = ETHERIA_CONST.socketTypes;
    switch (type) {
      case requestAttackGM:
        this.handleAttackRequest(payload);
        break;
      case createMsg:
        this.createMsg(payload);
        break;
      case requestItemUseGM:
        this.handelItemUseRequest(payload)
        break;
      default:
        throw new Error("Unknown socket type");
    }
  }

  /**
   * Creates a message from the user's client
   * @param {object} data
   * @param {import("../v11/common/documents/chat-message.mjs").ChatMessageData} data.messageData
   */
  async createMsg(data) {
    const { messageData } = data;
    await ChatMessage.create(messageData);
  }

  /**
   * 
   * @param {object} data 
   * @param {string} data.actorUuid - UUID of the actor who executed the attack 
   * @param {string} data.attrID - the ID of the attribute with which the attack is performed
   * @param {string} data.attrKey - the KEY  of the attribute with which the attack is performed
   * @param {string} data.userUuid - UUID of the user who executed the attack
   * @param {string} data.itemName - the name of the cItem with which the damage will be roll
   * @returns 
   */
  async handleAttackRequest(data) {
    if (!game.user.isGM) return;
    const { actorUuid, attrID, attrKey, userUuid, itemName, options={} } = data;
    const actor = await fromUuid(actorUuid);
    const user = await fromUuid(userUuid);
    await onRollAttack(actor, { attrID, attrKey }, user, itemName, options);
  }
  /**
   * 
   * @param {object} data 
   * @param {string} data.actorUuid - UUID of the actor who executed the attack 
   * @param {string} data.attrID - the ID of the attribute with which the attack is performed
   * @param {string} data.attrKey - the KEY  of the attribute with which the attack is performed
   * @param {string} data.userUuid - UUID of the user who executed the attack
   * @param {string} data.itemName - the name of the cItem with which the damage will be roll
   * @returns 
   */
  async handelItemUseRequest(data) {
    if (!game.user.isGM) return;
    const { actorUuid, attrID, attrKey, userUuid, itemName, options = {} } = data;
    const actor = await fromUuid(actorUuid);
    const user = await fromUuid(userUuid);
    await onItemUse(actor, { attrID, attrKey }, user, itemName, options);
  }

}
