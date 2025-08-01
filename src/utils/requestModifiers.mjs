import ETHERIA_CONST from "../constants.mjs";

/**
 * Prompts the user to modify a roll and returns the updated roll data.
 *
 * @param {object} rollData - The data for the roll.
 * @param {boolean} [isAccuracyRoll] - is a accuracy roll?
 * @returns {Promise<object>} - The updated roll data or old roll data if no changes were made.
 */
export async function requestRollModifier(rollData, isAttackRoll = false) {
  const { roll, actor, flavor, options, item, mod = 0 } = rollData;

  const templatePath = `modules/${ETHERIA_CONST.moduleID}/templates/modifier-dialog-template.hbs`;

  const content = await renderTemplate(
    templatePath,
    { diceData: roll.terms[0], actor, label: flavor, isAttackRoll, options, item }
  );

  const newRollData = await Dialog.prompt({
    title: `${flavor} by ${actor}`,
    content,
    label: "Roll!",
    callback: /** @param {JQuery} param0 */ ([html]) => {
      const formData = new FormDataExtended(html.querySelector("form")).object;
      const diceOverrideInputs = html.querySelectorAll(".override-inputs input");

      /** Formula prepartion */
      let formula = roll.formula;
      let totalMod = mod;

      if (formData.number > 1) formula = formula.replace(/\d+d20/, `${formData.number}d20kh`);

      if (formData.mod && formData.mod !== "+0") {
        const sanitizedMod = formData.mod.startsWith("+") || formData.mod.startsWith("-") ? formData.mod : `+${formData.mod}`;
        formula += ` ${sanitizedMod}`;
        if (totalMod !== 0) totalMod += sanitizedMod;
        else totalMod = sanitizedMod
      }

      if (formData.multiplier && formData.multiplier !== "*1") {
        const mult = formData.multiplier.startsWith("*") ? formData.multiplier : `*${formData.multiplier}`;
        formula = `(${formula})${mult}`;
        totalMod += mult;
      }

      /** Override prepartion */
      const overrides = Array.from(diceOverrideInputs).map((input) => ({
        dieIdx: Number(input.dataset.dieIdx),
        resultIdx: Number(input.dataset.resultIdx),
        value: Number(input.value)
      }));

      return {
        formula,
        maximizeDamageOnCritic: formData.maximizeDamageOnCritic,
        mod: totalMod,
        applyEffectsOnHit: formData.applyEffectsOnHit,
        useOverride: formData.useOverride,
        overrides
      };
    },
    height: "auto",
    render: /** @param {JQuery} param0 */ ([html]) => {
      const overrideDiv = html.querySelector(".override-inputs");

      renderOverrideInputs(overrideDiv, roll);

      html.querySelector("input[name=number]")?.addEventListener("change", (event) => {
        const newCount = parseInt(event.target.value);
        if (isNaN(newCount) || newCount < 1) return;

        const currentInputs = overrideDiv.querySelectorAll("input");
        const diff = newCount - currentInputs.length;

        if (diff > 0) {
          for (let i = currentInputs.length; i < newCount; i++) {
            overrideDiv.appendChild(createOverrideInput(`d${roll.dice[0].faces}`, 0, i));
          }
        } else {
          for (let i = currentInputs.length - 1; i >= newCount; i--) {
            currentInputs[i]?.closest(".override-die-wrapper")?.remove();
          }
        }
      });

    },
    rejectClose: false,
  });

  if (!Roll.validate(newRollData.formula)) newRollData.formula = roll.formula;
  if (!newRollData.useOverride && roll.formula === newRollData.formula) return rollData;

  const r = Roll.create(newRollData.formula);

  if (newRollData.useOverride) {
    r.dice.forEach((die, dieIdx) => {
      const dieOverrides = newRollData.overrides.filter((o) => o.dieIdx === dieIdx);
      if (!dieOverrides.length) return;

      for (let i = 0; i <= die.number - 1; i++) {
        const override = dieOverrides.find(v => v.resultIdx === i);
        const value = override?.value;
        const clamped = (typeof value === 'number')
          ? Math.max(1, Math.min(value, die.faces))
          : Math.ceil(CONFIG.Dice.randomUniform() * die.faces);
        die.results.push({ result: clamped, active: true });
      }

      die._evaluateModifiers()
      die._evaluated = true;
    });
  }

  newRollData.roll = await r.evaluate();
  newRollData.dice = newRollData.roll.dice;
  newRollData.result = newRollData.roll.total;
  newRollData.iscrit = newRollData.dice[0].total === 20;
  newRollData.isfumble = newRollData.dice[0].total === 1;

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
    callback: /** @param {JQuery} param0  */ ([html]) => {
      const formData = new FormDataExtended(html.querySelector("form")).object;
      let formula = roll.formula;
      let mod = "";

      if (formData.numMod && formData.numMod !== "+0") {
        mod +=
          formData.numMod.startsWith("+") || formData.numMod.startsWith("-")
            ? formData.numMod
            : `+${formData.numMod}`;
        formula += ` ${mod}`;
      }

      if (formData.pctMod && formData.pctMod !== "+0%") {
        const percentageModifier =
          formData.pctMod.startsWith("+") || formData.pctMod.startsWith("-")
            ? formData.pctMod
            : `+${formData.pctMod}`;
        const pctModValue = eval(
          `1${percentageModifier.replace(
            /(\+|-)?(\d+)%/g,
            (_, sign, number) => `${sign || ""}${parseInt(number) / 100}`
          )}`
        );
        formula = `round((${formula}) * ${pctModValue})`;
        mod += formData.pctMod;
      }

      /** Override prepartion */
      const diceOverrideInputs = html.querySelectorAll(".override-inputs input");
      const overrides = Array.from(diceOverrideInputs).map((input) => ({
        dieIdx: Number(input.dataset.dieIdx),
        resultIdx: Number(input.dataset.resultIdx),
        value: Number(input.value)
      }));

      return {
        formula,
        mod,
        options: {
          ignoreResistence: formData.damageType === "true" || formData.ignoreResistence,
          isHealing: formData.isHealing
        },
        conditional: `${formData.damageType} damage`.titleCase(),
        damageType: formData.damageType,
        useOverride: formData.useOverride,
        overrides,
      };
    },
    render: /**@param {JQuery} param0 */ ([html]) => renderOverrideInputs(html.querySelector(".override-inputs"), roll),
    rejectClose: false,
  });

  if (!Roll.validate(newRollData.formula)) newRollData.formula = roll.formula;
  if (!newRollData.useOverride && roll.formula === newRollData.formula) return rollData;

  const r = Roll.create(newRollData.formula);

  if (newRollData.useOverride) {
    r.dice.forEach((die, dieIdx) => {
      const dieOverrides = newRollData.overrides.filter((o) => o.dieIdx === dieIdx);
      if (!dieOverrides.length) return;

      for (let i = 0; i <= die.number - 1; i++) {
        const override = dieOverrides.find(v => v.resultIdx === i);
        const value = override?.value;
        const clamped = (typeof value === 'number')
          ? Math.max(1, Math.min(value, die.faces))
          : Math.ceil(CONFIG.Dice.randomUniform() * die.faces);
        die.results.push({ result: clamped, active: true });
      }

      die._evaluateModifiers()
      die._evaluated = true;
    });
  }

  newRollData.roll = await r.evaluate({
    maximize: rollData.isCriticalHit,
  });
  newRollData.dice = newRollData.roll.dice;
  newRollData.result = newRollData.roll.total;

  return foundry.utils.mergeObject(rollData, newRollData);
}

/**
 * @param {HTMLDivElement} div 
 * @param {Roll} roll 
 */
function renderOverrideInputs(div, roll) {
  div.innerHTML = "";

  roll.dice.forEach((dieTerm, dieIdx) => {
    const dieType = `d${dieTerm.faces}`;

    for (let i = 0; i < dieTerm.number; i++) {
      const wrapper = createOverrideInput(dieType, dieIdx, i);
      div.appendChild(wrapper);
    }
  });

}

function createOverrideInput(dieType, dieIdx, resultIdx) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("override-die-wrapper");

  const label = document.createElement("label");
  label.textContent = `${dieType} #${resultIdx + 1}: `;

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.name = `override-${dieType}-${resultIdx}`;

  input.dataset.dieIdx = String(dieIdx);
  input.dataset.resultIdx = String(resultIdx);

  input.placeholder = "Leave empty to use roll";
  input.classList.add("override-die-input");
  label.appendChild(input);
  wrapper.appendChild(label);

  return wrapper;
}