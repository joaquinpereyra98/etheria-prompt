import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";

export default async function rollDataToMessage(actor, user, rollData) {
  rollData.user = user.name;
  let newhtml = await renderTemplate(
    "systems/sandbox/templates/dice.html",
    rollData
  );
  const rtypevalue = getDiceMode(rollData)

  const {rvalue, whisper} = getValues(user, rtypevalue);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = newhtml;
  let cilink = wrapper.querySelector(".roll-citemlink");

  if (cilink) cilink.setAttribute("id", rollData.rollcitemID);

  const item = game.items.find(i => i._id === rollData.rollcitemID);
  const messageData = {
    speaker: ChatMessage.getSpeaker({actor}),
    content: wrapper.innerHTML,
    type: rvalue,
    blind: rollData.blindmode,
    flags: { itemId: rollData.rollcitemID, item: item, itemName: item?.name}
  };

  if (whisper) messageData.whisper = whisper;

  const newmessage = await ChatMessage.create(messageData);
  if(game.dice3d) {
    await game.dice3d.showForRoll(rollData.roll, user, true, messageData.whisper, rollData.blindmode)
  }
  rollData.msgid = newmessage.id;
  auxMeth.rollToMenu(newhtml);
}
function getDiceMode({gmMode, blid, self, rollModeFromUI}){
  if(gmMode) return CONST.DICE_ROLL_MODES.PRIVATE;
  if(blid) return CONST.DICE_ROLL_MODES.BLIND;
  if(self) return CONST.DICE_ROLL_MODES.SELF;
  return rollModeFromUI || CONST.DICE_ROLL_MODES.PUBLIC;
}
function getValues(user, rtypevalue){
  let rvalue;
  let whisper;
  switch (rtypevalue) {
    case CONST.DICE_ROLL_MODES.PUBLIC:
      rvalue = CONST.CHAT_MESSAGE_TYPES.IC;
      break;
    case CONST.DICE_ROLL_MODES.PRIVATE:
    case CONST.DICE_ROLL_MODES.BLIND:
      rvalue = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      whisper = ChatMessage.getWhisperRecipients("GM");
    case CONST.DICE_ROLL_MODES.SELF:
      whisper = ChatMessage.getWhisperRecipients(user);
      rvalue = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      break;
    default:
      rvalue = CONST.CHAT_MESSAGE_TYPES.OTHER;
  }
  return {rvalue , whisper}
}