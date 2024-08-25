import ETHERIA_CONST from "./src/constants.mjs";
import rollAttack from "./src/actors-methods/rollAttack.mjs";
import etheriaSockerHelper from "./src/socket-helper.mjs";
import applyDamage from "./src/actors-methods/applyDamage.mjs";
import useItem from "./src/actors-methods/useItem.mjs";
import useCurativeItem from "./src/actors-methods/useCurativeItem.mjs";

Hooks.on("init", () => {
  console.log(`${ETHERIA_CONST.moduleName} | Initializing ${ETHERIA_CONST.moduleID}}`);
  //Wrapping new methods
  CONFIG.Actor.documentClass.prototype.rollAttack = rollAttack;
  CONFIG.Actor.documentClass.prototype.applyDamage = applyDamage;
  CONFIG.Actor.documentClass.prototype.useItem = useItem;
  CONFIG.Actor.documentClass.prototype.useCurativeItem = useCurativeItem;
});

Hooks.on("ready", () => {
  game.modules.get(ETHERIA_CONST.moduleID).etheriaSockerHelper =
    new etheriaSockerHelper();
});
