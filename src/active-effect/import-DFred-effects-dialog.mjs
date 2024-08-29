import ETHERIA_CONST from "../constants.mjs";
/**
 * @param {Actor|Item} document 
 */
export default async function importDFredEffectDialog(document) {
    const docConvenientEffects = document.effects.filter(ef => ef.flags["dfreds-convenient-effects"]?.isConvenient);
    const docConvenientEffectsNames = docConvenientEffects.map(ef => ef.name)
    const customDFredsEffects = game.dfreds.effects._customEffectsHandler.getCustomEffects();
    const effectRenderData = customDFredsEffects.map(ef => ({
        name: ef.name,
        icon: ef.icon,
        inDocument: docConvenientEffectsNames.includes(ef.name)
    }));
    const dialogContent = await renderTemplate( `modules/${ETHERIA_CONST.moduleID}/templates/import-effect-dialog.hbs`, {
        effects: effectRenderData
    })
    const d = Dialog.confirm({
        title: "Import DFreds Effect on Document",
        content: dialogContent,
        /**
         * @param {JQuery} $html 
         */
        yes: async ($html) => {
            const formData = new FormDataExtended($html[0].querySelector("FORM")).object;
            const arrayNames = Object.keys(formData).filter(key => formData[key]);
        
            await Promise.all(
                arrayNames.map(effectName =>
                    game.dfreds.effectInterface.addEffect({
                        effectName,
                        uuid: document.uuid,
                        overlay: false,
                    })
                )
            );
        },
        no: ($html) => {},
        defaultYes: true,
        rejectClose: false
    })
}