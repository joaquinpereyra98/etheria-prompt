import CONST from '../constants.mjs';

export default async function requestDialog(rollData, requestType, options = {}) {
  const dialogOptions = {
    Attack: {
      title: `Attack roll made against ${options.targetName}`,
      label: `<b>${options.actorName}</b> makes an attack roll against <b>${options.targetName}</b>`,
      confirm: 'Hit',
      reject: 'Miss'
    },
    Reaction: {
      title: `Reaction roll made by ${options.targetName}`,
      label: `<b>${options.targetName}</b> makes a <b>${options.reactionKey}</b> roll`,
      confirm: 'Roll Damage',
      reject: 'Not Roll Damage'
    }
  }[requestType];

  const template = await renderTemplate(
    `modules/${CONST.moduleID}/templates/roll-dialog-template.hbs`,
    { rollData, labelDialog: dialogOptions.label }
  );

  return await Dialog.wait({
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