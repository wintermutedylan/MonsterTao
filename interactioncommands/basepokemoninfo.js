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
		.setName('basepokemoninfo')
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
 

            const filtered = maids.filter(choice => choice.id.includes(focusedOption.value));
            
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: choice.id, value: choice.id })),
            );
        }
    },
    
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        let learnedString = "";
        let otherString = "";
        let sorted = maids.find( function(item) { return item.id.toLowerCase() == interaction.options.getString('pokemon').toLowerCase() } );
        if(!sorted) return interaction.reply({content:`An error has occurred trying to find the pokemon: ${interaction.options.getString('pokemon')}, please try again.`, ephemeral: true});
        let learnedMoves = moveinfo.find(function(m) { return m.id.toLowerCase() == sorted.id.toLowerCase()}).leveUpMoves;
        let otherMoves = moveinfo.find(function(m) { return m.id.toLowerCase() == sorted.id.toLowerCase()}).otherMoves;
        otherMoves = otherMoves.filter(function(n) { return n.method == "machine"});
        var learnedSorted = learnedMoves.sort((a, b) => (a.level) - (b.level));
        for(let i = 0; i < learnedSorted.length; i++){
            
            learnedString += `${learnedSorted[i].name[0].toUpperCase() + learnedSorted[i].name.slice(1)}, Level: ${learnedSorted[i].level}\n`;
        }
        for(let j = 0; j < otherMoves.length; j++){
            otherString += `${otherMoves[j].name[0].toUpperCase() + otherMoves[j].name.slice(1)}, `;
        }
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**Pokemon Info**")
        .setDescription(`__**${sorted.id}**__\n**Base Stats**\nHp: ${sorted.health}, Atk: ${sorted.attack}, SpAtk: ${sorted.specialAttack}, Def: ${sorted.defense}, SpDef: ${sorted.specialDefense}\n**Types**\n${sorted.types.join(", ")}`)
        
        newEmbed.addFields(
            {name: "Moves by level up", value: learnedString},
            {name: "Moves by TM", value: otherString}
            )
        if(sorted.evolutionDetails[0].evolvesTo == null){
            newEmbed.addFields({name: "Evolution Details", value: "Does not evolve"});
        } else {
            let evolveString = "";
            for(let e = 0; e < sorted.evolutionDetails.length; e++){
                if(sorted.evolutionDetails[e].evolutionData.trigger.name == "level-up"){
                    evolveString += `Evolves to: ${sorted.evolutionDetails[e].evolvesTo[0].toUpperCase() + sorted.evolutionDetails[e].evolvesTo.slice(1)}, Evolution Method: ${sorted.evolutionDetails[e].evolutionData.trigger.name[0].toUpperCase() + sorted.evolutionDetails[e].evolutionData.trigger.name.slice(1)}, Level: ${sorted.evolutionDetails[e].evolutionData.min_level}\n`;
                } else if(sorted.evolutionDetails[e].evolutionData.trigger.name == "use-item"){
                    evolveString += `Evolves to: ${sorted.evolutionDetails[e].evolvesTo[0].toUpperCase() + sorted.evolutionDetails[e].evolvesTo.slice(1)}, Evolution Method: ${sorted.evolutionDetails[e].evolutionData.trigger.name[0].toUpperCase() + sorted.evolutionDetails[e].evolutionData.trigger.name.slice(1)}, Item: ${sorted.evolutionDetails[e].evolutionData.item.name[0].toUpperCase() + sorted.evolutionDetails[e].evolutionData.item.name.slice(1)}\n`;
                } else if(sorted.evolutionDetails[e].evolutionData.trigger.name == "happiness"){
                    evolveString += `Evolves to: ${sorted.evolutionDetails[e].evolvesTo[0].toUpperCase() + sorted.evolutionDetails[e].evolvesTo.slice(1)}, Evolution Method: ${sorted.evolutionDetails[e].evolutionData.trigger.name[0].toUpperCase() + sorted.evolutionDetails[e].evolutionData.trigger.name.slice(1)}, Happiness: ${sorted.evolutionDetails[e].evolutionData.min_happiness}\n`;
                } else if(sorted.evolutionDetails[e].evolutionData.trigger.name == "move"){
                    evolveString += `Evolves to: ${sorted.evolutionDetails[e].evolvesTo[0].toUpperCase() + sorted.evolutionDetails[e].evolvesTo.slice(1)}, Evolution Method: ${sorted.evolutionDetails[e].evolutionData.trigger.name[0].toUpperCase() + sorted.evolutionDetails[e].evolutionData.trigger.name.slice(1)}, Known Move: ${sorted.evolutionDetails[e].evolutionData.known_move.name[0].toUpperCase() + sorted.evolutionDetails[e].evolutionData.known_move.name.slice(1)}\n`;
                }
            }
            newEmbed.addFields({name: "Evolution Details", value: evolveString});
        }
        interaction.reply({embeds: [newEmbed], ephemeral: true});
        
        
        
        





        
    }
}