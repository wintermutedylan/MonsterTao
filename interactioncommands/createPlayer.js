const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var maids = require("../units/maids.json");
var expTable = require("../units/exptable.json");
var natureTable = require("../units/natures.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register your profile and select a starter'),
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData || playerData.maids.length == 0){
            try {
                playerData = await playerModel.findOne({ userID: interaction.user.id });
                if (!playerData){
                    let player = await playerModel.create({
                        userID: interaction.user.id,
                        coins: 0,
                        maids: [],
                        currentParty: [],
                        badges: [],
                        bag: []
                        
                    });
                    player.save();
                }
            } catch(err){
                console.log(err);
            }
            
            interaction.reply("Profile created! Please select a starter\nYour options are: \nGen 1: Bulbasaur, Charmander, Squirtle\nGen 2: Chikorita, Cyndaquill, Totodile\nGen 3: Treecko, Torchic, Mudkip\nGen 4: Turtwig, Chimchar, Piplup\n---------------------------------------\nDev Note: The starters past gen 1 won't really work since I only have gen 1 moves in.  pick gen 1 for now until I get the rest of the moves in");
            //DEV THING HERE TO TELL MELDOY THAT SOME STARTERS SHOULDNT BE PICKED
            
            
            const filter = (m) => {
                return  m.author.id === interaction.user.id && (m.content.toLowerCase() === 'bulbasaur' || m.content.toLowerCase() === 'charmander' || m.content.toLowerCase() === 'squirtle');
            }
            const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000})
            var s;
            
            
    
            collector.on('collect', message => {
                s = message;
                
            });
    
            collector.on('end', collected => {
            
                if (collected.size === 0) {
                    return interaction.channel.send(`${userMention(interaction.user.id)} You did not select a starter in time.`);
                }
                
                    if (s.content.toLowerCase() == 'bulbasaur'){
                        return createAndAddStarter(interaction.user.id, 'Bulbasaur', interaction, s);
                    } else if (s.content.toLowerCase() == 'charmander'){
                        return createAndAddStarter(interaction.user.id, 'Charmander', interaction, s);
                    } else if (s.content.toLowerCase() == 'squirtle'){
                        return createAndAddStarter(interaction.user.id, 'Squirtle', interaction, s);
                    }
                    
            });
        } else {
            return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true})
        }
        

        
   
    }
}

async function createAndAddStarter(ID, starter, interaction, message){
        let levelToSetUnit = 5;
        let exp = 1;
        
        let unit;
        for (let i = 0; i < maids.length; i++){
            if (starter.toLowerCase() === maids[i].id.toLowerCase()){
                unit = maids[i];
            }
        }
        
        let baseAtk = unit.attack;
        let baseSpecialAtk = unit.specialAttack;
        let baseDef = unit.defense;
        let baseSpecialDef = unit.specialDefense;
        let baseHP = unit.health;
        let pickedNature = natureTable[Math.floor(Math.random()*natureTable.length)];
        let natureValues = pickNatureValues(pickedNature);
        //check the nature json here and update the values above.  random nature.  grab from json that matches name.  do switch for both increase and decrease
        
        //get maids array length here to convert into pc id.  use length +1 to avoid setting the first pokemon as 0.  
        //send pc id into the addunit function to apply it to all the units.  
        //also if they have less than 6 pokemon or when adding the current pokemon and it will equal 6, set those to the current party.  
        //once you add the 7th pokemon just add it to the maids array and they can use the set party command to configure the party.
        let expTemp = expTable.find(function(item) { return item.name == unit.growthRate}).levelTable;
        exp = expTemp.find(function(expItem) { return expItem.level == levelToSetUnit}).experience;
        let pcID = 1;
        
        addToParty(pcID, ID);
        unit.attackIV = randomIntFromInterval(0, 15);
        unit.specialAttackIV = randomIntFromInterval(0, 15);
        unit.defenseIV = randomIntFromInterval(0, 15);
        unit.specialDefenseIV = randomIntFromInterval(0, 15);
        unit.healthIV = randomIntFromInterval(0, 15);
        unit.attack = otherStatCalc(baseAtk, unit.attackIV, 0, levelToSetUnit, natureValues.attackNatureValue);
        unit.specialAttack = otherStatCalc(baseSpecialAtk, unit.specialAttackIV, 0, levelToSetUnit, natureValues.specialAttackNatureValue);
        unit.defense = otherStatCalc(baseDef, unit.defenseIV, 0, levelToSetUnit, natureValues.defenseNatureValue);
        unit.specialDefense = otherStatCalc(baseSpecialDef, unit.specialDefenseIV, 0, levelToSetUnit, natureValues.specialDefenseNatureValue);
        unit.health = healthStatCalc(baseHP, unit.healthIV, 0, levelToSetUnit);
        addUnit(unit, ID, levelToSetUnit, pcID, exp, pickedNature.name);
        let unitExp = expTable.find(function(item) { return item.name == unit.growthRate});
        let expToNextLevel = unitExp.levelTable.find(function(expItem) { return expItem.level == levelToSetUnit + 1});
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`Pokemon Info`)
        .setDescription(`__**${unit.id}**__`)
        .setFields(
            {name: "Level", value:`Level: ${levelToSetUnit}, EXP: ${exp}/${expToNextLevel.experience}` },
            {name: "Stats", value:`Hp: ${unit.health}/${unit.health}, Atk: ${unit.attack}, SpAtk: ${unit.specialAttack}, Def: ${unit.defense}, SpDef: ${unit.specialDefense}` },
            {name: "IVs", value: `Hp: ${unit.healthIV}, Atk: ${unit.attackIV}, SpAtk: ${unit.specialAttackIV}, Def: ${unit.defenseIV}, SpDef: ${unit.specialDefenseIV}`}
        )
        return message.reply({content: `You have successfully selected ${unit.id} as your starter. Here are its stats:`, embeds: [ newEmbed], ephemeral: true});
        
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
                        "pokedexNumber": unit.number,
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