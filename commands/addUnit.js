const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var expTable = require("../units/exptable.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'addunit',
    aliases: [],
    permissions: [],
    description: "adds a pokemon to your pc.  arguments it takes are the pokemon name then level in that order",
    async execute(client, message, cmd, args, Discord){
        
        
        let levelToSetUnit = Number(args.pop());
        let exp = 1;
        
        var unitName = args.join(" ");
        var isUnit = false;
        let unit;
        for (let i = 0; i < maids.length; i++){
            if (unitName.toLowerCase() === maids[i].id.toLowerCase()){
                isUnit = true;  
                unit = maids[i];
            }
        }
        if (!isUnit) return message.reply(`**${unitName}** is not a valid unit, Please enter a valid unit`);
        let baseAtk = unit.attack;
        let baseSpecialAtk = unit.specialAttack;
        let baseDef = unit.defense;
        let baseSpecialDef = unit.specialDefense;
        let baseHP = unit.health;
        let attackNatureValue = 1;
        let defenseNatureValue = 1;
        let specialAttackNatureValue = 1;
        let specialDefenseNatureValue = 1;
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        //get maids array length here to convert into pc id.  use length +1 to avoid setting the first pokemon as 0.  
        //send pc id into the addunit function to apply it to all the units.  
        //also if they have less than 6 pokemon or when adding the current pokemon and it will equal 6, set those to the current party.  
        //once you add the 7th pokemon just add it to the maids array and they can use the set party command to configure the party.
        for(let e = 0; e < expTable.length; e++){
            if(unit.growthRate == expTable[e].name){
                for(let j = 0; j < expTable[e].levelTable.length; j++){
                    if(levelToSetUnit == expTable[e].levelTable[j].level){
                        exp = expTable[e].levelTable[j].experience;
                        break;
                    }
                }
            }
        }
        let pcID = playerData.maids.length + 1;
        var ID = message.author.id;
        let currentPartyLength = playerData.currentParty.length;
        if (currentPartyLength < 6){
            addToParty(pcID, ID);
        }
        unit.attackIV = randomIntFromInterval(0, 15);
        unit.specialAttackIV = randomIntFromInterval(0, 15);
        unit.defenseIV = randomIntFromInterval(0, 15);
        unit.specialDefenseIV = randomIntFromInterval(0, 15);
        unit.healthIV = randomIntFromInterval(0, 15);
        unit.attack = otherStatCalc(baseAtk, unit.attackIV, levelToSetUnit);
        unit.specialAttack = otherStatCalc(baseSpecialAtk, unit.specialAttackIV, levelToSetUnit);
        unit.defense = otherStatCalc(baseDef, unit.defenseIV, levelToSetUnit);
        unit.specialDefense = otherStatCalc(baseSpecialDef, unit.specialDefenseIV, levelToSetUnit);
        unit.health = healthStatCalc(baseHP, unit.healthIV, levelToSetUnit);
        addUnit(unit, ID, levelToSetUnit, pcID, exp);
        message.channel.send(`The Level ${levelToSetUnit} ${unitName} has the following stats
Attack IV: ${unit.attackIV}, Special Attack IV: ${unit.specialAttackIV}, Defense IV: ${unit.defenseIV}, Special Defense IV: ${unit.specialDefenseIV}, Health IV: ${unit.healthIV}
Total Attack: ${unit.attack}, Total Special Attack: ${unit.specialAttack}, Total Defense: ${unit.defense}, Total Special Defense: ${unit.specialDefense}, Total Health: ${unit.health}`);





        
    }
}

async function addUnit(unit, ID, level, pcID, exp){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    maids: {
                        "pcID": pcID,
                        "pokedexNumber": unit.number,
                        "id": unit.id,
                        "types": unit.types,
                        "level": level,
                        "experience": exp,
                        "happiness": 0,
                        "growthRate": unit.growthRate,
                        "health": unit.health,
                        "attack": unit.attack,
                        "defense": unit.defense,
                        "specialAttack": unit.specialAttack,
                        "specialDefense": unit.specialDefense,
                        "currentHealth": unit.health,
                        "moves": unit.moves,
                        "ivMap": {
                            "healthIV": unit.healthIV,
                            "attackIV": unit.attackIV,
                            "defenseIV": unit.defenseIV,
                            "specialAttackIV": unit.specialAttackIV,
                            "specialDefenseIV": unit.specialDefenseIV
                        },
                        "evMap": {
                            "hp": 0,
                            "attack": 0,
                            "defense": 0,
                            "specialAttack": 0,
                            "specialDefense": 0
                        },
                        "statusMap": {
                            "burned": false, 
                            "frozen": false, 
                            "paralysis": false, 
                            "poisoned": false, 
                            "asleep": false, 
                            "sleepTurns": 0, 
                            "confusion": false, 
                            "confusionTurns": 0
                        }
                        
                    }
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}

async function addToParty(pcID, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    currentParty: pcID 
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
function healthStatCalc(base, iv, level){
    let top = (2 * base + iv + Math.floor(0/4)) * level;
    let bot = Math.floor(top / 100);
    let total = bot + level + 10;
    return total;
}

function otherStatCalc(base, iv, level){
    let top = ((base + iv) * 2) * level;
    let bot = top / 100;
    let total = bot + 5;
    return Math.floor(total);
}