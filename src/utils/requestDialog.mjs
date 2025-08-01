import ETHERIA_CONST from "../constants.mjs";
/**
 * Return the dialog response
 * @param {object} rollData 
 * @param {string} requestType 
 * @param {object} options 
 * @returns {Promise<(string)>} 
 */
export default async function createRequestingDialog(rollData, requestType, options = {}) {
  const dialogOptions = {
    Attack: {
      title: `Attack roll performed against ${options.targetName}`,
      label: `<b>${options.actorName}</b> makes an Accuracy Roll against <b>${options.targetName}</b> using <b>${rollData.item.name}</b>`,
      confirm: 'Hit',
      reject: 'Miss'
    },
    Reaction: {
      title: `Reaction roll performed by ${options.targetName}`,
      label: `<b>${options.targetName}</b> makes a <b>${options.reactionKey}</b> roll using <b>${rollData.item.name}</b>`,
      confirm: 'Roll Damage',
      reject: 'Not Roll Damage'
    },
    UseItem: {
      title: `Use item roll performed by ${options.actorName}`,
      label: `<b>${options.actorName}</b> makes a Accuracy Roll using <b>${rollData.item.name}</b>`,
      confirm: 'Use Item',
      reject: 'Not Use Item'
    }
  }[requestType];

  const template = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/roll-dialog-template.hbs`,
    { rollData, labelDialog: dialogOptions.label }
  );

  return Dialog.wait({
    title: dialogOptions.title,
    content: template,
    buttons: {
      confirm: {
        label: dialogOptions.confirm,
        icon: '<i class="fa-regular fa-circle-check"></i>',
        callback: () => true,
      },
      reject: {
        label: dialogOptions.reject,
        icon: '<i class="fa-solid fa-ban"></i>',
        callback: () => false,
      },
    },
    close: () => false,
    rejectClose: false,
  });
}