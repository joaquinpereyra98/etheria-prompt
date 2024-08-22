import ETHERIA_CONST from "./src/constants.mjs";
import rollAttack from "./src/actors-methods/rollAttack.mjs";
import etheriaSockerHelper from "./src/socket-helper.mjs";
import applyDamage from "./src/actors-methods/applyDamage.mjs";

Hooks.on("init", () => {
  console.log(`${ETHERIA_CONST.moduleName} | Initializing ${ETHERIA_CONST.moduleID}}`);
  //Wrap Actor#rollAttack
  CONFIG.Actor.documentClass.prototype.rollAttack = rollAttack;
  CONFIG.Actor.documentClass.prototype.applyDamage = applyDamage;
});

Hooks.on("ready", () => {
  game.modules.get(ETHERIA_CONST.moduleID).etheriaSockerHelper =
    new etheriaSockerHelper();
});
