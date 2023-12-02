var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");
const { userMention, memberNicknameMention, channelMention, roleMention } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all the commands and what they do')
    .addSubcommand(subcommand =>
      subcommand
        .setName('pokemon')
        .setDescription('Help for pokemon commands'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('move')
        .setDescription('Help for move commands'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('item')
        .setDescription('Help for item commands'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('encounter')
        .setDescription('Help for encounter commands')),
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        
        
       
        if(interaction.options.getSubcommand() === 'pokemon'){
          const newEmbed = new EmbedBuilder()
          .setColor('#E76AA3')
          .setTitle(`Pokemon Help Menu`)
          .setDescription(`List of commands\n\n__**/pokemoninfo**__ Shows you the information about one of your pokemon. Enter the PC ID or Case-sensitive name of the pokemon you want to view\n\n__**/party**__ Shows your current party.\n\n__**/setparty**__ Selectup to 6 pokemon to set your party to. The party will be in the order you select the pokemon in.\n\n__**/pc**__ Shows your pc\n\n__**/evolve**__ Evolves a pokemon. Select type of evolution from the given values, then if you have a eligible pokemon it will show up in the next option\n\n__**/basepokemoninfo**__ Shows you the base info about a pokemon.  Type out the case-sensitive name of a pokemon you would like to view`)
          interaction.reply({ embeds: [newEmbed] });
        } else if(interaction.options.getSubcommand() === 'move'){
          const newEmbed = new EmbedBuilder()
          .setColor('#E76AA3')
          .setTitle(`Move Help Menu`)
          .setDescription(`List of commands\n\n__**/moveinfo**__ Type in the move name to see that moves details\n\n__**/learnmove**__ Add a move to one of your pokemon. Enter the PC ID or Case-sensitive name of the pokemon you want to teach a move to. Next select a move from the list of eligible moves shown\n\n__**/replacemove**__ Replace a move your pokemon knows with a different move. Enter the PC ID or Case-sensitive name of the pokemon you want to teach a move to. Next select a move from the list of moves to remove. Then select a move from the list to teach\n\n__**/usetm**__ Teach a pokemon a move using a TM. Select a TM from the TMs you own. Then select a pokemon from the list that can learn the selected TM`)
          interaction.reply({ embeds: [newEmbed] });
        } else if(interaction.options.getSubcommand() === 'encounter'){
          const newEmbed = new EmbedBuilder()
          .setColor('#E76AA3')
          .setTitle(`Encounter Help Menu`)
          .setDescription(`List of commands\n\n__**/encounter**__ Select the region then the route to find a wild pokemon in. It cost 10 time the wild pokemons level to do an encounter. the reward or winning or capturing is 35 times the wild pokemons level\n\n__**/encounterinfo**__ View what pokemon are in the selected route. Select the region from the list then type in the name of the area you want to look up\n\n__**/gymbattle**__ Battle a gym by selecting the leader from the provided list.  Doesn't cost coins and you get reward if you win even if you already have the badge\n\n__**/gyminfo**__ Displays the pokemon the selected gym leader uses and their reward`)
          interaction.reply({ embeds: [newEmbed] });
        } else if(interaction.options.getSubcommand() === 'item'){
          const newEmbed = new EmbedBuilder()
          .setColor('#E76AA3')
          .setTitle(`Item Help Menu`)
          .setDescription(`List of commands\n__**/buyitem**__ Select the type of item you want to buy.  then type the item you want, then the amount.`)
          interaction.reply({ embeds: [newEmbed] });
        }
        
        

        

        
        
        
        
        
        
        
    }
    
}