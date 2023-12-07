var maids = require("../units/maids.json");
var bosses = require("../units/raidbosses.json");
const playerModel = require("../models/playerSchema");
const { userMention, memberNicknameMention, channelMention, roleMention } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('gyminfo')
		.setDescription('Displays the selected gym leaders pokemon and reward')
    .addStringOption(option =>
			option.setName('gymleader')
				.setDescription('Select the gym leader')
                .setRequired(true)
				.addChoices(
                    { name: 'Oak', value: 'Oak'},
                    { name: 'Misty', value: 'Misty'},
                    { name: 'Surge', value: 'Surge'},
                    { name: 'Erika', value: 'Erika'},
                    { name: 'Koga', value: 'Koga'},
                    { name: 'Sabrina', value: 'Sabrina'},
                    { name: 'Blaine', value: 'Blaine'},
                    { name: 'Giovanni', value: 'Giovanni'}
                    )),
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        let leader = bosses.find(function(item) { return item.id == interaction.options.getString('gymleader')});

        
        
       
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`${leader.id}'s Details`)
        .setDescription(`**Reward:** ${leader.coinReward}\n__**${leader.id}'s Party**__`)
        
        for (let j = 0; j < leader.units.length; j++){
                
                newEmbed.addFields(
                    { name: `${leader.units[j].id}`, value: `Level: ${leader.units[j].level}\nHealth: ${leader.units[j].health}\nType: ${leader.units[j].types.join(", ")}\nMoves: ${leader.units[j].moves.join(", ")}`}
                )
            
        }
        

        

        
        
        
        interaction.reply({ embeds: [newEmbed], ephemeral: true});
        
        
        
    }
    
}