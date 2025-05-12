/**
 * 
 * @param {SceneControl[]} controls 
 */
export default function getSceneControls(controls) {
    const tokensControls = controls.find(c => c.name === "token");
    tokensControls.tools.push({
        name: "etheria-effect-manager",
        title: "Open Etheria Effect Manager",
        icon: "fa-solid fa-flask-round-potion",
        visible: game.user.isGM,
        button: true,
        onClick: async () => {
            const efManager = game.etheriaHelper.effectManager;
            efManager.render(!efManager.rendered);
        }
    });

    
    const templateControls = controls.find(c => c.name === "measure");
    templateControls.tools.push({
        name: "etheria-template-manager",
        title: "Open Etheria Template Manager",
        icon: "fa-solid fa-box-archive",
        button: true,
        onClick: () => {
            const efManager = game.etheriaHelper.templateManager;
            efManager.render(!efManager.rendered);
        }
    });
    return controls;
}