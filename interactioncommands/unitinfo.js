const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
var stageInfo = require("../units/stages.json");
var temp = require("../units/tempfile.json");
var expTable = require("../units/exptable.json");
const fs = require("fs");
const JSON_FILE = "../monstertao/units/friendship.json"; //base experience
const jsonData = fs.readFileSync(JSON_FILE);
const newData = JSON.parse(jsonData);

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

const playerModel = require("../models/playerSchema");

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('pokemoninfo')
		.setDescription('Get info about one of your pokemon')
        .addStringOption(option => 
            option
                .setName('pokemon')
                .setDescription('The name of the pokemon')
                .setAutocomplete(true)
                .setRequired(true)),
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

        } else {
 
            if (focusedOption.name === 'pokemon') {
                
                let pokemon = [];
                for(let i = 0; i < playerData.maids.length; i++){
                    let x = {
                        name:  playerData.maids[i].id,
                        value: playerData.maids[i].pcID.toString()
                    }
                    pokemon.push(x);
                }
                
                choices = pokemon;
                
                
            }

            const filtered = choices.filter(choice => choice.name.includes(focusedOption.value) || choice.value.toString().includes(focusedOption.value));
            
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.value + ": " + choice.name, value: choice.value })),
            );
        }
    },
    
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        let sorted = playerData.maids.find( function(item) { return item.pcID == interaction.options.getString('pokemon') } );
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**Pokemon Info**")
        .setDescription(`__**${sorted.id}**__`)
        .setFooter({text: `PCID# ${sorted.pcID}`})
        if(sorted.level != 100){
            let unitExp = expTable.find(function(item) { return item.name == sorted.growthRate});
            let expToNextLevel = unitExp.levelTable.find(function(expItem) { return expItem.level == sorted.level + 1});
            newEmbed.addFields({name: "Level", value:`Level: ${sorted.level}, EXP: ${sorted.experience}/${expToNextLevel.experience}` })
        
        } else {
            newEmbed.addFields({name: "Level", value:`Level: ${sorted.level}, EXP: Max Level` })
        }
        newEmbed.addFields(
            {name: "Stats", value:`Hp: ${sorted.currentHealth}/${sorted.health}, Atk: ${sorted.attack}, SpAtk: ${sorted.specialAttack}, Def: ${sorted.defense}, SpDef: ${sorted.specialDefense}` },
            {name: "IVs", value: `Hp: ${sorted.ivMap.healthIV}, Atk: ${sorted.ivMap.attackIV}, SpAtk: ${sorted.ivMap.specialAttackIV}, Def: ${sorted.ivMap.defenseIV}, SpDef: ${sorted.ivMap.specialDefenseIV}`},
            {name: "EVs", value: `Hp: ${sorted.evMap.hp}, Atk: ${sorted.evMap.attack}, SpAtk: ${sorted.evMap.specialAttack}, Def: ${sorted.evMap.defense}, SpDef: ${sorted.evMap.specialDefense}`},
            {name: "Types", value: `${sorted.types.join(", ")}`},
            {name: "Nature", value: `${sorted.nature}`},
            {name: "Happiness", value: `${sorted.happiness}`},
            {name: "Moves", value: `${sorted.moves.join(", ")}`}
            )
        
        interaction.reply({embeds: [newEmbed]});
        
        
        
        





        
    }
}