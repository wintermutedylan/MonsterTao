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
		.setDescription('Buy an item')
        
        .addStringOption(option =>
			option.setName('type')
				.setDescription('Type of item you want to buy')
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
                        filtered.slice(0, 25).map(choice => ({ name: choice.name + ": " + choice.move + ", Cost: " + choice.value, value: choice.name })),
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
                        filtered.slice(0, 25).map(choice => ({ name: "Name: " + choice.name + ", Cost: " + choice.value, value: choice.name })),
                    );
                }
                
                
                
                
            }
            if(focusedOption.name === 'amount'){
                let limit = Math.floor(playerData.coins/items.find(function(f) { return f.name == interaction.options.getString('item')}).cost)
                 
                    var list = [];
                    for (var i = 0; i <= limit; i++) {
                        list.push(i.toString());
                    }
                
                
                
                const movefiltered = list.filter(choice => choice.includes(focusedOption.value));
            
                await interaction.respond(
                    movefiltered.slice(0, 25).map(choice => ({ name: choice, value: Number(choice) })),
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
            return interaction.reply({content:`${interaction.options.getString('item')} is not a valid item to buy.`,ephemeral: true});
        }
        let itemStuff = items.find(function(item) { return item.name == interaction.options.getString('item')});
        let limit = Math.floor(playerData.coins/(itemStuff.cost));
        if(limit == 0){
            return interaction.reply({content:`You don't have enough coins to buy ${interaction.options.getInteger('amount')} ${interaction.options.getString('item')}`, ephemeral: true});
        }

        let newAmount = playerData.coins - (interaction.options.getInteger('amount')*itemStuff.cost);
        if(newAmount < 0){
            return interaction.reply("An error has occured and you have gone negative in coins.  please try again. no coins have been deducted");
        }
        
        let itemIndex =  playerData.bag.findIndex(function(item) { return item.name == interaction.options.getString('item')})
        
        if(itemIndex == -1){
            let finalItem = {
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
                        
                    },
                    
                );
        
            } catch(err){
                console.log(err);
            }
            try {
                await playerModel.findOneAndUpdate(
                    {
                        userID: ID
                    },
                    {
                        $inc: {
                            coins: -(interaction.options.getInteger('amount')*itemStuff.cost)
                        }
                        
                    },
                    
                );
        
            } catch(err){
                console.log(err);
            }
        } else {
            try {
                await playerModel.findOneAndUpdate(
                    {
                        userID: ID
                    },
                    {
                        $inc: {
                            ["bag." + itemIndex + ".amount"]: interaction.options.getInteger('amount'),
                            coins: -(interaction.options.getInteger('amount')*itemStuff.cost)
                        }
                        
                    }
                );
        
            } catch(err){
                console.log(err);
            }
        }
        
        interaction.reply({content: `You have bought ${interaction.options.getInteger('amount')} ${interaction.options.getString('item')}.  ${(interaction.options.getInteger('amount')*itemStuff.cost)} coins has been deducted.`, ephemeral: true});
        





        
    }
}




