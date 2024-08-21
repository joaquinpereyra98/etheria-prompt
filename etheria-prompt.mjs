import ETHERIA_CONST from "./src/constants.mjs";
import rollAttack from "./src/actors-methods/rollAttack.mjs";
import etheriaSockerHelper from "./src/socket-helper.mjs";

Hooks.on("init", () => {
  console.log(`${ETHERIA_CONST.moduleName} | Initializing ${ETHERIA_CONST.moduleID}}`);
  //Add to gActor#rollAttack
  CONFIG.Actor.documentClass.prototype.rollAttack = rollAttack;
});

Hooks.on("ready", () => {
  game.modules.get(ETHERIA_CONST.moduleID).etheriaSockerHelper =
    new etheriaSockerHelper();
});
