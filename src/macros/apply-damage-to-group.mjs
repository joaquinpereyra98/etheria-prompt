import ETHERIA_CONST from "../constants.mjs";

/**
 * @param {Object} options 
 * @param {Boolean} options.skipDialog
 * @param {import("../actors-methods/applyDamage.mjs").DamageDescription} options.damage 
 */
export default async function applyDamageToGroup({ skipDialog = false, damage = {} } = {}) {
    /**@type {Array}*/
    const actors = canvas.tokens.controlled.map(t => t.actor).filter(_ => _);

    if (actors.length === 0) {
        return void ui.notifications.error(
            `${ETHERIA_CONST.moduleName} | Error executing Macro - applyDamageToGroup | At least one token must be selected`
        );
    };

    if (skipDialog !== true) {
        const damageOption = [{
            key: "",
            label: "",
        },
        {
            key: "true",
            label: "True Damage"
        },
        ...Object.keys(actors[0].system.attributes)
            .filter((key) => key.endsWith("resistance"))
            .map((key) => ({
                key: key.replace("resistance", ""),
                label: `${key.replace("resistance", "")} damage`.titleCase(),
            }))
            .sort((a, b) => a.key.localeCompare(b.key))
        ];


        const data = await Dialog.prompt({
            title: "Apply Damage to Group",
            content: `<form autocomplete="off">
            <div class="flexcol">
            <label for="damageType">Type of Damage</label>
            <select name="damageType">
                ${damageOption.map(option =>
                `<option value="${option.key}">${option.label}</option>`
            ).join("")}
            </select>
            <p class="hint">Specify the type of damage.</p>
            </div>
            <div class="flexcol">
            <label for="damageAmount">Amount of Damage</label>
            <input type="number" name="damageAmount" min="0" value="0">
            <p class="hint">Enter the amount of damage as a positive number.</p>
            </div>
        </form>`,
            label: "Apply Damage",
            callback: ($html) => new FormDataExtended($html[0].querySelector('form')).object,
            rejectClose: false,
        });
        damage.value = data.damageAmount;
        damage.type = data.damageType;
    }

    if (!damage.type || !Number.isInteger(damage.value)) return;

    if (damage.type === "true") damage.ignoreResistence = true;

    for (const actor of actors) {
        actor.applyDamage(damage)
    }

}