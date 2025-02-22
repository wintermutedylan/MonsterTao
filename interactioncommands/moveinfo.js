const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('moveinfo')
		.setDescription('Find information about a move')
        
        .addStringOption(option => 
            option
                .setName('move')
                .setDescription('The name of the move you want to look up')
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
    
            
            const filtered = moves.filter(choice => choice.move.includes(focusedOption.value));
            
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: choice.move, value: choice.move })),
            );
        }
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        let info = moves.find(function(item) { return item.move.toLowerCase() == interaction.options.getString('move').toLowerCase()});
        if(!info) return interaction.reply({content: `An error has occurred trying to find the move: ${interaction.options.getString('move')}, please try again.`, ephemeral: true});
        let learnedByString = [];
        for(let i = 0; i < info.learnedBy.length; i++){
            if(maids.findIndex(function(e) { return e.id.toLowerCase() == info.learnedBy[i].toLowerCase()}) != -1){
                learnedByString.push(info.learnedBy[i]);
            }
        }
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**Move Info**")
        .setDescription(`__**${info.move}**__\nType: ${info.type}\nDamage Type: ${info.damageClass}\nPower: ${info.power}\nAccuracy: ${info.accuracy}`)
        
        newEmbed.addFields(
            {name: "Pokemon that can learn this move", value: learnedByString.join(", ")}
            )
        interaction.reply({embeds: [newEmbed]});
        
        
        
        





        
    }
}