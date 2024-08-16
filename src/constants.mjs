const CONST = {
  moduleID: "etheria-prompt",
  moduleName: "Etheria Prompt Module",
  socketTypes: {
    requestGM: "REQUEST_GM",
  },
};
CONST.reactionOption = {
  none: {
    label: "None",
    icon: `modules/${CONST.moduleID}/asset/circle.svg`
  },
  parry: {
    label: "Parry",
    icon: `modules/${CONST.moduleID}/asset/sword-clash.svg`
  },
  block: {
    label: "Block",
    icon: `modules/${CONST.moduleID}/asset/shield.svg`
  },
  dodge: {
    label: "Dodge",
    icon: `modules/${CONST.moduleID}/asset/wingfoot.svg`
  },
  agi: { //TODO delete this option
    label: "Agi",
    icon: `modules/${CONST.moduleID}/asset/wingfoot.svg`
  }
}
export default CONST;
