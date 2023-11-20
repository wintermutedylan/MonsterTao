
const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('replacemove')
		.setDescription('Add a move to one of your pokemon')
        
        .addStringOption(option => 
            option
                .setName('pokemon')
                .setDescription('The name of the pokemon you want to add a move to')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option => 
            option
                .setName('forgetmove')
                .setDescription('The move you want to forget that you pokemon knows')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option => 
            option
                .setName('learnmove')
                .setDescription('The name of the move you want to learn based on pokemon level')
                .setAutocomplete(true)
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
        let moveChoices = [];
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
        if(focusedOption.name === 'forgetmove'){
            let pokemonStuff = playerData.maids.find(function(expItem) { return expItem.pcID == Number(interaction.options.getString('pokemon'))});
            const movefiltered = pokemonStuff.moves.filter(choice => choice.includes(focusedOption.value));
        
            await interaction.respond(
                movefiltered.slice(0, 25).map(choice => ({ name: choice, value: choice })),
            );
        }
        if(focusedOption.name === 'learnmove'){
            let pokemonStuff = playerData.maids.find(function(expItem) { return expItem.pcID == Number(interaction.options.getString('pokemon'))});
            let movesCanLearn = moveinfo.find(function(item) { return item.id == pokemonStuff.id.toLowerCase()});
            let maybeMoves = movesCanLearn.leveUpMoves.filter(m => pokemonStuff.level >= m.level);

            for(let h = 0; h < pokemonStuff.moves.length; h++){
                for(let g = 0; g < maybeMoves.length; g++){
                    if(pokemonStuff.moves[h].toLowerCase() != maybeMoves[g].name.toLowerCase()){
                        moveChoices.push(maybeMoves[g]);
                    }
                }
            }
            const movefiltered = moveChoices.filter(choice => choice.name.includes(focusedOption.value));
        
            await interaction.respond(
                movefiltered.slice(0, 25).map(choice => ({ name: choice.name, value: choice.name })),
            );
        }

        
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        
        interaction.reply(`Your pokemon ${interaction.options.getString('pokemon')} forgot ${interaction.options.getString('forgetmove')} and learned ${interaction.options.getString('learnmove')}`);
        
        
        
    }
}

