import ETHERIA_CONST from "../constants.mjs";

/** Handler for add active effect table on Status Effect Tab on Actors
 * @param {Application} app - The Application instance being rendered
 * @param {JQuery} $html - The inner HTML of the document that will be displayed and may be modified
 * @param {Object} data - The object of data used when rendering the application
 */
export async function renderStackInput(app, $html, data) {
    const detailsTab = $html.find(".tab[data-tab = details]");
    const stackValue = app.object.getFlag(ETHERIA_CONST.moduleID, "stack") ?? 0;

    const inputStack = `
    <div class="form-group">
        <label> Stacks: </label>
        <input class="stack-input" value=${stackValue} type="number" min=0 name="flags.${ETHERIA_CONST.moduleID}.stack">
    </div>
    `;
    detailsTab.prepend(inputStack);
}