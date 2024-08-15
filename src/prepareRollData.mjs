import { auxMeth } from "../../../systems/sandbox/module/auxmeth.js";

export default async function prepareRollData(propertyID, propertyKey) {
  const actorattributes = this.system.attributes;
  const property = await auxMeth.getTElement(propertyID, "property", propertyKey);

  const { rollexp, rollname, rollid } = property.system;
  const rollID = [rollid]; // Wrap rollid in an array if it isn't already
  const targets = game.user.targets.ids;

  return await rollExpression.call(
    this,
    rollexp,
    rollname,
    rollID,
    actorattributes,
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    undefined,
    targets,
    null
  );
}

async function rollExpression(
  rollexp,
  rollname,
  rollid,
  actorattributes,
  cimaxuses = 1,
  targets
) {
  // Parse roll expression and name
  rollexp = await auxMeth.basicParser(
    await auxMeth.parseDialogProps(rollexp, null),
    this.actor
  );
  rollname = await auxMeth.basicParser(
    await auxMeth.parseDialogProps(rollname, null),
    this.actor
  );

  const tokenid = this.isToken && this.token ? this.token.id : null;
  return await rollSheetDice.call(
    this,
    rollexp,
    rollname,
    rollid,
    actorattributes,
    undefined,
    undefined,
    undefined,
    cimaxuses,
    null,
    tokenid
  );
}

/**
 * This code is a copy of the method gActor#rollSheetDice but removes the message creation part.
 * the code is garbage, it is inefficient, it repeats many lines, it uses obsolete terms.
 * Its neccesary redo everything from scratch but the roll system itself is bad.
 *
 * I decided to leave it that way in the hope that someday the system won't suck.
 *
 * I'm sorry and I love you very much.
 * ~ Always yours, Joaquin
 */
async function rollSheetDice(
  rollexp,
  rollname,
  rollid,
  actorattributes,
  citemattributes,
  number = 1,
  isactive = null,
  ciuses = null,
  cimaxuses = 1,
  target = null,
  rollcitemID = null,
  tokenID = null
) {
  let gmmode = false;
  let blindmode = false;
  let selfmode = false;
  let nochat = false;
  let initrollexp = rollexp;
  let showResult = true;
  let secretconditional = false;
  const rollModeFromUI = await this.getRollModeFromUI();

  if (rollexp.includes("~secretconditional~")) secretconditional = true;
  if (rollexp.includes("~blind~")) blindmode = true;
  if (rollexp.includes("~self~")) selfmode = true;
  //Check roll ids
  if (rollid == null || rollid == "") rollid = [];

  //Checking Roll ID's
  for (let n = 0; n < rollid.length; n++) {
    //console.log(rollid[n]);
    if (rollid[n] == "init") initiative = true;

    if (rollid[n] == "gm") gmmode = true;

    if (rollid[n] == "blind") blindmode = true;

    if (rollid[n] == "nochat") nochat = true;
    if (rollid[n] == "self") selfmode = true;
    if (rollid[n] == "secretconditional") secretconditional = true;
    if (rollid[n] == "noresult") showResult = false;
  }

  let linkmode = false;

  if (rollcitemID) linkmode = true;

  let ToGM = false;
  let rolltotal = 0;
  let conditionalText = "";

  //console.log(diff);
  let rollformula = rollexp;

  //Roll modifiers generated by MODs of ROLL type
  let actorrolls = await this.system.rolls;

  //Rolls defined by expression
  let subrolls = [];

  //Check roll mode
  let rollmode = this.system.rollmode;

  if (citemattributes != null) {
    rollname = rollname.replace(/\#{name}/g, citemattributes.name);
    rollname = rollname.replace(/\#{active}/g, isactive);
    rollname = rollname.replace(/\#{uses}/g, ciuses);
    rollname = rollname.replace(/\#{maxuses}/g, cimaxuses);
  }

  //Parse basics
  rollname = await auxMeth.basicParser(rollname, this);
  rollname = await auxMeth.autoParser(
    rollname,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );
  rollname = await game.system.api._extractAPIFunctions(
    rollname,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );

  rollexp = await auxMeth.basicParser(rollexp, this);

  if (citemattributes != null) {
    rollexp = await rollexp.replace(/\#{name}/g, citemattributes.name);
    rollexp = await rollexp.replace(/\#{active}/g, isactive);
    rollexp = await rollexp.replace(/\#{uses}/g, ciuses);
    rollexp = await rollexp.replace(/\#{maxuses}/g, cimaxuses);
  }

  //Parse target attributes
  let targetexp = rollexp.match(/(?<=\#{target\|)\S*?(?=\})/g);
  if (targetexp != null) {
    for (let j = 0; j < targetexp.length; j++) {
      let idexpr = targetexp[j];
      let idtoreplace = "#{target|" + targetexp[j] + "}";
      let newid;
      if (target != null) {
        let targetattributes = target.actor.system.attributes;
        newid = await auxMeth.autoParser(
          "__" + idexpr + "__",
          targetattributes,
          null,
          true
        );
      }

      if (newid == null) newid = 0;

      rollexp = rollexp.replace(idtoreplace, newid);
      rollformula = rollformula.replace(idtoreplace, newid);
    }
  }

  //Preparsing TO CHECK IF VALID EXPRESSION!!!
  rollexp = await auxMeth.autoParser(
    rollexp,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );
  rollexp = await game.system.api._extractAPIFunctions(
    rollexp,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );

  // Early check for ~nochat~ so to prevent 3D Dice from rolling
  if (rollexp.includes("~nochat~")) nochat = true;
  // BLIND MODE TROUBLE
  if (rollexp.includes("~blind~")) blindmode = true;

  // Check and parse roll() expressions
  while (rollexp.match(/(?<=\broll\b\().*?(?=\))/g) != null) {
    let rollmatch = /\broll\(/g;
    var rollResultResultArray;
    var rollResult = [];
    while ((rollResultResultArray = rollmatch.exec(rollexp))) {
      let suba = rollexp.substring(rollmatch.lastIndex, rollexp.length);
      let subb = auxMeth.getParenthesString(suba);
      rollResult.push(subb);
    }

    let subrollsexpb = rollResult;

    //Parse Roll
    let tochange = "roll(" + subrollsexpb[0] + ")";
    let blocks = subrollsexpb[0].split(";");

    //Definition of sub Roll
    let sRoll = {};

    sRoll.name = blocks[0];
    sRoll.numdice = await auxMeth.autoParser(
      blocks[1],
      actorattributes,
      citemattributes,
      false,
      false,
      number
    );
    sRoll.numdice = parseInt(sRoll.numdice);
    sRoll.faces = await auxMeth.autoParser(
      blocks[2],
      actorattributes,
      citemattributes,
      false,
      false,
      number
    );
    sRoll.color = blocks[4] || "";
    sRoll.exploding = blocks[3];

    if (parseInt(sRoll.numdice) > 0) {
      let exploder = "";
      if (sRoll.exploding === "true" || sRoll.exploding === "add") {
        exploder = "x" + sRoll.faces;
      }

      sRoll.expr = sRoll.numdice + "d" + sRoll.faces + exploder + sRoll.color;

      if (sRoll.numdice < 1) sRoll.expr = "0";

      //1d0 roll protection
      sRoll.expr = sRoll.expr.replace(/[0-9]+d0/g, "0");
      sRoll.expr = sRoll.expr.replace(/(?<![0-9])0x\d+/g, "0");
      let partroll = new Roll(sRoll.expr);

      let finalroll = await partroll.evaluate({ async: true });

      finalroll.extraroll = true;

      if (game.dice3d != null && !nochat) {
        //console.warn('A dice3d shown');
        //await game.dice3d.showForRoll(partroll, game.user, true, ToGM, blindmode);
        await this.showDice3DAnimation(
          partroll,
          blindmode,
          gmmode,
          selfmode,
          rollModeFromUI
        );
      }

      sRoll.results = finalroll;

      await subrolls.push(sRoll);
    }

    rollexp = rollexp.replace(tochange, "");
    rollformula = rollformula.replace(
      tochange,
      sRoll.numdice + "d" + sRoll.faces
    );

    let exptochange = "\\?\\[\\b" + sRoll.name + "\\]";
    var re = new RegExp(exptochange, "g");
    let mysubRoll = subrolls.find((y) => y.name == sRoll.name);
    let finalvalue = "";
    if (sRoll.results != null) {
      for (let j = 0; j < sRoll.results.dice.length; j++) {
        let dicearray = sRoll.results.dice[j].results;
        for (let k = 0; k < dicearray.length; k++) {
          if (k > 0) finalvalue += ",";
          let rollvalue = dicearray[k].result;
          if (mysubRoll.exploding === "add") {
            while (dicearray[k].exploded && k < dicearray.length) {
              k += 1;
              rollvalue += dicearray[k].result;
            }
          }
          finalvalue += rollvalue;
        }
      }
      if (sRoll.results.dice.length == 0) finalvalue += "0";
    } else {
      finalvalue = 0;
    }
    rollformula = rollformula.replace(re, sRoll.numdice + "d" + sRoll.faces);
    rollexp = rollexp.replace(re, finalvalue);
    rollexp = await auxMeth.autoParser(
      rollexp,
      actorattributes,
      citemattributes,
      true,
      false,
      number
    );
    rollformula = rollexp;
    //}
  }

  // Check and parse rollp() expressions
  ///////////////ALONDAAR/////////////// BEGIN rollp() test implementation
  // DOCUMENTATION:
  // This new and simplified rollp() function is BEST SUITED for singular dice rolls.
  // However, I believe any Foundry dice notation is valid, further improvements can be made.
  // ?[roll] will still return a comma-separated list of ALL dice terms, regardless of operation
  // ?[roll.total] will return the SINGLE fully parsed TOTAL VALUE of the roll (good for expected results when using special modifiers)
  // New feature: "xa" -- the previously supported "Explode Adds" option. LIMIT: It will "add" any exploded dice, regardless of dice pools.
  // New Feature "im" -- supports exploding on results of 1, or more if a number is specified.
  while (rollexp.match(/(?<=\brollp\b\().*?(?=\))/g) != null) {
    let rollmatch = /\brollp\(/g;
    var rollResultResultArray;
    var rollResult = [];
    while ((rollResultResultArray = rollmatch.exec(rollexp))) {
      let suba = rollexp.substring(rollmatch.lastIndex, rollexp.length);
      let subb = auxMeth.getParenthesString(suba);
      rollResult.push(subb);
    }

    let subrollsexpb = rollResult;

    //Split Roll
    let tochange = "rollp(" + subrollsexpb[0] + ")";
    let blocks = subrollsexpb[0].split(";");

    //Definition of sub Roll
    let sRoll = {};
    sRoll.name = blocks[0];
    // Makes auxMeth NOT parse the roll into a singluar value
    blocks[1] = "|" + blocks[1];
    sRoll.expr = await auxMeth.autoParser(
      blocks[1],
      actorattributes,
      citemattributes,
      false,
      false,
      number
    );
    sRoll.addexploding = blocks[1].match(/xa/g);
    if (sRoll.exploding != null) blocks[1] = blocks[1].replace(/xa/g, "x");

    //1d0 roll protection //This might not be needed anymore?
    sRoll.expr = sRoll.expr.replace(/[0-9]+d0/g, "0");
    sRoll.expr = sRoll.expr.replace(/(?<![0-9])0x\d+/g, "0");

    //Add ROLL MODS to rollp() ALONDAAR
    if (blocks[2] != null) {
      let rollpid = blocks[2].split(",");
      for (let k = 0; k < rollpid.length; k++) {
        if (rollpid[k] != "" && hasProperty(actorrolls, rollpid[k])) {
          let actorRollMod = actorrolls[rollpid[k]].value;
          if (
            actorRollMod == "" ||
            actorRollMod == null ||
            actorRollMod == undefined
          )
            continue;
          let rollMODvalue = await auxMeth.autoParser(
            actorRollMod,
            actorattributes,
            citemattributes,
            false,
            false,
            number
          );
          if (!isNaN(rollMODvalue)) sRoll.expr += "+(" + rollMODvalue + ")";
        }
      }
    }

    let partroll = new Roll(sRoll.expr);
    let keepImpMod = [];
    for (let i = 0; i < partroll.dice.length; i++) {
      keepImpMod.push({});
      for (let k = 0; k < partroll.dice[i].modifiers.length; k++)
        if (partroll.dice[i].modifiers[k].includes("im"))
          keepImpMod[i]["mod"] = partroll.dice[i].modifiers[k];
    }

    let finalroll = await partroll.evaluate({ async: true });
    finalroll.extraroll = true;
    for (let i = 0; i < finalroll.dice.length; i++) {
      if (keepImpMod[i] == undefined) continue;
      if (keepImpMod[i].mod)
        finalroll.dice[i].modifiers.push(keepImpMod[i].mod);
    }

    if (game.dice3d != null && !nochat) {
      //Dice So Nice Module
      const applyspecialdesignforalldicesrolledwithaexplodesomewhere = false;
      if (applyspecialdesignforalldicesrolledwithaexplodesomewhere) {
        // check for eploded dice
        for (let iDie = 0; iDie < partroll.dice.length; iDie++) {
          // check results for exploded
          let dcount = partroll.dice[iDie].results.length;
          for (let iResults = 0; iResults < dcount - 1; iResults++) {
            if (
              partroll.dice[iDie].results[iResults].hasOwnProperty("exploded")
            ) {
              if (partroll.dice[iDie].results[iResults].exploded) {
                let dicedesign = {
                  colorset: "custom",
                  foreground: "#FFFFFF",
                  background: game.user.color,
                  outline: "#000000",
                  edge: "#000000",
                  //texture: "skulls",
                  material: "metal",
                  //font: "Arial Black",
                  system: "standard",
                };
                partroll.dice[iDie].options.appearance = dicedesign;
              }
            }
          }
        }
      }
      await this.showDice3DAnimation(
        partroll,
        blindmode,
        gmmode,
        selfmode,
        rollModeFromUI
      );
    }
    sRoll.results = finalroll;
    await subrolls.push(sRoll);

    rollexp = rollexp.replace(tochange, "");
    rollformula = rollformula.replace(tochange, sRoll.expr);

    // Get the dice terms of the parsed roll
    let exptochange = "\\?\\[\\b" + sRoll.name + "\\]";
    var re = new RegExp(exptochange, "g");

    // Get the TOTAL associated with the roll
    let totaltochange = "\\?\\[\\b" + sRoll.name + ".total\\]";
    var reTotal = new RegExp(totaltochange, "g");

    let mysubRoll = subrolls.find((y) => y.name == sRoll.name);
    let finalvalue = "";
    let impTotal = 0;

    if (sRoll.results != null) {
      let currentDice = sRoll.results.dice;
      for (let j = 0; j < currentDice.length; j++) {
        let dicearray = currentDice[j].results;
        let diceNumber = currentDice[j].number;
        let diceMods = currentDice[j].modifiers;
        for (let m = 0; m < diceMods.length; m++) {
          if (diceMods[m].includes("im")) {
            let impValue = diceMods[m].match(/\d+/g);
            if (impValue == null) impValue = 1;

            let implodeCount = 0;
            //TODO: Set implode range to logical value (ie im2 implodes only on 2, but im<2 is 1 and 2)?
            for (let k = 0; k < diceNumber; k++) {
              if (dicearray[k].result <= impValue) implodeCount++;
            }

            let subImplodingRoll = {};
            subImplodingRoll.name = "Impl." + j;
            //
            // explode support
            let explodetheimplode = "";
            for (
              let lookforexplode = 0;
              lookforexplode < diceMods.length;
              lookforexplode++
            ) {
              if (diceMods[lookforexplode].includes("x")) {
                explodetheimplode = diceMods[lookforexplode];
              }
            }
            if (explodetheimplode != "") {
              subImplodingRoll.expr =
                implodeCount + "d" + currentDice[j].faces + explodetheimplode;
            } else {
              subImplodingRoll.expr = implodeCount + "d" + currentDice[j].faces;
            }
            let impRoll = new Roll(subImplodingRoll.expr);
            let impRollFinal = await impRoll.evaluate({ async: true });
            if (game.dice3d != null && !nochat) {
              //Dice So Nice Module
              // change color for imploding dice
              for (let impDie = 0; impDie < impRoll.dice.length; impDie++) {
                impRoll.dice[impDie].options.appearance = {
                  colorset: "custom",
                  foreground: auxMeth.invertColor(game.user.color, true),
                  background: game.user.color,
                  outline: game.user.color,
                  edge: game.user.color,
                  texture: "cloudy",
                  //material: "metal",
                  //font: "Arial Black",
                  system: "standard",
                };
              }
              await this.showDice3DAnimation(
                impRoll,
                blindmode,
                gmmode,
                selfmode,
                rollModeFromUI
              );
            }
            impRollFinal.extraroll = true;
            subImplodingRoll.results = impRollFinal;
            await subrolls.push(subImplodingRoll);
            impTotal = impRollFinal.total;
          }
        }

        // Handle ADD explosions
        if (mysubRoll.addexploding != null) {
          // Count upwards from the original number of dice thrown to tally explosions
          let explodeCounter = diceNumber;
          for (let k = 0; k < diceNumber; k++) {
            if (k > 0) finalvalue += ",";

            let rollvalue = 0;
            if (dicearray[k].active && !dicearray[k].discarded)
              rollvalue = dicearray[k].result;

            // More testing required if this works properly or not
            if (dicearray[k].exploded) {
              rollvalue += dicearray[explodeCounter].result;
              while (dicearray[explodeCounter].exploded)
                rollvalue += dicearray[++explodeCounter].result;
              explodeCounter++;
            }

            finalvalue += rollvalue;
          }
        } else {
          for (let k = 0; k < dicearray.length; k++) {
            if (k > 0) finalvalue += ",";

            let rollvalue = 0;
            if (dicearray[k].active && !dicearray[k].discarded)
              rollvalue = dicearray[k].result;

            finalvalue += rollvalue;
          }
        }

        // Necessary if the user inputs multile dice, such as "1d4 + 2d4"
        if (j != currentDice.length - 1) finalvalue += ",";
      }
      if (currentDice.length == 0) finalvalue += "0";
    } else finalvalue = 0;

    //Subtract the imploded total at the end
    if (finalvalue != 0 && impTotal != 0) {
      finalvalue += ",-" + impTotal; // ???
    }
    //console.log(finalvalue);

    rollformula = rollformula.replace(re, sRoll.expr);
    rollexp = rollexp.replace(re, finalvalue);
    rollformula = rollformula.replace(reTotal, sRoll.expr);
    if (impTotal != 0) {
      rollexp = rollexp.replace(reTotal, sRoll.results.total - impTotal);
    } else {
      rollexp = rollexp.replace(reTotal, sRoll.results.total);
    }
    rollexp = await auxMeth.autoParser(
      rollexp,
      actorattributes,
      citemattributes,
      true,
      false,
      number
    );
    rollformula = rollexp;
  }
  ////////////////////////////// END rollp() text implementation

  rollexp = await auxMeth.autoParser(
    rollexp,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );

  //PARSING FOLL FORMULA, TO IMPROVE!!!
  var sumResult = rollformula.match(/(?<=\bsum\b\().*?(?=\))/g);
  if (sumResult != null) {
    //Substitute string for current value
    for (let i = 0; i < sumResult.length; i++) {
      let splitter = sumResult[i].split(";");
      let comparer = splitter[0];
      let tochange = "sum(" + sumResult[i] + ")";
      rollformula = rollformula.replace(tochange, comparer);
    }
  }
  rollformula = rollformula.replace(/\bsum\b\(.*?\)/g, "");

  var countHResult = rollformula.match(/(?<=\bcountH\b\().*?(?=\))/g);
  if (countHResult != null) {
    //Substitute string for current value
    for (let i = 0; i < countHResult.length; i++) {
      let splitter = countHResult[i].split(";");
      let comparer = splitter[0];
      let tochange = "countH(" + countHResult[i] + ")";
      rollformula = rollformula.replace(tochange, comparer);
    }
  }
  rollformula = rollformula.replace(/\bcountH\b\(.*?\)/g, "");

  var countLResult = rollformula.match(/(?<=\bcountL\b\().*?(?=\))/g);
  if (countLResult != null) {
    //Substitute string for current value
    for (let i = 0; i < countLResult.length; i++) {
      let splitter = countLResult[i].split(";");
      let comparer = splitter[0];
      let tochange = "countL(" + countLResult[i] + ")";
      rollformula = rollformula.replace(tochange, comparer);
    }
  }
  rollformula = rollformula.replace(/\bcountL\b\(.*?\)/g, "");

  var countEResult = rollformula.match(/(?<=\bcountE\b\().*?(?=\))/g);
  if (countEResult != null) {
    //Substitute string for current value
    for (let i = 0; i < countEResult.length; i++) {
      let splitter = countEResult[i].split(";");
      let comparer = splitter[0];
      let tochange = "countE(" + countEResult[i] + ")";
      rollformula = rollformula.replace(tochange, comparer);
    }
  }
  rollformula = rollformula.replace(/\bcountE\b\(.*?\)/g, "");

  //Remove rollIDs and save them
  let parseid = rollexp.match(/(?<=\~)\S*?(?=\~)/g);

  //ADV & DIS to rolls
  var findIF = rollexp.search("if");
  var findADV = rollexp.search("~ADV~");
  var findDIS = rollexp.search("~DIS~");

  //Checks if it is an IF and does not have any ADV/DIS modifier in the formula
  if (findADV == -1 && findDIS == -1) {
    //In this case it allows to parse the manual MOD in case there is any
    findIF = -1;
  }

  if (parseid != null) {
    for (let j = 0; j < parseid.length; j++) {
      let idexpr = parseid[j];
      let idtoreplace = "~" + parseid[j] + "~";
      let newid = await auxMeth.autoParser(
        idexpr,
        actorattributes,
        citemattributes,
        true,
        number
      );

      if (newid != "") rollid.push(newid);

      if (parseid[j] == "init") initiative = true;

      if (parseid[j] == "gm") gmmode = true;

      if (parseid[j] == "blind")
        // TODO: This is checked early... Remove?
        blindmode = true;

      if (parseid[j] == "self")
        // TODO: This is checked early... Remove?
        selfmode = true;

      if (parseid[j] == "nochat")
        // TODO: This is checked early... Remove?
        nochat = true;

      if (parseid[j] == "noresult") showResult = false;

      if (findIF != -1) {
        //We don't do anything - We will parse this into the IF function inside autoParser
      } else {
        if (parseid[j] == "ADV") rollmode = "ADV";

        if (parseid[j] == "DIS") rollmode = "DIS";

        rollexp = rollexp.replace(idtoreplace, "");
        rollformula = rollformula.replace(idtoreplace, "");
      }
    }
  }

  //Set ADV or DIS
  if (findIF != -1) {
    //We don't do anything - We will parse this into the IF function inside autoParser
  } else {
    if (rollmode == "ADV") {
      rollexp = rollexp.replace(/1d20/g, "2d20kh");
    }

    if (rollmode == "DIS") {
      rollexp = rollexp.replace(/1d20/g, "2d20kl");
    }
  }

  if (gmmode) ToGM = ChatMessage.getWhisperRecipients("GM");

  //Parse Roll
  rollexp = await auxMeth.autoParser(
    rollexp,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );

  rollexp = await game.system.api._extractAPIFunctions(
    rollexp,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );
  rollformula = await game.system.api._extractAPIFunctions(
    rollformula,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );

  //Remove conditionalexp and save it
  rollexp = rollexp.replace(/\n|\r|\r\n/g, "<br>");
  let condid = rollexp.match(/(?<=\&\&)(.*?)(?=\&\&)/g);
  if (condid != null) {
    for (let j = 0; j < condid.length; j++) {
      let condidexpr = condid[j];
      if (condidexpr.length > 2) {
        //console.log(condidexpr);
        let conddtoreplace = "&&" + condid[j] + "&&";
        let separador = "";
        if (j < condid.length - 1) separador = "|";
        conditionalText += condidexpr + separador;

        rollexp = rollexp.replace(conddtoreplace, "");
      }
    }
  }

  rollformula = rollformula.replace(/\&\&.*?\&\&/g, "");
  rollexp = rollexp.trim();

  let roll;
  let multiroll = [];

  //PARSE SUBROLLS
  var attpresult = rollexp.match(/(?<=\·\·\!)\S*?(?=\!)/g);
  if (attpresult != null) {
    //Substitute string for current value
    for (let i = 0; i < attpresult.length; i++) {
      //                let debugname = attpresult[i];
      //                console.log(debugname);
      let attname = "··!" + attpresult[i] + "!";
      let attindex = attpresult[i];
      let attvalue = subrolls[parseInt(attindex)].total;

      rollexp = rollexp.replace(attname, attvalue);
      rollformula = rollformula.replace(
        attname,
        subrolls[parseInt(attindex)].expr
      );
    }
  }

  //Add ROLL MODS
  let extramod = 0;
  let extramodstring = "";
  for (let k = 0; k < rollid.length; k++) {
    if (rollid[k] != "" && hasProperty(actorrolls, rollid[k])) {
      rollformula += actorrolls[rollid[k]].value;
      rollexp += actorrolls[rollid[k]].value;
    }
  }

  // ALONDAAR -- EXPRESSION CATCHERS, REMOVE ANYTHING THAT DOES NOT NEED TO BE PARSED FOR RESULT
  //ADDer to target implementation - add(property;value)
  let addArray = null;
  [addArray, rollexp, rollformula] = await this.extractExpression(
    "add",
    rollexp,
    rollformula
  );

  let addSelfArray = null;
  [addSelfArray, rollexp, rollformula] = await this.extractExpression(
    "addself",
    rollexp,
    rollformula
  );

  //SETer to target implementation - set(property;value)
  let setArray = null;
  [setArray, rollexp, rollformula] = await this.extractExpression(
    "set",
    rollexp,
    rollformula
  );

  let setSelfArray = null;
  [setSelfArray, rollexp, rollformula] = await this.extractExpression(
    "setself",
    rollexp,
    rollformula
  );

  // Rollable Table from expression: table(table_name;optional_value)
  let tableArray = null;
  [tableArray, rollexp, rollformula] = await this.extractExpression(
    "table",
    rollexp,
    rollformula
  );

  //FIX FORMULA
  rollformula = await auxMeth.autoParser(
    rollformula,
    actorattributes,
    citemattributes,
    true,
    false,
    number
  );
  let formula = rollformula.replace(/\s[0]\s\+/g, "");
  formula = formula.replace(/(?<=\~)(.*)(?=\~)/g, "");
  formula = formula.replace(/\~/g, "");

  //ROLL EXPRESSION - ROLL TOTAL
  let partroll = new Roll(rollexp);

  roll = await partroll.evaluate({ async: true });
  if (game.dice3d != null && !nochat) {
    await this.showDice3DAnimation(
      partroll,
      blindmode,
      gmmode,
      selfmode,
      rollModeFromUI
    );
  }

  rolltotal = roll.total;
  if (this.system.mod == "" || this.system.mod == null) this.system.mod = 0;

  rolltotal = parseInt(rolltotal) + parseInt(this.system.mod) + extramod;

  if (roll.formula.charAt(0) != "-" || roll.formula.charAt(0) != "0")
    multiroll.push(roll);

  // Alondaar -- Actually parse the ADD/SETs that were found earlier
  await this.parseAddSet(
    addArray,
    "add",
    target,
    actorattributes,
    citemattributes,
    number,
    rolltotal
  );
  await this.parseAddSet(
    addSelfArray,
    "add",
    "SELF",
    actorattributes,
    citemattributes,
    number,
    rolltotal
  );
  await this.parseAddSet(
    setArray,
    "set",
    target,
    actorattributes,
    citemattributes,
    number,
    rolltotal
  );
  await this.parseAddSet(
    setSelfArray,
    "set",
    "SELF",
    actorattributes,
    citemattributes,
    number,
    rolltotal
  );
  // ---------------------------------------------------------------------
  //CHECK CRITS AND FUMBLES TO COLOR THE ROLL
  // ---------------------------------------------------------------------

  let hascrit = true; // assume
  let hasfumble = true;
  let hasCheckedForCriticalsAndFumbles = false;
  let rolldice;
  //console.log(multiroll);
  for (let j = 0; j < multiroll.length; j++) {
    let multirolldice = multiroll[j].dice;
    //console.log(multirolldice);
    if (!hasProperty(multiroll[j], "extraroll") && multirolldice.length > 0) {
      if (rolldice == null) {
        rolldice = multirolldice;
      } else {
        rolldice.push(multirolldice[0]);
      }
    }
  }

  const checkRollForCritAndFumbles = function (rollResult, hasCrit, hasFumble) {
    for (let i = 0; i < rollResult.length; i++) {
      let die = rollResult[i];
      // check that it has results
      if (die.hasOwnProperty("results")) {
        for (let j = 0; j < die.results.length; j++) {
          // check that die is active(not discarded etc by a 4d6k3 etc)
          if (die.results[j].active) {
            if (die.results[j].result != die.faces) {
              hasCrit = false;
            }
            if (die.results[j].result != 1) {
              hasFumble = false;
            }
            if (!hasCrit && !hasFumble) {
              break;
            }
          }
        }
        if (!hasCrit && !hasFumble) {
          break;
        }
      }
    }
    return [hasCrit, hasFumble];
  };

  if (subrolls.length > 0) {
    // only check the first sub roll
    [hascrit, hasfumble] = checkRollForCritAndFumbles(
      subrolls[0].results.terms,
      hascrit,
      hasfumble
    );
    hasCheckedForCriticalsAndFumbles = true;
  }
  if (rolldice != null) {
    //console.log(JSON.stringify(rolldice));
    [hascrit, hasfumble] = checkRollForCritAndFumbles(
      rolldice,
      hascrit,
      hasfumble
    );
    hasCheckedForCriticalsAndFumbles = true;
  }
  if (!hasCheckedForCriticalsAndFumbles) {
    // no check performed,  blank markers
    hascrit = false;
    hasfumble = false;
  }
  // ---------------------------------------------------------------------
  //TEXT MANAGMENET
  let convalue = "";
  if (conditionalText != "") {
    let blocks = conditionalText.split("|");

    for (let i = 0; i < blocks.length; i++) {
      let thiscond = blocks[i];
      if (thiscond.length > 1) {
        thiscond = thiscond.replace(
          /(?<=[\s|;|+|\-|*|\/\(|&|:])total(?=[\s|;|+|\-|*|\/\)])/g,
          rolltotal
        );

        //Only split the first ;
        let condblocksregexp = /(?:;)(.*?$)/;
        let condblocks = thiscond.split(";", 1);
        condblocks.push(thiscond.match(condblocksregexp)[1]);
        let checktype = condblocks[0];
        let mycondition = 0;
        checktype = checktype.replace(
          /(?<=[\s|;|+|\-|*|\/\(|&|:])total(?=[\s|;|+|\-|*|\/\)])/g,
          rolltotal
        );
        if (checktype === "total") {
          mycondition += rolltotal;
        } else {
          mycondition = await auxMeth.autoParser(
            checktype,
            actorattributes,
            citemattributes,
            false,
            false,
            number
          );
        }
        let myeval = "";
        for (let j = 1; j < condblocks.length; j++) {
          let comma = "";
          if (j < condblocks.length - 1) comma = ",";
          myeval += condblocks[j] + comma;
        }

        let finaleval = "%[" + mycondition + "," + myeval + "]";

        let finalevalvalue = await auxMeth.autoParser(
          finaleval,
          actorattributes,
          citemattributes,
          false,
          false,
          number
        );

        //REMOVES ARITHMETICAL EXPRESSION IN CONDITIONAL TEXTS!!!
        let parmatch = /\(/g;
        let parArray;
        let parresult = [];

        while ((parArray = parmatch.exec(finalevalvalue))) {
          let suba = finalevalvalue.substring(
            parmatch.lastIndex,
            finalevalvalue.length
          );
          let subb = auxMeth.getParenthesString(suba);
          parresult.push(subb);
        }

        if (parresult != null) {
          //Substitute string for current value
          for (let i = 0; i < parresult.length; i++) {
            let hasletters = /[A-Za-z]+/g;
            let hassubfunctions = parresult[i].match(hasletters);

            if (!hassubfunctions) {
              let parsedres = eval(parresult[i]);
              let tochax = "(" + parresult[i] + ")";
              finalevalvalue = finalevalvalue.replace(tochax, parsedres);
            }
          }
        }

        finalevalvalue = await auxMeth.autoParser(
          finalevalvalue,
          actorattributes,
          citemattributes,
          false,
          false,
          number
        );
        convalue += finalevalvalue + " ";
      }
    }
  }
  return {
    token: {
      img: this.img,
      name: this.name,
    },
    actor: this.name,
    flavor: rollname,
    formula: formula + extramodstring,
    mod: this.system.mod,
    result: rolltotal,
    dice: rolldice,
    subdice: subrolls,
    user: game.user.name,
    conditional: convalue,
    secretconditional: secretconditional,
    iscrit: hascrit,
    isfumble: hasfumble,
    blind: blindmode,
    link: linkmode,
    rollexp: initrollexp,
    actorid: this.id,
    msgid: null,
    showresult: showResult,
  };
}
