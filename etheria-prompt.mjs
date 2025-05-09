import ETHERIA_CONST from "./src/constants.mjs";
import etheriaSockerHelper from "./src/socket-helper.mjs";

/* Actor Methods */
import * as actorMethods from "./src/actors-methods/_module.mjs";

import { renderActorAETab, renderItemAETab } from "./src/active-effect/renderActiveEffectTab.mjs";
import { renderStackInput } from "./src/active-effect/stacks-active-effect.mjs";
import { onEndCombatRound } from "./src/combat/combat-round.mjs"
import applyDamageToGroup from "./src/macros/apply-damage-to-group.mjs";
import EtheriaEffectManager from "./src/active-effect/activeEffectManager.mjs";
import getSceneControls from "./src/active-effect/getSceneControl.mjs";

Hooks.on("init", () => {
  console.log(`${ETHERIA_CONST.moduleName} | Initializing ${ETHERIA_CONST.moduleID}}`);

  //Wrapping new methods
  for (const methodKey in actorMethods) {
    const method = actorMethods[methodKey];
    CONFIG.Actor.documentClass.prototype[methodKey] = method;
  }
});

Hooks.on("ready", () => {
  game.modules.get(ETHERIA_CONST.moduleID).etheriaSockerHelper =
    new etheriaSockerHelper();

  game.etheriaHelper = {
    applyDamageToGroup,
    effectManager: new EtheriaEffectManager(),
  }
});


Hooks.on('rendergActorSheet', renderActorAETab);
Hooks.on('rendersItemSheet', renderItemAETab);
Hooks.on('renderActiveEffectConfig', renderStackInput);
Hooks.on("combatRound", onEndCombatRound);
Hooks.on("getSceneControlButtons", getSceneControls);
Hooks.on("deleteActiveEffect", EtheriaEffectManager.onChangeActiveEffect);
Hooks.on("updateActiveEffect", EtheriaEffectManager.onChangeActiveEffect);
Hooks.on("createActiveEffect", EtheriaEffectManager.onChangeActiveEffect);
Hooks.on("deleteToken", EtheriaEffectManager.onChangeToken);
Hooks.on("updateToken", EtheriaEffectManager.onChangeToken);
Hooks.on("createToken", EtheriaEffectManager.onChangeToken);