import { prepareRollData } from './prepareRollData.mjs'

export default async function rollAttack({attrKey, itemName}) {
    const { attributes } = this.system;
    if(!typeof attrKey === "string" || !attributes[attrKey]){
        console.warn(`${attrKey} not is a valid attribute key`);
        return;
    }
    const attrID = attributes[attrKey].id;
    const rollData = await prepareRollData.call(this ,attrID, attrKey)
}