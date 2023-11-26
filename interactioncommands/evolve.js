var maids = require("../units/maids.json");
var routeEncounters = require("../units/routes.json");
var moveinfo = require("../units/moveinfo.json");
var moveList = require("../units/moves.json");
var typeList = require("../units/typechart.json");
var natureTable = require("../units/natures.json");
var expTable = require("../units/exptable.json");
var stageCalcs = require("../units/stages.json");
var items = require("../units/items.json");
var badgePenalty = require("../units/badgepenalty.json");
const playerModel = require("../models/playerSchema");
const { userMention, memberNicknameMention, channelMention, roleMention } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    cooldown: 15,
	data: new SlashCommandBuilder()
		.setName('evolve')
		.setDescription('Encounters a wild Pokemon')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('type of evolution you want to do.')
                .setRequired(true)
				.addChoices(
                    { name: 'Level', value: 'level'},
                    { name: 'Item (NOT WORKING RN)', value: 'item'},
                    { name: 'Happiness', value: 'happiness'},
                    { name: 'Move', value: 'move'}
                    ))
        .addStringOption(option =>
            option.setName('pokemon')
                .setDescription('The pokemon you want to evolve')
                .setRequired(true)
				.setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
		let choices;
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        
        
        if(!playerData){
            choices = ["You don't exist. Please run /register to create a profile"]
            const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );

        } else if (focusedOption.name === 'pokemon') {
            
            let eligiblePokemon = [];
            for(let i = 0; i < playerData.maids.length; i++){
                eligiblePokemon.push(playerData.maids[i]);
                
            }
            
            choices = eligiblePokemon;
            
            const filtered = choices.filter(choice => choice.id.includes(focusedOption.value));
        
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name:'PCID# ' + choice.pcID + ' ' + choice.id, value: choice.pcID.toString() })),
            );
            
			
		}

		
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        
        
        let pokemonLocation = playerData.maids.findIndex(function(item) { return item.pcID == Number(interaction.options.getString('pokemon'))})
        if(pokemonLocation == -1){
            return interaction.reply("An has occured while trying to get the pokemon you selected");
        }
        let pokemonInfo = playerData.maids[pokemonLocation];
        
        
        let unitDetails = maids.find(function(item) {return item.id.toLowerCase() == pokemonInfo.id.toLowerCase()});
        let unitToEvolveTo;
        let evoTo = unitDetails.evolutionDetails.filter(fil => fil.evolvesTo != null);
        if(interaction.options.getString('type') == 'level'){
            
            let actualEvoTo = evoTo.find(function(item) { return item.evolutionData.trigger.name == "level-up" && item.evolutionData.min_level != null});
            if(!actualEvoTo){
                return interaction.reply(`${pokemonInfo.id} can't evolve this way, run /pokemoninfo to see if/how it can evolve`);
            }
            if(unitDetails.id == "Wurmple"){
                let amountCheck = Math.round(Math.random() * 100);
                
                if (amountCheck < 50){
                    unitToEvolveTo = maids.find(function(e) { return e.id == 'Cascoon' });
                } else {
                    unitToEvolveTo = maids.find(function(e) { return e.id == 'Silcoon' });
                }
            } else if(unitDetails.id == "Tyrogue"){
                
                if(pokemonInfo.attack > pokemonInfo.defense){
                    unitToEvolveTo = maids.find(function(e) { return e.id == 'Hitmonlee' });
                } else if(pokemonInfo.attack < pokemonInfo.defense){
                    unitToEvolveTo = maids.find(function(e) { return e.id == 'Hitmonchan' });
                } else {
                    unitToEvolveTo = maids.find(function(e) { return e.id == 'Hitmontop' });
                }
                
            } else {
                unitToEvolveTo = maids.find(function(e) { return e.id.toLowerCase() == actualEvoTo.evolvesTo.toLowerCase() });
            }
            
        } else if(interaction.options.getString('type') == 'move'){
            let actualEvoTo = evoTo.find(function(item) { return item.evolutionData.trigger.name == "move" && item.evolutionData.known_move != null});
            if(!actualEvoTo){
                return interaction.reply(`${pokemonInfo.id} can't evolve this way, run /pokemoninfo to see if/how it can evolve`);
            }
            if(pokemonInfo.moves.findIndex(function(item) { return item.toLowerCase() == actualEvoTo.evolutionData.known_move.name}) != -1){
                unitToEvolveTo = maids.find(function(e) { return e.id.toLowerCase() == actualEvoTo.evolvesTo.toLowerCase() });
            }
        } else if(interaction.options.getString('type') == 'happiness'){
            let actualEvoTo = evoTo.find(function(item) { return item.evolutionData.trigger.name == "happiness" && item.evolutionData.min_happiness != null});
            if(!actualEvoTo){
                return interaction.reply(`${pokemonInfo.id} can't evolve this way, run /pokemoninfo to see if/how it can evolve`);
            }
            if(pokemonInfo.happiness >= actualEvoTo.evolutionData.min_happiness){
                unitToEvolveTo = maids.find(function(e) { return e.id.toLowerCase() == actualEvoTo.evolvesTo.toLowerCase() });
            }
        } else if(interaction.options.getString('type') == 'item'){
            let actualEvoTo = evoTo.find(function(item) { return item.evolutionData.trigger.name == "use-item" && item.evolutionData.item != null});
            let itemIndex = pokemonInfo.bag.findIndex(function(item) { return item.name.toLowerCase() == actualEvoTo.evolutionData.item.name.toLowerCase()})
            let newBagArray = playerBag.bag;
            if(!actualEvoTo){
                return interaction.reply(`${pokemonInfo.id} can't evolve this way, run /pokemoninfo to see if/how it can evolve`);
            }
            if(itemIndex != -1){
                unitToEvolveTo = maids.find(function(e) { return e.id.toLowerCase() == actualEvoTo.evolvesTo.toLowerCase() });
                if(playerData.bag[itemIndex].amount - 1 == 0){
                    newBagArray.splice(itemIndex, 1); 
                    removeItem(interaction.user.id, newBagArray);
                } else {
                    removeItemAmount(interaction.user.id, itemIndex);
                }
            }
        }
        
        
        // for(let e = 0; e < unit.evolutionDetails.length; e++){
        //     if(pokemonInfo.level < unit.evolutionDetails[e].evolutionData.min_level || maids.findIndex(function(it) { return it.id.toLowerCase() == unit.evolutionDetails[e].evolvesTo.toLowerCase()}) == -1){
                
                
        //     }
        // }
        

        
        
        
        

        let baseAtk = unitToEvolveTo.attack;
        let baseSpecialAtk = unitToEvolveTo.specialAttack;
        let baseDef = unitToEvolveTo.defense;
        let baseSpecialDef = unitToEvolveTo.specialDefense;
        let baseHP = unitToEvolveTo.health;
        let attackIV = pokemonInfo.ivMap.attackIV;
        let specialAttackIV = pokemonInfo.ivMap.specialAttackIV;
        let defenseIV = pokemonInfo.ivMap.defenseIV;
        let specialDefenseIV = pokemonInfo.ivMap.specialDefenseIV;
        let healthIV = pokemonInfo.ivMap.healthIV;
        let pickedNature = pokemonInfo.nature;
        let natureValues = pickNatureValues(pickedNature);
        let hp = healthStatCalc(baseHP, healthIV, pokemonInfo.evMap.hp, pokemonInfo.level);
        let attack = otherStatCalc(baseAtk, attackIV, pokemonInfo.evMap.attack, pokemonInfo.level, natureValues.attackNatureValue);
        let defense = otherStatCalc(baseDef, defenseIV, pokemonInfo.evMap.defense, pokemonInfo.level, natureValues.defenseNatureValue);
        let specialAttack = otherStatCalc(baseSpecialAtk, specialAttackIV, pokemonInfo.evMap.specialAttack, pokemonInfo.level, natureValues.specialAttackNatureValue);
        let specialDefense = otherStatCalc(baseSpecialDef, specialDefenseIV, pokemonInfo.evMap.specialDefense, pokemonInfo.level, natureValues.specialDefenseNatureValue);
        pokemonInfo.id = unitToEvolveTo.id;
        pokemonInfo.attack = attack;
        pokemonInfo.health = hp;
        pokemonInfo.defense = defense;
        pokemonInfo.specialAttack = specialAttack;
        pokemonInfo.specialDefense = specialDefense;
        let unitExp = expTable.find(function(item) { return item.name == pokemonInfo.growthRate});
        let exp = unitExp.levelTable.find(function(expItem) { return expItem.level == pokemonInfo.level}).experience;
        let expToNextLevel = unitExp.levelTable.find(function(expItem) { return expItem.level == pokemonInfo.level + 1});
        
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`Pokemon Info`)
        .setDescription(`__**${pokemonInfo.id} PCID# ${pokemonInfo.pcID}**__`)
        .setFields(
            {name: "Level", value:`Level: ${pokemonInfo.level}, EXP: ${exp}/${expToNextLevel.experience}` },
            {name: "Stats", value:`Hp: ${pokemonInfo.health}/${pokemonInfo.health}, Atk: ${pokemonInfo.attack}, SpAtk: ${pokemonInfo.specialAttack}, Def: ${pokemonInfo.defense}, SpDef: ${pokemonInfo.specialDefense}` },
            {name: "IVs", value: `Hp: ${healthIV}, Atk: ${attackIV}, SpAtk: ${specialAttackIV}, Def: ${defenseIV}, SpDef: ${specialDefenseIV}`}
            
        )
        
        setEvolvePokemon(pokemonLocation,pokemonInfo,interaction.user.id);
        return interaction.reply({content:`Congrats your ${unitDetails.id} evolved into ${pokemonInfo.id}`, embeds:[newEmbed]});
        

        
       
        
        
        
        
    }
    
}
async function setEvolvePokemon(location, pokemon, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    ["maids."+location]: pokemon
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
async function removeItemAmount(ID, location){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $inc: {
                    ["bag." + location + ".amount"]: -1
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}
async function removeItem(ID, bagArray){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    bag: bagArray
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}