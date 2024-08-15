import { auxMeth } from "../../../../systems/sandbox/module/auxmeth.js";

export default async function rollDataToMessage(rollData) {
  let newhtml = await renderTemplate(
    "systems/sandbox/templates/dice.html",
    rollData
  );
  let rtypevalue = "";
  if (rollData.gmMode || rollData.blid || rollData.self) {
    if (rollData.gmMode) {
      rtypevalue = CONST.DICE_ROLL_MODES.PRIVATE;
    } else if (rollData.blid) {
      rtypevalue = CONST.DICE_ROLL_MODES.BLIND;
    } else if (rollData.self) {
      rtypevalue = CONST.DICE_ROLL_MODES.SELF;
    }
  } else {
    rtypevalue = rollData.rollModeFromUI;
  }
  if (rtypevalue == "") {
    // still no roll mode found
    // set default to public roll
    rtypevalue = CONST.DICE_ROLL_MODES.PUBLIC;
  }

  let rvalue = CONST.CHAT_MESSAGE_TYPES.OTHER;
  switch (
    rtypevalue //roll, gmroll,blindroll,selfroll
  ) {
    case CONST.DICE_ROLL_MODES.PUBLIC:
      rvalue = CONST.CHAT_MESSAGE_TYPES.IC;
      break;
    case CONST.DICE_ROLL_MODES.PRIVATE:
      rvalue = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      break;
    case CONST.DICE_ROLL_MODES.BLIND:
      rvalue = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      blindmode = true;
      break;
    case CONST.DICE_ROLL_MODES.SELF:
      rvalue = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      break;
    default:
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = newhtml;
  let cilink = wrapper.querySelector(".roll-citemlink");

  if (cilink != null) cilink.setAttribute("id", rollData.rollcitemID);

  const actor = game.actors.get(rollData.actorid)
  const messageData = {
    speaker: ChatMessage.getSpeaker({actor}),
    content: wrapper.innerHTML,
    type: rvalue,
    blind: rollData.blindmode,
  };

  if (
    rtypevalue == CONST.DICE_ROLL_MODES.PRIVATE ||
    rtypevalue == CONST.DICE_ROLL_MODES.BLIND
  ) {
    messageData.whisper = ChatMessage.getWhisperRecipients("GM");
  } else if (rtypevalue == CONST.DICE_ROLL_MODES.SELF) {
    messageData.whisper = ChatMessage.getWhisperRecipients(game.user.name);
  }
  const newmessage = await ChatMessage.create(messageData);
  rollData.msgid = newmessage.id;
  auxMeth.rollToMenu(newhtml);
}
