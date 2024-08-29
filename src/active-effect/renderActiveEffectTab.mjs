import ETHERIA_CONST from "../constants.mjs";
import importDFredEffectDialog from "./import-DFred-effects-dialog.mjs";

/** Handler for add active effect table on Status Effect Tab on Actors
 * @param {Application} app - The Application instance being rendered
 * @param {JQuery} $html - The inner HTML of the document that will be displayed and may be modified
 * @param {Object} data - The object of data used when rendering the application
 */
export async function renderActorAETab(app, $html, data) {
  const actor = app.actor;
  const effects = actor.effects;
  const isDFredEffect = !!game.modules.get("dfreds-convenient-effects");
  const dataRender = {
    effects: effects.map((ef) => ({
      ...ef,
      id: ef._id,
      durationLabel: ef.duration.label,
      stack: ef.getFlag(`${ETHERIA_CONST.moduleID}`, "stack") ?? 0,
    })),
    isDFredEffect,
  };
  const activeEffectSection = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/actor-active-effect-tab.hbs`,
    dataRender
  );

  const $divStatusTab = $html.find(".buffdebufftab_tab");
  $divStatusTab.append(activeEffectSection);

  $divStatusTab.find(".effect-button").on("click", async (ev) => {
    const element = ev.currentTarget;
    const dataset = element.dataset;
    switch (dataset.action) {
      case "toggle-effect":
        {
          const li = element.closest(".active-effect-item");
          const effectID = li.dataset.effectId;
          const effect = effects.get(effectID);
          console.log(effect);
          await effect.update({ disabled: !effect.disabled });
        }
        break;
      case "edit-effect":
        {
          const li = element.closest(".active-effect-item");
          const effectID = li.dataset.effectId;
          const effect = effects.get(effectID);
          effect.sheet.render(true);
        }
        break;
      case "delete-effect":
        {
          const li = element.closest(".active-effect-item");
          const effectID = li.dataset.effectId;
          const effect = effects.get(effectID);
          await effect.delete();
        }
        break;
      case "create-effect":
        {
          await actor.createEmbeddedDocuments("ActiveEffect", [
            {
              name: "New Active Effect",
              icon: "icons/svg/aura.svg",
              origin: actor.uuid,
              "duration.rounds": undefined,
              disabled: false,
              statuses: [`${ETHERIA_CONST.moduleName}`],
            },
          ]);
        }
        break;
      case "import-effect":
        {
          if (!isDFredEffect) break;
          await importDFredEffectDialog(actor);
        }
        break;
    }
  });
  $divStatusTab
    .find(".stack-input")
    .on("change", async (ev) => {
      const element = ev.currentTarget;
      const li = element.closest(".active-effect-item");
      const effectID = li.dataset.effectId;
      const effect = effects.get(effectID);
      await effect.setFlag(ETHERIA_CONST.moduleID, "stack", element.value);
    })[0]
    ?.focus();
}
/** Handler for add active effect tab  on cItems
 * @param {Application} app - The Application instance being rendered
 * @param {JQuery} $html - The inner HTML of the document that will be displayed and may be modified
 * @param {Object} data - The object of data used when rendering the application
 */
export async function renderItemAETab(app, $html, data) {
  const item = app.item;
  if (item.type !== "cItem") return;

  const effects = item.effects;
  const $tabs = $html.find("nav.sheet-tabs");
  const $sheetBody = $html.find(".sheet-body");
  $tabs.append(
    '<a class="item item-tab-button" data-tab="effects">Effects</a>'
  );
  const isDFredEffect = !!game.modules.get("dfreds-convenient-effects");
  const activeEffectSection = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/item-active-effect-tab.hbs`,
    { effects,  isDFredEffect}
  );
  $sheetBody.append(activeEffectSection);

  $sheetBody.find(".effect-button").on("click", async (ev) => {
    const element = ev.currentTarget;
    const dataset = element.dataset;
    switch (dataset.action) {
      case "edit-effect":
        {
          const li = element.closest(".active-effect-item");
          const effectID = li.dataset.effectId;
          const effect = effects.get(effectID);
          effect.sheet.render(true);
        }
        break;
      case "delete-effect":
        {
          const li = element.closest(".active-effect-item");
          const effectID = li.dataset.effectId;
          const effect = effects.get(effectID);
          await effect.delete();
        }
        break;
      case "create-effect":
        {
          await item.createEmbeddedDocuments("ActiveEffect", [
            {
              name: "New Active Effect",
              icon: "icons/svg/aura.svg",
              origin: item.uuid,
              "duration.rounds": undefined,
              disabled: false,
              statuses: [`${ETHERIA_CONST.moduleName}`],
            },
          ]);
        }
        break;
      case "import-effect":
        {
          if (!isDFredEffect) break;
          await importDFredEffectDialog(item);
        }
        break;
    }
  });
}
