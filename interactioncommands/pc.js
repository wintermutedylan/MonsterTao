const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var natureTable = require("../units/natures.json");
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('pc')
		.setDescription('Display all your pokemon up to 25 pages')
                        .addStringOption(option =>
                            option
                                .setName('operator')
                                .setDescription('Applies to level you select.  Default is greater than or equal to level 1')
                                .addChoices(
                                    {name: 'Greater than', value: 'greater'},
                                    {name: 'Greater than or Equal to', value: 'greaterEqual'},
                                    {name: 'Less than', value: 'less'},
                                    {name: 'Less than or Equal to', value: 'lessEqual'},
                                    {name: 'Equal to', value: 'equal'},
                                    {name: 'Not Equal', value: 'not'}
                                ))
                        .addIntegerOption(option =>
                            option
                                .setName('level')
                                .setDescription('Level you want to filter with')
                                .setMinValue(1)
                                .setMaxValue(100))
                        .addStringOption(option => 
                            option
                                .setName('type')
                                .setDescription('The type of the pokemon')
                                .addChoices(
                                    {name: 'Normal', value: 'Normal'},
                                    {name: 'Fighting', value: 'Fighting'},
                                    {name: 'Flying', value: 'Flying'},
                                    {name: 'Poison', value: 'Poison'},
                                    {name: 'Ground', value: 'Ground'},
                                    {name: 'Rock', value: 'Rock'},
                                    {name: 'Bug', value: 'Bug'},
                                    {name: 'Ghost', value: 'Ghost'},
                                    {name: 'Steel', value: 'Steel'},
                                    {name: 'Fire', value: 'Fire'},
                                    {name: 'Water', value: 'Water'},
                                    {name: 'Grass', value: 'Grass'},
                                    {name: 'Electric', value: 'Electric'},
                                    {name: 'Psychic', value: 'Psychic'},
                                    {name: 'Ice', value: 'Ice'},
                                    {name: 'Dragon', value: 'Dragon'},
                                    {name: 'Dark', value: 'Dark'}
                                ))
                        .addStringOption(option => 
                            option
                                .setName('nature')
                                .setDescription('The nature of the pokemon')
                                .setAutocomplete(true))
                        .addStringOption(option => 
                            option
                                .setName('name')
                                .setDescription('The name of the pokemon')
                                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;

        if (focusedOption.name === 'nature') {
            
            let natures = [];
            for(let i = 0; i < natureTable.length; i++){
                if(!natures.includes(natureTable[i].name)){
                    natures.push(natureTable[i].name);
                }
            }
            
            choices = natures;
            
            
        }
        if (focusedOption.name === 'name') {
            
            let pokemon = [];
            for(let i = 0; i < maids.length; i++){
                if(!pokemon.includes(maids[i].id)){
                    pokemon.push(maids[i].id);
                }
            }
            
            choices = pokemon;
            
            
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
        
        let op = "greaterEqual";
        let level = 1;
        let nature = null;
        let type = null;
        let name = null;
        let sortedOG = [];
        let sorted = [];
        
        
        if(interaction.options.getString('operator')){
            op = interaction.options.getString('operator')
        }
        if(interaction.options.getInteger('level')){
            level = interaction.options.getInteger('level');
        }
        nature = interaction.options.getString('nature');
        type = interaction.options.getString('type');
        name = interaction.options.getString('name');
            
        
        switch(op){
            case "greater":
                sortedOG = playerData.maids.filter((item) => item.level > level);
                break;
            case "greaterEqual":
                sortedOG = playerData.maids.filter((item) => item.level >= level);
                break;
            case "less":
                sortedOG = playerData.maids.filter((item) => item.level < level);
                break;
            case "lessEqual":
                sortedOG = playerData.maids.filter((item) => item.level <= level);
                break;
            case "equal":
                sortedOG = playerData.maids.filter((item) => item.level == level);
                break;
            case "not":
                sortedOG = playerData.maids.filter((item) => item.level != level);
                break;

        }
        if(nature){
            sortedOG = sortedOG.filter((item) => item.nature == nature);
        }
        if(type){
            sortedOG = sortedOG.filter((item) => item.types.includes(type));
        }
        if(name){
            sortedOG = sortedOG.filter((item) => item.id == name);
        }
        
        var pageNumber = 1;
        
        var sortedTotal = Math.floor(sortedOG.length/10) + 1;
        
        pageNumber = Number(pageNumber) - 1; 
        if (sortedOG.length > 10){
            sorted = sortedOG.slice(pageNumber * 10, pageNumber * 10 + 10);
        } else {
            sorted = sortedOG;
        }
        
        
        
        
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**PC**")
        .setDescription(`__**Your PC**__`)
        for (let j = 0; j < sorted.length; j++){
            
            
            newEmbed.addFields({name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}, Level: ${sorted[j].level}`, value:`IVs: Hp: ${sorted[j].ivMap.healthIV}, Atk: ${sorted[j].ivMap.attackIV}, SpAtk: ${sorted[j].ivMap.specialAttackIV}, Def: ${sorted[j].ivMap.defenseIV}, SpDef: ${sorted[j].ivMap.specialDefenseIV}\nMoves: ${sorted[j].moves.join(", ")}\n`});
        }
        pageNumber++;
        newEmbed.setFooter({ text:`Page # ${pageNumber}/${sortedTotal}`});
        
        // const previous = new ButtonBuilder()
		// 	.setCustomId('previous')
		// 	.setLabel('Previous Page')
		// 	.setStyle(ButtonStyle.Primary);

		// const next = new ButtonBuilder()
		// 	.setCustomId('next')
		// 	.setLabel('Next Page')
		// 	.setStyle(ButtonStyle.Primary);

		// const row = new ActionRowBuilder()
		// 	.addComponents(previous, next);
        // const rowstart = new ActionRowBuilder()
        //     .addComponents(next);
        // const rowend = new ActionRowBuilder()
        //     .addComponents(previous);
        const select = new StringSelectMenuBuilder()
			.setCustomId('pages')
			.setPlaceholder('Select a page');

        for(let z = 1; z <= sortedTotal; z++){
            if(z >= 25){
                break;
            }
            else if(z == pageNumber){
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Page ${z}`)
                        .setValue(`${z}`)
                        .setDefault(true))
            } else {
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Page ${z}`)
                        .setValue(`${z}`))
            }
            
        }
        const rowmenu = new ActionRowBuilder()
            .addComponents(select);
        if(sortedOG.length == 0){
            interaction.reply({content: "The filters you set didn't return any pokemon. try again later", ephemeral: true});
        }
        else if(sortedOG.length == 1){
            interaction.reply({ embeds: [newEmbed]});
        } else {
            const response = await interaction.reply({ embeds: [newEmbed], components: [rowmenu], ephemeral: true});
            
            const collectorFilter = i => {
                i.deferUpdate(); 
                return i.user.id === interaction.user.id;
            };
            const collector = response.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 120000 });


            collector.on('collect', async i => {
                    pageNumber = Number(i.values[0]);
                    var sortedTotal = Math.floor(sortedOG.length/10) + 1;
                    
                    pageNumber = Number(pageNumber) - 1; 
                    if (sortedOG.length > 5){
                        sorted = sortedOG.slice(pageNumber * 10, pageNumber * 10 + 10);
                    } else {
                        sorted = sortedOG;
                    }
                    
                    
                    
                    
                    
                    const newEmbedNext = new EmbedBuilder()
                    .setColor('#E76AA3')
                    .setTitle("**PC**")
                    .setDescription(`__**Your PC**__`)
                    for (let j = 0; j < sorted.length; j++){
                        
                        
                        newEmbedNext.addFields({name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}, Level: ${sorted[j].level}`, value:`IVs: Hp: ${sorted[j].ivMap.healthIV}, Atk: ${sorted[j].ivMap.attackIV}, SpAtk: ${sorted[j].ivMap.specialAttackIV}, Def: ${sorted[j].ivMap.defenseIV}, SpDef: ${sorted[j].ivMap.specialDefenseIV}\nMoves: ${sorted[j].moves.join(", ")}\n`});

                    }
                    pageNumber++;
                    newEmbedNext.setFooter({ text:`Page # ${pageNumber}/${sortedTotal}`});
                    const select2 = new StringSelectMenuBuilder()
                    .setCustomId('pages')
                    .setPlaceholder('Select a page');

                    for(let z = 1; z <= sortedTotal; z++){
                        if(z >= 25){
                            break;
                        }
                        else if(z == pageNumber){
                            select2.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(`Page ${z}`)
                                    .setValue(`${z}`)
                                    .setDefault(true))
                        } else {
                            select2.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(`Page ${z}`)
                                    .setValue(`${z}`))
                        }
                        
                    }
                    
                    const rowmenu2 = new ActionRowBuilder()
                        .addComponents(select2);
                    
                    //if(pageNumber >= sortedTotal){
                    //    await interaction.editReply({embeds: [newEmbedNext], components: [rowend]});
                    //} else {
                        await interaction.editReply({embeds: [newEmbedNext], components: [rowmenu2], ephemeral: true}); //everything commented out is for buttons
                    //}
                /*
                if(i.customId == 'next'){
                    pageNumber++;
                    var sortedTotal = Math.floor(sortedOG.length/5) + 1;
            
                    pageNumber = Number(pageNumber) - 1; 
                    if (sortedOG.length > 5){
                        sorted = sortedOG.slice(pageNumber * 5, pageNumber * 5 + 5);
                    } else {
                        sorted = sortedOG;
                    }
                    
                    
                    
                    
                    const newEmbedNext = new EmbedBuilder()
                    .setColor('#E76AA3')
                    .setTitle("**PC**")
                    .setDescription(`__**Your PC**__`)
                    for (let j = 0; j < sorted.length; j++){
                        
                        
                        newEmbedNext.addFields({name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value:`Level: ${sorted[j].level}\nHealth: ${sorted[j].health}\nAttack: ${sorted[j].attack}, Special Attack: ${sorted[j].specialAttack}\nDefense: ${sorted[j].defense}, Special Defense: ${sorted[j].specialDefense}\nMoves: ${sorted[j].moves.join(", ")}\n`});
                        
                    }
                    pageNumber++;
                    newEmbedNext.setFooter({ text:`Page # ${pageNumber}/${sortedTotal}`});
                    
                    if(pageNumber >= sortedTotal){
                        await interaction.editReply({embeds: [newEmbedNext], components: [rowend]});
                    } else {
                        await interaction.editReply({embeds: [newEmbedNext], components: [row]});
                    }
                    
                } else if(i.customId == 'previous'){
                    pageNumber--;
                    var sortedTotal = Math.floor(sortedOG.length/5) + 1;
            
                    pageNumber = Number(pageNumber) - 1; 
                    if (sortedOG.length > 5){
                        sorted = sortedOG.slice(pageNumber * 5, pageNumber * 5 + 5);
                    } else {
                        sorted = sortedOG;
                    }
                    
                    
                    
                    
                    const newEmbedPrevious = new EmbedBuilder()
                    .setColor('#E76AA3')
                    .setTitle("**PC**")
                    .setDescription(`__**Your PC**__`)
                    for (let j = 0; j < sorted.length; j++){
                        
                        
                        newEmbedPrevious.addFields({name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value:`Level: ${sorted[j].level}\nHealth: ${sorted[j].health}\nAttack: ${sorted[j].attack}, Special Attack: ${sorted[j].specialAttack}\nDefense: ${sorted[j].defense}, Special Defense: ${sorted[j].specialDefense}\nMoves: ${sorted[j].moves.join(", ")}\n`});
        
                    }
                    pageNumber++;
                    newEmbedPrevious.setFooter({ text:`Page # ${pageNumber}/${sortedTotal}`});
                    if(pageNumber == 1){
                        await interaction.editReply({embeds: [newEmbedPrevious], components: [rowstart]});
                    } else {
                        await interaction.editReply({embeds: [newEmbedPrevious], components: [row]});
                    }
                }
                */
                
                
                
                
                
                
            });
        }


        
    }
}



