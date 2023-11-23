const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = { //make this a slash command where when you enter the pcid it iwll get all the moves you can learn at your level
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('learnmove')
		.setDescription('Add a move to one of your pokemon')
        
        .addStringOption(option => 
            option
                .setName('pokemon')
                .setDescription('The name of the pokemon you want to add a move to')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option => 
            option
                .setName('move')
                .setDescription('The moves it can learn at its current level')
                .setAutocomplete(true)
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
        let moveChoices;
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        
        

        
        if (focusedOption.name === 'pokemon') {
            
            let pokemon = [];
            for(let i = 0; i < playerData.maids.length; i++){
                let x = {
                    name: playerData.maids[i].id,
                    value: playerData.maids[i].pcID.toString()
                }
                pokemon.push(x);
            }
            
            choices = pokemon;
            const filtered = choices.filter(choice => choice.name.includes(focusedOption.value));
        
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.value + ": " + choice.name, value: choice.value })),
            );
            
        }
        if(focusedOption.name === 'move'){
            let pokemonStuff = playerData.maids.find(function(expItem) { return expItem.pcID == Number(interaction.options.getString('pokemon'))});
            let movesCanLearn = moveinfo.find(function(item) { return item.id == pokemonStuff.id.toLowerCase()});
            moveChoices = movesCanLearn.leveUpMoves.filter(m => pokemonStuff.level >= m.level);
            const movefiltered = moveChoices.filter(choice => choice.name.includes(focusedOption.value));
        
            await interaction.respond(
                movefiltered.slice(0, 25).map(choice => ({ name: choice.name, value: choice.name })),
            );
        }

        
    },
    async execute(interaction){
        
        if( moves.findIndex(function(item) { return item.move.toLowerCase() == interaction.options.getString('move').toLowerCase()}) == -1){
            return interaction.reply(`${interaction.options.getString('move')} is not a valid move to learn`);
        }
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = interaction.user.id;
        
        let pokemonInfo = playerData.maids.find(function(item) { return item.pcID == Number(interaction.options.getString('pokemon'))})
        let pokemonIndex =  playerData.maids.findIndex(function(item) { return item.pcID == Number(interaction.options.getString('pokemon'))})
        if(pokemonInfo.moves.length >= 4) return interaction.reply(`${pokemonInfo.id} already knows 4 moves, please use the command replace move`);
        let str = interaction.options.getString('move');
        let modStr = str[0].toUpperCase() + str.slice(1);

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




