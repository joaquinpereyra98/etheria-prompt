const ETHERIA_CONST = {
  moduleID: "etheria-prompt",
  moduleName: "Etheria Prompt Module",
  socketTypes: {
    createMsg: "CREATE_MSG",
    requestAttackGM: "REQUEST_ATTACK_GM",
    requestItemUseGM: "REQUEST_ITEM_GM",
  },
};
ETHERIA_CONST.reactionOption = {
  none: {
    label: "None",
    icon: `modules/${ETHERIA_CONST.moduleID}/asset/circle.svg`
  },
  parry: {
    label: "Parry",
    icon: `modules/${ETHERIA_CONST.moduleID}/asset/sword-clash.svg`
  },
  block: {
    label: "Block",
    icon: `modules/${ETHERIA_CONST.moduleID}/asset/shield.svg`
  },
  dodge: {
    label: "Dodge",
    icon: `modules/${ETHERIA_CONST.moduleID}/asset/wingfoot.svg`
  },
}
export default ETHERIA_CONST;
