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
    })
    return controls;
}