import CONST from "./constants.mjs";

export default class etheriaSockerHelper {
  constructor() {
    this.identifier = `module.${CONST.moduleID}`;
    this.registerSocket();
  }

  registerSocket() {
    game.socket.on(this.identifier, ({ type, payload }) => {
      switch (type) {
        case CONST.socketTypes.requestGM:
          this.#handleRequest(payload);
          break;
        default:
          throw new Error("Unknown socket type");
      }
    });
  }
  #handleRequest(arg) {
    if(game.user.isGM) {
        
    }
    
  }
  emit(type, payload) {
    console.log(`${CONST.moduleName} | Emit Socket Module.${CONST.moduleID}.${type}`);
    game.socket.emit(this.identifier, { type, payload });
  }
}
