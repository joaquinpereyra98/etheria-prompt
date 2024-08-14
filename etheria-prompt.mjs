import CONST from "./src/constants.mjs";
import rollAttack from "./src/rollAttack.mjs";
import etheriaSockerHelper from "./src/socket-helper.mjs";

Hooks.on("init", () => {
  console.log(`${CONST.moduleName} | Initializing ${CONST.moduleID}}`);
  //Add to gActor#rollAttack
  CONFIG.Actor.documentClass.prototype.rollAttack = rollAttack;
});

Hooks.on("ready", () => {
  game.modules.get(CONST.moduleID).etheriaSockerHelper =
    new etheriaSockerHelper();
});
