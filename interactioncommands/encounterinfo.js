const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var routeEncounters = require("../units/routes.json");
var moveinfo = require("../units/moveinfo.json");
var moveList = require("../units/moves.json");
var typeList = require("../units/typechart.json");
var natureTable = require("../units/natures.json");
var expTable = require("../units/exptable.json");
var stageCalcs = require("../units/stages.json");
var items = require("../units/items.json");
var badgePenalty = require("../units/badgepenalty.json");
const lucky = require('lucky-item').default;
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');


module.exports = {
    cooldown: 15,
	data: new SlashCommandBuilder()
		.setName('encounterinfo')
		.setDescription('Displays info about a route')
		.addStringOption(option =>
			option.setName('region')
				.setDescription('Region to encounter a pokemon')
                .setRequired(true)
				.addChoices(
                    { name: 'Kanto', value: 'kanto'},
                    { name: 'Johto', value: 'johto'},
                    { name: 'Hoenn', value: 'hoenn'},
                    { name: 'Sinnoh', value: 'sinnoh'}
                    ))
        .addStringOption(option =>
            option.setName('route')
                .setDescription('Route to get details for')
                .setRequired(true)
				.setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
		let choices;
		if (focusedOption.name === 'route') {
            
            let routes = [];
            for(let i = 0; i < routeEncounters.length; i++){
                if(routeEncounters[i].region == interaction.options.getString('region').toLowerCase() && !routes.includes(routeEncounters[i].area)){
                    routes.push(routeEncounters[i].area);
                }
            }
            
            choices = routes;
            
			
		}

		const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
		await interaction.respond(
			filtered.slice(0, 25).map(choice => ({ name: choice, value: choice })),
		);
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        let routeString = "";
        let route = interaction.options.getString('route');
        let encounterArr = [];
        for(let i = 0; i < routeEncounters.length; i++){
            if(routeEncounters[i].area == route){
                for(let j = 0; j < routeEncounters[i].encounter[0].encounter_details.length; j++){
                    let info = {
                        name: routeEncounters[i].name,
                        weight: routeEncounters[i].encounter[0].encounter_details[j].chance,
                        level: routeEncounters[i].encounter[0].encounter_details[j].max_level,
                        
                    }
                    encounterArr.push(info);
                }
            }
        }
        for(let v = 0; v < encounterArr.length; v++){
            routeString += `**${encounterArr[v].name[0].toUpperCase() + encounterArr[v].name.slice(1)}**, Level: ${encounterArr[v].level}\n`;
        }
        

        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`${route} Encounters`)
        .setDescription(routeString)
        
        
        

        

        
        
        
        interaction.reply({ embeds: [newEmbed], ephemeral: true });
    }
}