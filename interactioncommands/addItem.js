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
		.setName('buyitem')
		.setDescription('Add a move to one of your pokemon')
        
        .addStringOption(option =>
			option.setName('type')
				.setDescription('Type of item you want to buy')
                .setRequired(true)
				.addChoices(
                    { name: 'Heal', value: 'heal'},
                    { name: 'Ball', value: 'ball'}
                    
                    ))
        .addStringOption(option => 
            option
                .setName('item')
                .setDescription('The item you want to buy')
                .setAutocomplete(true)
                .setRequired(true))
        .addIntegerOption(option => 
            option
                .setName('amount')
                .setDescription('The amount of the selected item you want to buy')
                .setAutocomplete(true)
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
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
                
                for(let i = 0; i < items.filter(item => item.type == interaction.options.getString('type')).length; i++){
                    let x = {
                        name: items[i].name,
                        value: items[i].cost
                    }
                    pokemon.push(x);
                }
                
                choices = pokemon;
                const filtered = choices.filter(choice => choice.name.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "Name: " + choice.name + ",Cost: " + choice.value, value: choice.name })),
                );
                
            }
            if(focusedOption.name === 'amount'){
                let limit = Math.floor(playerData.coins/items.find(function(f) { return f.name == interaction.options.getString('item')}).cost)
                if(limit == 0){
                    moveChoices = 0;
                } else {
                    moveChoices = Array.from({length:limit},(k)=>k+1);
                }
                
                const movefiltered = moveChoices.filter(choice => choice.includes(focusedOption.value));
            
                await interaction.respond(
                    movefiltered.slice(0, 25).map(choice => ({ name: choice, value: choice })),
                );
            }
        }

        
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        if( items.findIndex(function(item) { return item.name == interaction.options.getString('item')}) == -1){
            return interaction.reply(`${interaction.options.getString('item')} is not a valid item to buy.`);
        }
        let newAmount;
        let itemStuff = items.find(function(item) { return item.name == interaction.options.getString('item')});
        let itemIndex =  playerData.bag.findIndex(function(item) { return item.name == interaction.options.getString('item')})
        let finalItem;
        if(itemIndex == -1){
            finalItem = {
                name: itemStuff.name,
                amount: interaction.options.getInteger('amount')
            }
            try {
                await playerModel.findOneAndUpdate(
                    {
                        userID: ID
                    },
                    {
                        $push: {
                            bag: finalItem
                        }
                        
                    }
                );
        
            } catch(err){
                console.log(err);
            }
        }
        try {
            await playerModel.findOneAndUpdate(
                {
                    userID: ID
                },
                {
                    $push: {
                        ["maids." + pokemonIndex + ".moves"]: modStr
                    }
                    
                }
            );
    
        } catch(err){
            console.log(err);
        }
        interaction.reply(`Your ${pokemonInfo.id} with PC ID of ${pokemonInfo.pcID} learned ${interaction.options.getString('move')}`);
        





        
    }
}



