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
                .setDescription('The name of the move you want to look at')
                .setAutocomplete(true)
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;

        if (focusedOption.name === 'nature') {
            
            let natures = [];
            for(let i = 0; i < natureTable.length; i++){
                if(!natures.includes(natureTable[i].name)){
                    natures.push(natureTable[i].name);
                }
            }
            
            choices = natures;
            
            
        }

        const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
        await interaction.respond(
            filtered.slice(0, 25).map(choice => ({ name: choice, value: choice })),
        );
    },
    async execute(client, message, cmd, args, Discord){
        let info = interaction.options.getString('move');
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**Move Info**")
        .setDescription(`__**${info.move}**__\nType: ${info.type}\nDamage Type: ${info.damageClass}\nPower: ${info.power}\nAccuracy: ${info.accuracy}`)
        
        
        message.channel.send({ embeds: [newEmbed] });
        
        
        





        
    }
}