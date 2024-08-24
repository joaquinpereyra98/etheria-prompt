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
      };
      const numDice = html.find("input[name=number]").val();
      const mods = html.find("input[name=mod]").val().trim();
      const multiplier = html.find("input[name=multiplier]").val().trim();

      if (numDice > 1)
        data.formula = data.formula.replace(/\d+d20/, `${numDice}d20kh`);
      if (mods && mods !== "+0") {
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
  if (
    !Roll.validate(newRollData.formula) ||
    roll.formula === newRollData.formula
  ) {
    return null;
  }
  newRollData.roll = await Roll.create(newRollData.formula).evaluate();
  newRollData.dice = newRollData.roll.dice;
  newRollData.result = newRollData.roll.total;
  return foundry.utils.mergeObject(rollData, newRollData);
}
/**
 *
 * @param {object} rollData
 * @param {string} damageType
 * @param {object} targetAttributes
 */
export async function requestDamageModifier(
  rollData,
  damageType,
  targetAttributes
) {
  const { roll } = rollData;

  const damageOption = Object.fromEntries(
    Object.keys(targetAttributes)
      .filter((k) => k.endsWith("resistance"))
      .map((k) => {
        const key = k.replace("resistance", "");
        const value = `${key} damage`.titleCase();
        return [key, value];
      })
  );

  const modifierDialogContent = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/damage-dialog-template.hbs`,
    { actor: rollData.actor, damageType, damageOption }
  );
  const newRollData = await Dialog.prompt({
    title: `Choose the modifier for the Damage Roll made by: ${rollData.actor}`,
    content: modifierDialogContent,
    label: "Roll!",
    callback: (html) => {
      const data = {
        formula: roll.formula,
        mod: ""
      };
      const numMod = html.find("input[name=numMod]").val().trim();
      let pctMod = html.find("input[name=pctMod]").val().trim();
      const damageType = html.find("select[name=damageType]").val();

      if (numMod && numMod !== "+0") {
        // Ensure the modifier starts with + or - and then update the formula
        data.formula += ` ${
          numMod.startsWith("+") || numMod.startsWith("-")
            ? numMod
            : "+" + numMod
        }`;
        data.mod += numMod;
      }

      if (pctMod && pctMod !== "+0%") {
        // Ensure the modifier starts with + or -
        pctMod =
          pctMod.startsWith("+") || pctMod.startsWith("-")
            ? pctMod
            : `+${pctMod}`;

        // Convert percentage to fraction
        const fragMod = pctMod.replace(/(\+|-)?(\d+)%/g, (_, sign, number) => {
          return `${sign || ""}${parseInt(number) / 100}`;
        });

        // Evaluate the expression
        const pctModValue = eval(`1${fragMod}`);

        // Update the formula
        data.formula = `round((${data.formula}) * ${pctModValue})`;
        data.mod += fragMod;
      }
      data.damageType = damageType;
      return data;
    },
  });
  if (
    !Roll.validate(newRollData.formula) ||
    roll.formula === newRollData.formula
  ) {
    return null;
  }
  newRollData.roll = await Roll.create(newRollData.formula).evaluate();
  newRollData.dice = newRollData.roll.dice;
  newRollData.result = newRollData.roll.total;
  return foundry.utils.mergeObject(rollData, newRollData);
}
