import ETHERIA_CONST from "../constants.mjs";
/**
 * Return the attribute key for the reaction roll
 * @param {Actor} target
 * @returns {Promise<(String|null)>}
 */
export default async function createReactionDialog(target) {
  const reactionDialogContent = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/reaction-dialog-template.hbs`,
    { target, reactionOption: ETHERIA_CONST.reactionOption }
  );

  return Dialog.prompt({
    title: `Choose the reaction of ${target.name}`,
    content: reactionDialogContent,
    label: "Roll",
    callback: (html) => {
      return html.find("input[name=reactionOption]:checked").val();
    },
    rejectClose: false,
    render: (html) => {
      html.find(".etheria-checkbox").click((ev) => {
        $(ev.currentTarget).find('input[type="radio"]').prop("checked", true);
      });
    },
    options: {
      height: 267,
    },
  });
}
