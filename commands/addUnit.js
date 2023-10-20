const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'addunit',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        
    
        
        var unitName = args.join(" ");
        var isUnit = false;
        let unit;
        for (let i = 0; i < maids.length; i++){
            if (unitName === maids[i].id){
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
        //let playerData; 
        //playerData = await playerModel.findOne({ userID: message.author.id});
        //if (!playerData) return message.channel.send("You don't exist. Please try again.");
        //var ID = message.author.id;
        unit.attackIV = randomIntFromInterval(0, 15);
        unit.specialAttackIV = randomIntFromInterval(0, 15);
        unit.defenseIV = randomIntFromInterval(0, 15);
        unit.specialDefenseIV = randomIntFromInterval(0, 15);
        unit.healthIV = randomIntFromInterval(0, 15);
        unit.attack = otherStatCalc(baseAtk, unit.attackIV, 5);
        unit.specialAttack = otherStatCalc(baseAtk, unit.specialAttackIV, 5);
        unit.defense = otherStatCalc(baseDef, unit.defenseIV, 5);
        unit.specialDefense = otherStatCalc(baseAtk, unit.specialDefenseIV, 5);
        unit.health = healthStatCalc(baseHP, unit.healthIV, 5);
        //addUnit(unitName, ID);
        message.channel.send(`The Level 5 ${unitName} has the following stats
Base Attack: ${baseAtk}, Base Special Attack: ${baseSpecialAtk}, Base Defense: ${baseDef}, Base Special Attack: ${baseSpecialDef}, Base Health: ${baseHP}
Attack IV: ${unit.attackIV}, Special Attack IV: ${unit.specialAttackIV}, Defense IV: ${unit.defenseIV}, Special Defense IV: ${unit.specialDefenseIV}, Health IV: ${unit.healthIV}
Total Attack: ${unit.attack}, Total Special Attack: ${unit.specialAttack}, Total Defense: ${unit.defense}, Total Special Defense: ${unit.specialDefense}, Total Health: ${unit.health}`);





        
    }
}

async function addUnit(unitName, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    maids: {
                        "id": "Milim",
                        "level": 5,
                        "attack": 10,
                        "defense": 10,
                        "health": 25,
                        "currentHealth": 25,
                        "moves": ["Tackle", "Scratch"]
                    }
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
    let top = ((base + iv) * 2) * level;
    let bot = top / 100;
    let total = bot + level + 10;
    return Math.floor(total);
}

function otherStatCalc(base, iv, level){
    let top = ((base + iv) * 2) * level;
    let bot = top / 100;
    let total = bot + 5;
    return Math.floor(total);
}