const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = { //make this a slash command where when you enter the pcid it iwll get all the moves you can learn at your level
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('setparty')
		.setDescription('Set your party.  this will replace your current party. only the first slot is required')
        
        .addIntegerOption(option => 
            option
                .setName('slot1')
                .setDescription('The name of the pokemon you want to set in slot 1')
                .setAutocomplete(true)
                .setRequired(true))
        .addIntegerOption(option => 
            option
                .setName('slot2')
                .setDescription('The name of the pokemon you want to set in slot 2')
                .setAutocomplete(true))
        .addIntegerOption(option => 
            option
                .setName('slot3')
                .setDescription('The name of the pokemon you want to set in slot 3')
                .setAutocomplete(true))
        .addIntegerOption(option => 
            option
                .setName('slot4')
                .setDescription('The name of the pokemon you want to set in slot 4')
                .setAutocomplete(true))
        .addIntegerOption(option => 
            option
                .setName('slot5')
                .setDescription('The name of the pokemon you want to set in slot 5')
                .setAutocomplete(true))
        .addIntegerOption(option => 
            option
                .setName('slot6')
                .setDescription('The name of the pokemon you want to set in slot 6')
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
        let moveChoices;
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        
        if(!playerData){
            choices = ["You don't exist. Please run /register to create a profile"]
            const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );

        } else {

            if (focusedOption.name === 'slot1') {
            
                const filtered = playerData.maids.filter(choice => choice.id.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.pcID + ": Level " + choice.level + " " + choice.id, value: choice.pcID })),
                );
                
            }
            if (focusedOption.name === 'slot2') {
                
                
                choices = playerData.maids.filter(item => interaction.options.getInteger('slot1') != item.pcID);
                const filtered = choices.filter(choice => choice.id.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.pcID + ": Level " + choice.level + " " + choice.id, value: choice.pcID })),
                );
                
            }
            if (focusedOption.name === 'slot3') {
                
                
                choices = playerData.maids.filter(item => interaction.options.getInteger('slot1') != item.pcID && interaction.options.getInteger('slot2') != item.pcID);
                const filtered = choices.filter(choice => choice.id.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.pcID + ": Level " + choice.level + " " + choice.id, value: choice.pcID })),
                );
                
            }
            if (focusedOption.name === 'slot4') {
                
                
                choices = playerData.maids.filter(item => interaction.options.getInteger('slot1') != item.pcID && interaction.options.getInteger('slot2') != item.pcID && interaction.options.getInteger('slot3') != item.pcID);
                const filtered = choices.filter(choice => choice.id.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.pcID + ": Level " + choice.level + " " + choice.id, value: choice.pcID })),
                );
                
            }
            if (focusedOption.name === 'slot5') {
                
                
                choices = playerData.maids.filter(item => interaction.options.getInteger('slot1') != item.pcID && interaction.options.getInteger('slot2') != item.pcID && interaction.options.getInteger('slot3') != item.pcID && interaction.options.getInteger('slot4') != item.pcID);
                const filtered = choices.filter(choice => choice.id.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.pcID + ": Level " + choice.level + " " + choice.id, value: choice.pcID })),
                );
                
            }
            if (focusedOption.name === 'slot6') {
                
                
                choices = playerData.maids.filter(item => interaction.options.getInteger('slot1') != item.pcID && interaction.options.getInteger('slot2') != item.pcID && interaction.options.getInteger('slot3') != item.pcID && interaction.options.getInteger('slot4') != item.pcID && interaction.options.getInteger('slot5') != item.pcID);
                const filtered = choices.filter(choice => choice.id.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.pcID + ": Level " + choice.level + " " + choice.id, value: choice.pcID })),
                );
                
            }
        }

        
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;

        let newParty = [];
        newParty.push(interaction.options.getInteger('slot1'));
        if(interaction.options.getInteger('slot2') != null){
            if(newParty.findIndex(function(unit) { return unit == interaction.options.getInteger('slot2')}) != -1){
                return interaction.reply(`Your unit, ${playerData.maids.find(function(item) { return item.pcID == interaction.options.getInteger('slot2')}).id} with PCID# ${interaction.options.getInteger('slot2')}, was already added in an earlier slot please run the command again`);
            } else {
                newParty.push(interaction.options.getInteger('slot2'));
            }
        }
        if(interaction.options.getInteger('slot3') != null){
            if(newParty.findIndex(function(unit) { return unit == interaction.options.getInteger('slot3')}) != -1){
                return interaction.reply(`Your unit, ${playerData.maids.find(function(item) { return item.pcID == interaction.options.getInteger('slot3')}).id} with PCID# ${interaction.options.getInteger('slot3')}, was already added in an earlier slot please run the command again`);
            } else {
                newParty.push(interaction.options.getInteger('slot3'));
            }
        }
        if(interaction.options.getInteger('slot4') != null){
            if(newParty.findIndex(function(unit) { return unit == interaction.options.getInteger('slot4')}) != -1){
                return interaction.reply(`Your unit, ${playerData.maids.find(function(item) { return item.pcID == interaction.options.getInteger('slot4')}).id} with PCID# ${interaction.options.getInteger('slot4')}, was already added in an earlier slot please run the command again`);
            } else {
                newParty.push(interaction.options.getInteger('slot4'));
            }
        }
        if(interaction.options.getInteger('slot5') != null){
            if(newParty.findIndex(function(unit) { return unit == interaction.options.getInteger('slot5')}) != -1){
                return interaction.reply(`Your unit, ${playerData.maids.find(function(item) { return item.pcID == interaction.options.getInteger('slot5')}).id} with PCID# ${interaction.options.getInteger('slot5')}, was already added in an earlier slot please run the command again`);
            } else {
                newParty.push(interaction.options.getInteger('slot5'));
            }
        }
        if(interaction.options.getInteger('slot6') != null){
            if(newParty.findIndex(function(unit) { return unit == interaction.options.getInteger('slot6')}) != -1){
                return interaction.reply(`Your unit, ${playerData.maids.find(function(item) { return item.pcID == interaction.options.getInteger('slot6')}).id} with PCID# ${interaction.options.getInteger('slot6')}, was already added in an earlier slot please run the command again`);
            } else {
                newParty.push(interaction.options.getInteger('slot6'));
            }
        }
        
        
        
        
        
        if(newParty.length != 0 && newParty.length <= 6){
            try {
                await playerModel.findOneAndUpdate(
                    {
                        userID: ID
                    },
                    {
                        $set: {
                            currentParty: newParty
                        }
                        
                    }
                );
        
            } catch(err){
                console.log(err);
            }
            return interaction.reply("You have successfully set your party.  run the command party to see your new party.");
        } else {
            return interaction.reply("An error has occured while trying to set your party please run the command again.  If it keeps happening please contact an admin");
        }
        
        
        





        
    }
}




