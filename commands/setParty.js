const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'setparty',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        
    
        
        var unitName = args.join(" ");
        var isUnit = false;
        let unit;
        for (let i = 0; i < maids.length; i++){ //for loop to actually create the party.  then use the if statement below to make sure you actually own the unit. 
            if (unitName === maids[i].id){ //tho you can just check if you own it here.  can use pc id for it instead should make it easier to set your party
                isUnit = true;  
                unit = maids[i];
            }
        }
        if (!isUnit) return message.reply(`**${unitName}** is not a valid unit, Please enter a valid unit`); //change this to check if you have that unit. need to add ids to all units that you own to make it easier to set party
        
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        





        
    }
}

async function addUnit(unit, ID, level){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    maids: {
                        "pokedexNumber": unit.number,
                        "id": unit.id,
                        "types": unit.types,
                        "level": level,
                        "health": unit.health,
                        "attack": unit.attack,
                        "defense": unit.defense,
                        "specialAttack": unit.specialAttack,
                        "specialDefense": unit.specialDefense,
                        "moves": unit.moves,
                        "currentHealth": unit.health,
                        "healthIV": unit.healthIV,
                        "attackIV": unit.attackIV,
                        "defenseIV": unit.defenseIV,
                        "specialAttackIV": unit.specialAttackIV,
                        "specialDefenseIV": unit.specialDefenseIV,
                        "burned": false, 
                        "frozen": false, 
                        "paralysis": false, 
                        "poisoned": false, 
                        "asleep": false, 
                        "sleepTurns": 0, 
                        "sleepTurnsLeft": 0, 
                        "confusion": false, 
                        "confusionTurns": 0, 
                        "confusionTurnsLeft": 0
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