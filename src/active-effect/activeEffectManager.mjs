import ETHERIA_CONST from "../constants.mjs";

/**
 * @extends Application
 */
export default class EtheriaEffectManager extends Application {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "etheria-effect-manager",
            template: `modules/${ETHERIA_CONST.moduleID}/templates/etheria-effect-manager.hbs`,
            title: "Etheria Effect Manager",
            width: 400,
            height: 200,
            resizable: true,
            classes: ["etheria-effect-manager", "etheria-prompt"]
        });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async getData(options = {}) {
        return {
            tokens: this._getTokens()
        }
    }

    _getTokens() {
        const tokens = Array.from(canvas.scene.tokens);

        return tokens.filter(t => t?.actor?.appliedEffects.length > 0).map(t => ({
            ...t,
            uuid: t.uuid,
            effects: t.actor.appliedEffects,
        }))

    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    activateListeners([html]) {
        html.querySelectorAll('[data-action]').forEach(element => {
            element.addEventListener('click', (event) => {
                switch (element.getAttribute('data-action')) {
                    case 'deleteEffect':
                        this._deleteEffect(event, event.target);
                        break;
                    case 'deleteAllEffects':
                        this._deleteAllEffects(event, event.target);
                        break;
                    case "spanToken":
                        this._spanToken(event, event.target)
                    default:
                        console.warn('No matching action found');
                }
            });
        });
    }

    /**
     * 
     * @param {Event} event 
     * @param {HTMLElement} target 
     */
    async _deleteEffect(event, target) {
        const { effectUuid } = target.closest('[data-effect-uuid]')?.dataset;
        if (!effectUuid) return;
        const effect = fromUuidSync(effectUuid)
        await effect.delete();
    }

    _deleteAllEffects(event, target) {
        const tokenUuid = target.closest('[data-token-uuid]')?.dataset?.tokenUuid;
        if (!tokenUuid) return;

        const actor = fromUuidSync(tokenUuid)?.actor;
        if (!actor) return;

        ActiveEffect.deleteDocuments(actor.appliedEffects.map(e => e.id), { parent: actor });
    }

    _spanToken(event, target) {
        const { tokenUuid } = target.closest('[data-token-uuid]')?.dataset;
        if (!tokenUuid) return;
        const token = fromUuidSync(tokenUuid);
        if (token?.object) {
            token.object?.control({ releaseOthers: true });
            canvas.animatePan(token.object.center);
        }
    }

    /* -------------------------------------------- */

    static onChangeActiveEffect(effect) {
        const actor = effect.parent;

        if (!(actor instanceof Actor) || actor.getActiveTokens().length === 0) return;

        const efManager = game.etheriaHelper.effectManager;
        if (efManager.rendered) efManager.render();
    }

    static onChangeToken() {
        const efManager = game.etheriaHelper.effectManager;
        if (efManager.rendered) efManager.render();
    }

}