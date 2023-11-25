var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");
const { userMention, memberNicknameMention, channelMention, roleMention } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all the commands and what they do'),
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        
        
       
        var totalCoins = playerData.coins;
        let bagString = "";
        for(let i = 0; i < playerData.bag.length; i++){
          bagString += `Name: ${playerData.bag[i].name}, Amount: ${playerData.bag[i].amount}\n`
        }
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`${interaction.user.username}'s Bag`)
        .setDescription(`**Total coins:** ${new Intl.NumberFormat().format(totalCoins)}\n${bagString}`)
        

        

        
        
        
        interaction.reply({ embeds: [newEmbed] });
        
        
        
    }
    
}