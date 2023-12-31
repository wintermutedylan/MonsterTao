const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var expTable = require("../units/exptable.json");
var natureTable = require("../units/natures.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'addunit',
    cooldown: 10,
    aliases: [],
    permissions: ["ADMINISTRATOR"],
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
        let attackIV = randomIntFromInterval(0, 15);
        let specialAttackIV = randomIntFromInterval(0, 15);
        let defenseIV = randomIntFromInterval(0, 15);
        let specialDefenseIV = randomIntFromInterval(0, 15);
        let healthIV = randomIntFromInterval(0, 15);
        let hp = healthStatCalc(baseHP, healthIV, 0, levelToSetUnit);
        let pickedNature = natureTable[Math.floor(Math.random()*natureTable.length)];
        let natureValues = pickNatureValues(pickedNature);
        //check the nature json here and update the values above.  random nature.  grab from json that matches name.  do switch for both increase and decrease
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
            //addToParty(pcID, ID);
        }
        let finalPokemon = {
            id: unit.id,
            pokedexNumber: unit.number,
            types: unit.types,
            level: levelToSetUnit,
            nature: pickedNature.name,
            health: hp,
            attack: otherStatCalc(baseAtk, attackIV, 0, levelToSetUnit, natureValues.attackNatureValue),
            defense: otherStatCalc(baseDef, defenseIV, 0, levelToSetUnit, natureValues.defenseNatureValue),
            specialAttack: otherStatCalc(baseSpecialAtk, specialAttackIV, 0, levelToSetUnit, natureValues.specialAttackNatureValue),
            specialDefense: otherStatCalc(baseSpecialDef, specialDefenseIV, 0, levelToSetUnit, natureValues.specialDefenseNatureValue),
            currentHealth: hp,
            moves: [],
            attackIV: attackIV,
            specialAttackIV: specialAttackIV,
            defenseIV: defenseIV,
            specialDefenseIV: specialDefenseIV,
            healthIV: healthIV,
            baseXP: unit.baseEXP,
            evs: unit.evMap,
            growthRate: unit.growthRate,
            stages: {
                attack: 0,
                defense: 0,
                specialAttack: 0,
                specialDefense: 0,
                evasion: 0,
                accuracy: 0
            },
            statusMap: {
                burned: false,
                frozen: false,
                paralysis: false,
                poisoned: false,
                asleep: false,
                sleepTurns: 0,
                confusion: false,
                confusionTurns: 0
            },
            catchRate: unit.catchRate
        }
        //addUnit(finalPokemon, ID, levelToSetUnit, pcID, exp, pickedNature.name);
        message.channel.send(`The ${pickedNature.name} Level ${levelToSetUnit} ${finalPokemon.id} has the following stats
Attack IV: ${finalPokemon.attackIV}, Special Attack IV: ${finalPokemon.specialAttackIV}, Defense IV: ${finalPokemon.defenseIV}, Special Defense IV: ${finalPokemon.specialDefenseIV}, Health IV: ${finalPokemon.healthIV}
Total Attack: ${finalPokemon.attack}, Total Special Attack: ${finalPokemon.specialAttack}, Total Defense: ${finalPokemon.defense}, Total Special Defense: ${finalPokemon.specialDefense}, Total Health: ${finalPokemon.health}`);





        
    }
}
function pickNatureValues(nature){
    let values= {
        attackNatureValue: 1,
        defenseNatureValue: 1,
        specialAttackNatureValue: 1,
        specialDefenseNatureValue: 1
    };
    switch(nature.increase){ //switch statement to get the increased stat from the nature
        case "attack":
            values.attackNatureValue = 1.1;
            break;
        case "defense":
            values.defenseNatureValue = 1.1;
            break;
        case "special-attack":
            values.specialAttackNatureValue = 1.1;
            break;
        case "special-defense":
            values.specialDefenseNatureValue = 1.1;
            break;

    }
    switch(nature.decrease){ //switch statement to get the decreased stat from the nature
        case "attack":
            values.attackNatureValue = 0.9;
            break;
        case "defense":
            values.defenseNatureValue = 0.9;
            break;
        case "special-attack":
            values.specialAttackNatureValue = 0.9;
            break;
        case "special-defense":
            values.specialDefenseNatureValue = 0.9;
            break;

    }
    return values;
}

async function addUnit(unit, ID, level, pcID, exp, nature){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    maids: {
                        "pcID": pcID,
                        "pokedexNumber": unit.pokedexNumber,
                        "id": unit.id,
                        "types": unit.types,
                        "level": level,
                        "experience": exp,
                        "nature": nature,
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
function healthStatCalc(base, iv, ev, level){
    let top = (2 * base + iv + Math.floor(ev/4)) * level;
    let bot = Math.floor(top / 100);
    let total = bot + level + 10;
    return total;
}

function otherStatCalc(base, iv, ev, level, nature){
    let top = (2 * base + iv + Math.floor(ev/4)) * level;
    let bot = Math.floor(top / 100);
    let total = bot + 5;
    return Math.floor(total * nature);
}