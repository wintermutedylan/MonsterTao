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
		.setName('usetm')
		.setDescription('Add a move to one of your pokemon')
        
        
        .addStringOption(option => 
            option
                .setName('tm')
                .setDescription('The tm to use')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option => 
            option
                .setName('pokemon')
                .setDescription('The name of the pokemon you want to use the tm on')
                .setAutocomplete(true)
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
        let moveChoices = [];
        let pokemonChoices = [];
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        
        if(!playerData){
            choices = ["You don't exist. Please run /register to create a profile"]
            const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );

        } else {

            if(focusedOption.name === 'tm'){
                
                
                for(let j = 0; j < playerData.bag.length; j++){
                    if(items.findIndex(function(item) { return item.name == playerData.bag[j].name && item.type == "machine"}) != -1){
                        moveChoices.push(playerData.bag[j].name);
                    }
                }
                const movefiltered = moveChoices.filter(choice => choice.includes(focusedOption.value));
            
                await interaction.respond(
                    movefiltered.slice(0, 25).map(choice => ({ name: choice, value: choice })),
                );
            }
            if (focusedOption.name === 'pokemon') {
                let move = items.find(function(item) { return item.name == interaction.options.getString('tm')}).moveName;
                
                let pokemon = [];
                for(let c = 0; c < moveinfo.length; c++){
                    if(moveinfo[c].otherMoves.findIndex(function(m) { return m.name == move}) != -1){
                        pokemon.push(moveinfo[c].id);
                    }
                }

                for(let i = 0; i < playerData.maids.length; i++){
                    if(pokemon.includes(playerData.maids[i].id.toLowerCase())){
                        let x = {
                            name: playerData.maids[i].id,
                            value: playerData.maids[i].pcID.toString()
                        }
                        pokemonChoices.push(x);
                    }
                    
                }
                
                choices = pokemonChoices;
                const filtered = choices.filter(choice => choice.name.includes(focusedOption.value) || choice.value.includes(focusedOption.value));
            
                await interaction.respond(
                    filtered.slice(0, 25).map(choice => ({ name: "PCID# " + choice.value + ": " + choice.name, value: choice.value })),
                );
                
            }
            
        }

        
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        let moveDetails = items.find(function(item) { return item.name == interaction.options.getString('tm')});
        if( moves.findIndex(function(item) { return item.move.toLowerCase() == moveDetails.moveName.toLowerCase()}) == -1){
            return interaction.reply({content: `${moveDetails.moveName} is not a valid move to learn`, ephemeral: true});
        }
        
        let newBagArray = playerData.bag;
        let pokemonInfo = playerData.maids.find(function(item) { return item.pcID == Number(interaction.options.getString('pokemon'))})
        let pokemonIndex =  playerData.maids.findIndex(function(item) { return item.pcID == Number(interaction.options.getString('pokemon'))})
        
        let ball = playerData.bag.find(function(item) { return item.name.toLowerCase() == moveDetails.name.toLowerCase()});
        
        let ballIndex = playerData.bag.findIndex(function(h) { return h.name == ball.name});
        
        

        let moveUpper = moveDetails.moveName[0].toUpperCase() + moveDetails.moveName.slice(1);
        if(pokemonInfo.moves.includes(moveUpper)){
            return interaction.reply({content: `Your ${pokemonInfo.id} already knows ${moveUpper}`, ephemeral: true});
        }
        if(pokemonInfo.moves.length >= 4){
            interaction.reply({content: `Your ${pokemonInfo.id} with PC ID of ${pokemonInfo.pcID} already knows 4 moves which move would you like to forget: ${pokemonInfo.moves.join(", ")}`, ephemeral: true});
            const filter = (m) => {
                return  m.author.id === interaction.user.id && (m.content.toLowerCase() === pokemonInfo.moves[0].toLowerCase() || m.content.toLowerCase() === pokemonInfo.moves[1].toLowerCase() || m.content.toLowerCase() === pokemonInfo.moves[2].toLowerCase() || m.content.toLowerCase() === pokemonInfo.moves[3].toLowerCase());
            }
            const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000})
            var s;
            
            
    
            collector.on('collect', message => {
                s = message;
                
            });
    
            collector.on('end', collected => {
            
                if (collected.size === 0) {
                    return interaction.channel.send(`${userMention(s.author.id)} You did not select a move in time.`);
                }
                let moveArray = pokemonInfo.moves;
                let forgetMoveIndex = moveArray.findIndex(function(item) { return item.toLowerCase() == s.content.toLowerCase()});
                let str = moveDetails.moveName;
                let modStr = str[0].toUpperCase() + str.slice(1);
                moveArray[forgetMoveIndex] = modStr;
                replaceMove(s.author.id, pokemonIndex, moveArray);
                if(ball.amount - 1 == 0){
                    if(ballIndex > -1){
                        newBagArray.splice(ballIndex, 1); 
                        removeTm(s.author.id, newBagArray)
                    }   
                } else {
                    removeTmAmount(s.author.id, ballIndex);
                }
                
                interaction.channel.send(`${userMention(s.author.id)} Your ${pokemonInfo.id} with PC ID of ${pokemonInfo.pcID} forgot ${s.content.toLowerCase()[0].toUpperCase() + s.content.toLowerCase().slice(1)} and learned ${moveDetails.moveName[0].toUpperCase() + moveDetails.moveName.slice(1)}`);
                    
            });
        } else {
            let str = moveDetails.moveName;
            let modStr = str[0].toUpperCase() + str.slice(1);
            if(ball.amount - 1 == 0){
                if(ballIndex > -1){
                    newBagArray.splice(ballIndex, 1); 
                    removeTm(interaction.user.id, newBagArray)
                }   
            } else {
                removeTmAmount(interaction.user.id, ballIndex);
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
            interaction.reply({content: `Your ${pokemonInfo.id} with PC ID of ${pokemonInfo.pcID} learned ${moveDetails.moveName[0].toUpperCase() + moveDetails.moveName.slice(1)}`, ephemeral: true});
        }
        
        





        
    }
}
async function replaceMove(ID, pokemonIndex, moveArray){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    ["maids." + pokemonIndex + ".moves"]: moveArray
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}

async function removeTmAmount(ID, location){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $inc: {
                    ["bag." + location + ".amount"]: -1
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}
async function removeTm(ID, bagArray){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    bag: bagArray
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}


