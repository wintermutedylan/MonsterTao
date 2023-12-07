const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
var items = require("../units/items.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = { //make this a slash command where when you enter the pcid it iwll get all the moves you can learn at your level
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('iteminfo')
		.setDescription('Get details about a specific item')
        
        .addStringOption(option =>
			option.setName('type')
				.setDescription('Type of item you want to view')
                .setRequired(true)
				.addChoices(
                    { name: 'Heal', value: 'healing'},
                    { name: 'Ball', value: 'ball'},
                    { name: 'Evolution', value: 'evolution'},
                    { name: "TM", value: "machine"}
                    
                    ))
        .addStringOption(option => 
            option
                .setName('item')
                .setDescription('The item you want to view')
                .setAutocomplete(true)
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices = [];
        let moveChoices = [];
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        
        if(!playerData){
            choices = ["You don't exist. Please run /register to create a profile"]
            const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );

        } else {

        
            if (focusedOption.name === 'item') {
                
                let pokemon = [];
                let itemFilter = items.filter(item => item.type == interaction.options.getString('type'))
                if(interaction.options.getString('type') == "machine"){
                    for(let i = 0; i < itemFilter.length; i++){
                        let x = {
                            name: itemFilter[i].name,
                            move: itemFilter[i].moveName,
                            value: itemFilter[i].cost
                        }
                        pokemon.push(x);
                    }
                    choices = pokemon;
                    const filtered = choices.filter(choice => choice.name.includes(focusedOption.value));
                
                    await interaction.respond(
                        filtered.slice(0, 25).map(choice => ({ name: choice.name + ": " + choice.move, value: choice.name })),
                    );
                } else {
                    for(let i = 0; i < itemFilter.length; i++){
                        let x = {
                            name: itemFilter[i].name,
                            value: itemFilter[i].cost
                        }
                        pokemon.push(x);
                    }
                    choices = pokemon;
                    const filtered = choices.filter(choice => choice.name.includes(focusedOption.value));
                
                    await interaction.respond(
                        filtered.slice(0, 25).map(choice => ({ name: "Name: " + choice.name, value: choice.name })),
                    );
                }
                
                
                
                
            }
            
        }

        
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        if( items.findIndex(function(item) { return item.name == interaction.options.getString('item')}) == -1){
            return interaction.reply({content: `${interaction.options.getString('item')} is not a valid item to view.`, ephemeral: true});
        }
        let itemStuff = items.find(function(item) { return item.name == interaction.options.getString('item')});
    
        let newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**Item Info**")
        .setDescription(`__**${itemStuff.name[0].toUpperCase() + itemStuff.name.slice(1)}**__`)
        if(itemStuff.catchModifier != null){
            newEmbed.addFields({name: "Catch Modifier", value: `Value: ${itemStuff.catchModifier}`});
        } if(itemStuff.healAmount != null){
            newEmbed.addFields({name: "Heal Amount", value: `Value with 999 is full heal\nValue: ${itemStuff.healAmount}`});
        } if(itemStuff.moveName != null){
            newEmbed.addFields({name: "Move Name", value: `Value: ${itemStuff.moveName[0].toUpperCase() + itemStuff.moveName.slice(1)}`});
        }
        if(itemStuff.name == "antidote"){
            newEmbed.addFields({name: "Effect", value: `Value: Cures Poison`});
        }
        if(itemStuff.name == "burn-heal"){
            newEmbed.addFields({name: "Effect", value: `Value: Cures a Burn`});
        }
        if(itemStuff.name == "ice-heal"){
            newEmbed.addFields({name: "Effect", value: `Value: Cures Freezing`});
        }
        if(itemStuff.name == "awakening"){
            newEmbed.addFields({name: "Effect", value: `Value: Cures Sleep`});
        }
        if(itemStuff.name == "paralyze-heal"){
            newEmbed.addFields({name: "Effect", value: `Value: Cures Paralysis`});
        }
        if(itemStuff.name == "full-heal"){
            newEmbed.addFields({name: "Effect", value: `Value: Cures any status ailment and confusion`});
        }
        newEmbed.addFields({name: "Cost", value: `Value: ${itemStuff.cost}`});


        interaction.reply({embeds: [newEmbed], ephemeral: true});
        





        
    }
}




