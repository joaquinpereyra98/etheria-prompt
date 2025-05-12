import ETHERIA_CONST from "../constants.mjs";

/**
 * The Application responsible for configuring a single World Etheria Measured Template.
 * @type { MeasuredTemplateConfig }
 * @param {MeasuredTemplate} object         The World MeasuredTemplate being configured.
 * @param {DocumentSheetOptions} [options]  Application configuration options.
 */
export default class EtheriaTemplateConfig extends MeasuredTemplateConfig {
    /**
     * Retrieves the world templates settings for the Etheria module.
     * @getter
     * @returns {Object} The settings object for world templates, or an empty object if not set.
     */
    get setting() {
        return game.settings.get(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES) ?? {};
    }

    /**
     * Retrieves the world template setting.
     * @getter
     * @returns {Object} The setting world template, or an empty object if not set.
     */
    get data() {
        return this.setting[this.object._id];
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `modules/${ETHERIA_CONST.moduleID}/templates/etheria-template-config.hbs`,
        });
    }

    /** @override */
    _updateObject(event, formData) {
        formData.users ??= [];

        const updated = foundry.utils.mergeObject(
            this.data,
            formData,
            { insertKeys: false, inplace: false }
        );
        this.close();
        game.settings.set(ETHERIA_CONST.moduleID, ETHERIA_CONST.SETTING.WORLD_TEMPLATES, {
            ...this.setting,
            [this.object._id]: updated
        });
    }

    /** @inheritdoc */
    getData() {
        return foundry.utils.mergeObject(super.getData(), {
            playersOptions: game.users.filter(u => !u.isGM).reduce((acc, v) => {
                acc[v._id] = v.name;
                return acc;
            }, {}),
        });
    }
}