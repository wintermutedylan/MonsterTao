
const { Client, MessageEmbed, CommandInteraction } = require('discord.js');
const fs = require("fs");
require('dotenv').config();
//const { CommandInteraction } = require("discord.js");
/**
 * 
 * 
 * @param {Client} client 
 * @param {CommandInteraction} interaction 
 * @returns 
 */
const playerModel = require("../../models/playerSchema");


module.exports = async (Discord, client, interaction) => {
    const command = interaction.client.interactioncommands.get(interaction.commandName);
    let playerData;

        try {
            playerData = await playerModel.findOne({ userID: interaction.user.id });
            if (!playerData){
                let player = await playerModel.create({
                    userID: interaction.user.id,
                    coins: 0,
                    maids: [],
                    currentParty: [],
                    badges: []
                    
                });
                player.save();
            }
        } catch(err){
            console.log(err);
        }
    

    if (interaction.isChatInputCommand()) {
        if(!interaction.client.cooldowns.has(command.data.name)){
            interaction.client.cooldowns.set(command.data.name, new Discord.Collection());
        }
        const now = Date.now();
        const timestamps = interaction.client.cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;
    
        if(timestamps.has(interaction.user.id)){
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
    
            if(now < expirationTime){
                const expiredTimestamp = Math.round(expirationTime / 1000);
                return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true});
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
		

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
		}
	} else if (interaction.isAutocomplete()) {
		

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
            
			    await command.autocomplete(interaction);
            
		} catch (error) {
			console.error(error);
		}
	} 
    

}