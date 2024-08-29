import ETHERIA_CONST from "../constants.mjs";

/**
 * Prompts the user to modify a roll and returns the updated roll data.
 *
 * @param {object} rollData - The data for the roll.
 * @param {boolean} [isAccuracyRoll] - is a accuracy roll?
 * @returns {Promise<object>} - The updated roll data or old roll data if no changes were made.
 */
export async function requestRollModifier(rollData, isAttackRoll = false) {
  const { roll, actor, flavor, options } = rollData;

  const content = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/modifier-dialog-template.hbs`,
    { diceData: roll.terms[0], actor, label: flavor, isAttackRoll, options }
  );

  const newRollData = await Dialog.prompt({
    title: `Choose the modifier for the ${flavor} made by: ${actor}`,
    content,
    label: "Roll!",
    callback: (html) => {
      const numDice = html.find("input[name=number]").val();
      let mods = html.find("input[name=mod]").val().trim();
      let multiplier = html.find("input[name=multiplier]").val().trim();
      const maximizeDamageOnCritic = html
        .find("input[name=maximizeDamageOnCritic]")
        .is(":checked");
      const applyEffectsOnHit = html
        .find("input[name=applyEffectsOnHit]")
        .is(":checked");

      let formula = roll.formula;
      let mod = rollData.mod === 0 ? "" : rollData.mod;

      if (numDice > 1) {
        formula = formula.replace(/\d+d20/, `${numDice}d20kh`);
      }
      if (mods && mods !== "+0") {
        mods = ` ${
          mods.startsWith("+") || mods.startsWith("-") ? mods : "+" + mods
        }`;
        formula += mods;
        mod += mods;
      }
      if (multiplier && multiplier !== "*1") {
        multiplier = ` *${multiplier.replace(/^\*/, "")}`;
        formula = `(${formula})${multiplier}`;
        mod += multiplier;
      }

      return { formula, maximizeDamageOnCritic, mod, applyEffectsOnHit };
    },
    close: () => {}
  });

  if (
    !Roll.validate(newRollData.formula) ||
    roll.formula === newRollData.formula
  ) {
    return rollData;
  }

  newRollData.roll = await Roll.create(newRollData.formula).evaluate();
  newRollData.dice = newRollData.roll.dice;
  newRollData.result = newRollData.roll.total;
  newRollData.iscrit = newRollData.dice[0].total === 20;

  return foundry.utils.mergeObject(rollData, newRollData);
}

/**
 * Prompts the user to modify damage and returns the updated roll data.
 *
 * @param {object} rollData - The data for the roll.
 * @param {string} damageType - The type of damage.
 * @param {object} targetAttributes - The target's attributes.
 * @returns {Promise<object>} - The updated roll data or the old roll data if no changes were made.
 */
export async function requestDamageModifier(
  rollData,
  damageType,
  targetAttributes
) {
  const { roll, actor, options } = rollData;

  const damageOption = Object.fromEntries(
    Object.keys(targetAttributes)
      .filter((key) => key.endsWith("resistance"))
      .map((key) => [
        key.replace("resistance", ""),
        `${key.replace("resistance", "")} damage`.titleCase(),
      ])
  );
  damageOption["true"] = "True Damage";

  const content = await renderTemplate(
    `modules/${ETHERIA_CONST.moduleID}/templates/damage-dialog-template.hbs`,
    { actor, damageType, damageOption, options }
  );

  const newRollData = await Dialog.prompt({
    title: `Choose the modifier for the Damage Roll made by: ${actor}`,
    content,
    label: "Roll!",
    /** @param {JQuery} html  */
    callback: (html) => {
      const numMod = html.find("input[name=numMod]").val().trim();
      const pctMod = html.find("input[name=pctMod]").val().trim();
      const selectedDamageType = html.find("select[name=damageType]").val();
      const ignoreResistence =
        selectedDamageType === "true"
          ? true
          : html.find("input[name=ignoreResistence]").is(":checked");
      const isHealing = html.find("input[name=isHealing]").is(":checked");

      let formula = roll.formula;
      let mod = "";

      if (numMod && numMod !== "+0") {
        mod +=
          numMod.startsWith("+") || numMod.startsWith("-")
            ? numMod
            : `+${numMod}`;
        formula += ` ${mod}`;
      }

      if (pctMod && pctMod !== "+0%") {
        const percentageModifier =
          pctMod.startsWith("+") || pctMod.startsWith("-")
            ? pctMod
            : `+${pctMod}`;
        const pctModValue = eval(
          `1${percentageModifier.replace(
            /(\+|-)?(\d+)%/g,
            (_, sign, number) => `${sign || ""}${parseInt(number) / 100}`
          )}`
        );
        formula = `round((${formula}) * ${pctModValue})`;
        mod += pctMod;
      }

      return {
        formula,
        mod,
        options: { ignoreResistence, isHealing },
        conditional: `${selectedDamageType} damage`.titleCase(),
        damageType: selectedDamageType,
      };
    },
    close: () => {}
  });

  if (!Roll.validate(newRollData.formula)) return rollData;

  newRollData.roll = await Roll.create(newRollData.formula).evaluate({
    maximize: rollData.isCriticalHit,
  });
  newRollData.dice = newRollData.roll.dice;
  newRollData.result = newRollData.roll.total;

  return foundry.utils.mergeObject(rollData, newRollData);
}
