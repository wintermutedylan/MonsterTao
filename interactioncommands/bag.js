var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");
const { userMention, memberNicknameMention, channelMention, roleMention } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('bag')
		.setDescription('This will show your current party in an embed'),
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply("You don't exist. Please try again.");
        
        
       
        var totalCoins = playerData.coins;
       
        
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`${interaction.user.username}'s Bag`)
        .setDescription(`**Total coins:** ${new Intl.NumberFormat().format(totalCoins)}\nTHIS IS A PLACEHODER \nTHIS WILL BE WHERE YOU SEE YOUR BALLS, ITEMS, COINS, TMS`)
        

        

        
        
        
        interaction.reply({ embeds: [newEmbed] });
        
        
        
    }
    
}