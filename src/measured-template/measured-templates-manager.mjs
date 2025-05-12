import ETHERIA_CONST from "../constants.mjs";
import EtheriaTemplateConfig from "./etheria-template-config.mjs";
import EtheriaMeasuredTemplate from "./measured-template.mjs";

/**
 * Etheria Template Manager
 * @type {Application}
 *
 * @param {ApplicationOptions} [options]  Application configuration options.
 */
export default class EtheriaTemplateManager extends Application {

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "etheria-effect-manager",
            template: `modules/${ETHERIA_CONST.moduleID}/templates/etheria-template-manager.hbs`,
            title: "Etheria Template Manager",
            width: 300,
            height: 200,
            top: 70,
            left: 115,
            resizable: true,
            classes: ["etheria-template-manager", "etheria-prompt"]
        });
    }

    /**
     * Retrieves the world templates settings for the Etheria module.
     * @getter
     * @returns {Object} The settings object for world templates, or an empty object if not set.
     */
    get settings() {
        return game.settings.get(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES) ?? {};
    }


    /* -------------------------------------------- */

    /** @override */
    async getData() {
        const setting = foundry.utils.duplicate(this.settings);
        const worldTemplates = Object.values(setting).filter(t =>
            game.user.isGM || t.users?.includes(game.userId)
        );
        return {
            worldTemplates,
            tempalteIcons: this.TEMPLATE_ICONS,
            users: game.users.reduce((acc, v) => {
                acc[v._id] = v.name
                return acc
            }, {}),
            isGM: game.user.isGM,
        };
    }

    /**
     * Mapping of measured template types to corresponding Font Awesome icons.
     *
     * @constant
     * @type {Object}
     * @property {string} CIRCLE -Icon for circular templates.
     * @property {string} CONE -Icon for cone-shaped templates.
     * @property {string} RECTANGLE -Icon for rectangular templates.
     * @property {string} RAY -Icon for ray templates.
     */
    TEMPLATE_ICONS = {
        [CONST.MEASURED_TEMPLATE_TYPES.CIRCLE]: "fa-circle",
        [CONST.MEASURED_TEMPLATE_TYPES.CONE]: "fa-angle-left",
        [CONST.MEASURED_TEMPLATE_TYPES.RECTANGLE]: "fa-square",
        [CONST.MEASURED_TEMPLATE_TYPES.RAY]: "fa-arrows-alt-v"
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    activateListeners([html]) {
        html.querySelectorAll('[data-action]').forEach(el =>
            el.addEventListener('click', e => {
                const action = el.dataset.action;
                if (action === "deleteTemplate") this._deleteTemplate(e, el);
                else if (action === "editTemplate") this._editTemplate(e, el);
                else if (action === "placeTemplate") this._placeTemplate(e, el);
                else console.warn('No matching action found');
            })
        );
    }

    /**
     * Delete a World Measured Template
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The capturing HTML element which defines the [data-action]
     */
    _deleteTemplate(event, target) {
        if (!game.user.isGM) return;
        const templateId = target.closest("li.template-item")?.dataset.templateId;
        if (!templateId) return;

        const setting = this.settings;
        delete setting[templateId];
        game.settings.set(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES, setting);
    }

    /**
     * Open the Etheria Tempalte Config for edit a World Measured Template
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The capturing HTML element which defines the [data-action]
     */
    _editTemplate(event, target) {
        if (!game.user.isGM) return;
        const templateId = target.closest("li.template-item")?.dataset.templateId;
        if (!templateId) return;

        const setting = this.settings[templateId];
        const data = foundry.utils.duplicate(setting);

        const template = new MeasuredTemplateDocument(data);
        template.name = setting.name;
        template.users = setting.users;
        new EtheriaTemplateConfig(template).render(true);
    }

    /**
     *Active preview for create measured template on the canvas.
     *
     * @param {Event} event - The event that triggered the placement.
     * @param {HTMLElement} target - HTML element which defines the [data-action]
     */
    _placeTemplate(event, target) {
        const { templateId } = target.closest(".template-item").dataset;
        const setting = this.settings;
        const data = foundry.utils.duplicate(setting[templateId]);

        const doc = new MeasuredTemplateDocument(data, { parent: canvas.scene });
        this.minimize()
        new EtheriaMeasuredTemplate(doc).drawPreview({ maximizeManager: true })
    }
}