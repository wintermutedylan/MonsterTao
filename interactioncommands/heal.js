const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
const { EmbedBuilder } = require('discord.js');
var maids = require("../units/maids.json");
var expTable = require("../units/exptable.json");
const fs = require("fs");
const JSON_FILE = "../monstertao/units/friendship.json"; //base experience
const { SlashCommandBuilder } = require('discord.js');

const playerModel = require("../models/playerSchema");

module.exports = {
    
    cooldown: 10,
    data: new SlashCommandBuilder()
		.setName('heal')
		.setDescription('Heals your party to full'),
    
    async execute(interaction){
        
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
        var ID = interaction.user.id;
        if(interaction.channel.isThread()) return interaction.reply("please use this command out of a thread");

        for(let i = 0; i < playerData.currentParty.length; i++){
            let location = playerData.maids.findIndex(function(item) { return item.pcID == playerData.currentParty[i]});
            let sMap = {
                burned: false,
                frozen: false,
                paralysis: false,
                poisoned: false,
                asleep: false,
                sleepTurns: 0,
                confusion: false,
                confusionTurns: 0
            }
            updateCurrentHealth(playerData.maids[location].health, ID, location, sMap);
        }
        

        interaction.reply({content: "Your Party is now full health.  Good luck out there", ephemeral: true});
        
        
    }
}
async function updateCurrentHealth(points, ID, location, status){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    ["maids." + location + ".currentHealth"]: points,
                    ["maids." + location + ".statusMap"]: status
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
    
}