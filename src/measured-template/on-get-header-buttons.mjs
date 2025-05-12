import ETHERIA_CONST from "../constants.mjs";
/**
 * 
 * @param {Application} app 
 * @param {ApplicationHeaderButton[]} buttons 
 */
export default function onGetHeaderButtons(app, buttons) {
  
  if(!game.user.isGM) return;

  buttons.unshift({
    label: "Export",
    class: "export-template",
    icon: "fas fa-box-archive",
    onclick: async (ev) => {
      const data = { ...app.document?.toObject(), users: [], _id: foundry.utils.randomID() };
      delete data.user;
      delete data.x;
      delete data.y;

      const setting = foundry.utils.duplicate( game.settings.get(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES) ?? {});

      const defaultName = getDefaultName("New Template", Object.values(setting).map(t => t.name));

      const name = await Dialog.confirm({
        title: "Export a new Template",
        content: `<input type="text" name="name" value="${defaultName}" placeholder="${defaultName}">`,
        yes: ([html]) => html.querySelector('[name="name"]').value ?? defaultName,
        no: () => null,
        defaultYes: false
      });

      if (!name) return;

      data.name = name;
      await game.settings.set(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES, { ...setting, [data._id]: data });
    }

  })
}

function getDefaultName(baseName, names) {
  let counter = 1;
  let newName = baseName;
  while (names.includes(newName)) {
    newName = `${baseName} (${counter++})`;
  }
  return newName;
}