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
		.setName('shop')
		.setDescription('View all items that can be bought')
        
        .addStringOption(option =>
			option.setName('type')
				.setDescription('Type of item you want to view the shop of')
                .setRequired(true)
				.addChoices(
                    { name: 'Heal', value: 'healing'},
                    { name: 'Ball', value: 'ball'},
                    { name: 'Evolution', value: 'evolution'},
                    { name: "TM", value: "machine"}
                    
                    )),
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        let type = interaction.options.getString('type')
        if(type == "machine"){
            type = "TM";
        }
        let itemArray = items.filter((itm) => itm.type == interaction.options.getString('type'));
        
        let itemString = "";
        for(let i = 0; i < itemArray.length; i++){
            itemString += `**${itemArray[i].name[0].toUpperCase() + itemArray[i].name.slice(1)}**, Cost: ${itemArray[i].cost}\n`;
        }
                
        
        if(type == "TM"){
            const select = new StringSelectMenuBuilder()
			.setCustomId('pages')
			.setPlaceholder('Select a page');
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Page 1`)
                        .setValue(`1`))
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Page 2`)
                        .setValue(`2`))
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Page 3`)
                        .setValue(`3`))
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Page 4`)
                        .setValue(`4`))

           
            
        
        const rowmenu = new ActionRowBuilder()
            .addComponents(select);

        let page1String = "";
        for(let i = 0; i < itemArray.slice(0, 24).length; i++){
            page1String += `**${itemArray[i].name[0].toUpperCase() + itemArray[i].name.slice(1)}**, Cost: ${itemArray[i].cost}\n`;
        }
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle(`${type[0].toUpperCase() + type.slice(1)} Shop`)
        .setDescription(page1String)
        newEmbed.setFooter({ text:`Page # 1`});
        
        

        

        
        
        
        
        const response = await interaction.reply({ embeds: [newEmbed], components: [rowmenu]});
            
            const collectorFilter = i => {
                i.deferUpdate(); 
                return i.user.id === interaction.user.id;
            };
            const collector = response.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 120000 });


            collector.on('collect', async i => {
                    
                    let pageNumber = Number(i.values[0]);
                    
                    const newEmbedNext = new EmbedBuilder()
                        .setColor('#E76AA3')
                        .setTitle(`${type[0].toUpperCase() + type.slice(1)} Shop`)
                    
                    if(pageNumber == 1){
                        let page1String = "";
                        let page1Array = itemArray.slice(0, 24);
                        for(let i = 0; i < page1Array.length; i++){
                            page1String += `**${page1Array[i].name[0].toUpperCase() + page1Array[i].name.slice(1)}**, Cost: ${page1Array[i].cost}\n`;
                        }
                        newEmbedNext.setDescription(page1String)
                    } else if(pageNumber == 2){
                        let page2String = "";
                        let page2Array = itemArray.slice(25, 49);
                        for(let i = 0; i < page2Array.length; i++){
                            page2String += `**${page2Array[i].name[0].toUpperCase() + page2Array[i].name.slice(1)}**, Cost: ${page2Array[i].cost}\n`;
                        }
                        newEmbedNext.setDescription(page2String)
                    } else if(pageNumber == 3){
                        let page3String = "";
                        let page3Array = itemArray.slice(50, 74);
                        for(let i = 0; i < page3Array.length; i++){
                            page3String += `**${page3Array[i].name[0].toUpperCase() + page3Array[i].name.slice(1)}**, Cost: ${page3Array[i].cost}\n`;
                        }
                        newEmbedNext.setDescription(page3String)
                    } else if(pageNumber == 4){
                        let page4String = "";
                        let page4Array = itemArray.slice(75, 99);
                        for(let i = 0; i < page4Array.length; i++){
                            page4String += `**${page4Array[i].name[0].toUpperCase() + page4Array[i].name.slice(1)}**, Cost: ${page4Array[i].cost}\n`;
                        }
                        newEmbedNext.setDescription(page4String)
                        
                    }
                    newEmbedNext.setFooter({ text:`Page # ${pageNumber}`});
                    
                    
                    
                    
                    
                        await interaction.editReply({embeds: [newEmbedNext], components: [rowmenu]}); 
                
                
                
                
                
                
                
            });

        } else {
            const newEmbed = new EmbedBuilder()
            .setColor('#E76AA3')
            .setTitle(`${type[0].toUpperCase() + type.slice(1)} Shop`)
            .setDescription(itemString)
            
            
            
    
            
    
            
            
            
            interaction.reply({ embeds: [newEmbed]});
    
        }
        
    }
}