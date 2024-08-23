import ETHERIA_CONST from "../constants.mjs";

export async function requestRollModifier(rollData) {
  const { roll } = rollData;

  const modifierDialogContent = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/modifier-dialog-template.hbs`,
    { diceData: roll.terms[0], actor: rollData.actor, label: rollData.flavor }
  );
  const newRollData = await Dialog.prompt({
    title: `Choose the modifier for the ${rollData.flavor} made by: ${rollData.actor}`,
    content: modifierDialogContent,
    label: "Roll!",
    callback: (html) => {
      const data = {
        formula: roll.formula,
      }
      const numDice = html.find("input[name=number]").val();
      const mods = html.find("input[name=mod]").val().trim();
      const multiplier = html.find("input[name=multiplier]").val().trim();

      if (numDice > 1) data.formula = data.formula.replace(/\d+d20/, `${numDice}d20kh`);
      if (mods && mods !== "+0"){
        data.formula += ` ${
          mods.startsWith("+") || mods.startsWith("-") ? mods : "+" + mods
        }`;
        data.mod = mods;
      }
      if (multiplier && multiplier !== "*1")
        data.formula = `(${data.formula}) *${multiplier.replace(/^\*/, "")}`;

      return data;
    },
  });
  if (!Roll.validate(newRollData.formula) || roll.formula === newRollData.formula) return null;
  newRollData.roll = await Roll.create(newRollData.formula).evaluate();
  return foundry.utils.mergeObject(rollData, newRollData);
}
