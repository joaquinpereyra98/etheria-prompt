import CONST from "./src/constants.mjs";
import rollAttack from "./src/rollAttack.mjs";

Hooks.on("init", () => {
    console.log(`${CONST.moduleName} | Initializing ${CONST.moduleID}}`);

    //Add to gActor#rollAttack
    CONFIG.Actor.documentClass.prototype.rollAttack = rollAttack;
    
});