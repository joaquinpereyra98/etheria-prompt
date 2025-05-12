import ETHERIA_CONST from "../constants.mjs";

export default function registerMeasuredTemplateSetting() {

  game.settings.register(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES, {
    name: "World Measured Templates",
    hint: "",
    scope: "world",
    config: false,
    requiresReload: false,
    type: Object,
    default: {},
    onChange: () => {
      const efManager = game.etheriaHelper.templateManager;
      efManager.render(!efManager.rendered);
    }
  });
}