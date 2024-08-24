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
      title: `Attack roll made against ${options.targetName}`,
      label: `<b>${options.actorName}</b> makes an Accuracy Roll against <b>${options.targetName}</b>`,
      confirm: 'Hit',
      reject: 'Miss'
    },
    Reaction: {
      title: `Reaction roll made by ${options.targetName}`,
      label: `<b>${options.targetName}</b> makes a <b>${options.reactionKey}</b> roll`,
      confirm: 'Roll Damage',
      reject: 'Not Roll Damage'
    },
    UseItem: {
      title: `Use item roll made by ${options.actorName}`,
      label: `<b>${options.actorName}</b> makes a Accuracy Roll`,
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