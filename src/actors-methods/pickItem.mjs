/**
 * Displays a dialog to pick an item and attribute for an action (use/attack/cure)
 * @param {Object} [options] - Configuration options
 * @param {string} [options.attribute=""] - Preselected attribute
 * @param {string} [options.itemName=""] - Preselected item name
 * @param {string} [options.action=""] - Action type ("use", "attack" or "cure")
 * @returns {Promise<Dialog>} The shown Dialog instance
 */
export default async function pickItem({ attribute = "", itemName = "", action = "" } = {}) {
  const { citems: items, attributes } = foundry.utils.deepClone(this.system);

  const allButtons = {
    use: {
      icon: '<i class="fa-solid fa-suitcase"></i>',
      label: "Use",
      callback: ([html]) => {
        const formData = new FormDataExtended(html.querySelector("form")).object;
        return this.useItem(formData.attribute, formData.itemName);
      }
    },
    attack: {
      icon: '<i class="fas fa-swords"></i>',
      label: "Attack",
      callback: ([html]) => {
        const formData = new FormDataExtended(html.querySelector("form")).object;
        return this.rollAttack(formData.attribute, formData.itemName);
      }
    },
    cure: {
      icon: '<i class="fas fa-heart"></i>',
      label: "Cure",
      callback: ([html]) => {
        const formData = new FormDataExtended(html.querySelector("form")).object;
        return this.useItem(formData.attribute, formData.itemName, { isCurativeItem: true });
      }
    }
  };


  // Prepare template data
  const templateData = {
    attributeField: {
      choices: Object.keys(attributes).sort((a, b) => a.localeCompare(b)),
      selected: attribute,
      id: `pick-item-${foundry.utils.randomID()}`
    },
    itemField: {
      choices: Object.fromEntries([
        ["", "Select an item..."],
        ...items
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(i => [i.name, i.name])
        ]),
      selected: itemName
    }
  };

  // Create and return dialog
  return Dialog.wait({
    title: "Select Item",
    content: await renderTemplate("modules/etheria-prompt/templates/pick-item-dialog.hbs", templateData),
    buttons: !action ? allButtons : { [action]: allButtons[action] },
    close: () => false,
  });
}