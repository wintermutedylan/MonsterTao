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
		.setName('party')
		.setDescription('This will show your current party in an embed'),
    
    async execute(interaction){
        const jsonData = fs.readFileSync(JSON_FILE);
        const newData = JSON.parse(jsonData);
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply("You don't exist. Please try again.");
        var ID = interaction.user.id;
        
        
        let sorted = [];
        for (let i = 0; i < playerData.currentParty.length;i++){
            for(let k = 0; k < playerData.maids.length; k++){
                if(playerData.currentParty[i] == playerData.maids[k].pcID){
                    sorted.push(playerData.maids[k]);
                }
            }
        }
        let reminder = 0;
        let points = 0;
        let finalPoints = 0;
        
        try{
            let index = newData.findIndex( function(item) { return item.userID == interaction.user.id } );
            
            
            if(index != -1){
                
                if(newData[index].steps >= 128){
                    points = Math.floor(newData[index].steps / 128); //gets the whole number 
                    reminder = newData[index].steps % 128; //gets the remainder 
                    newData[index].steps = reminder;
                    let data = JSON.stringify(newData);
                    fs.writeFileSync(JSON_FILE, data);
                }
                
                
            } 
        } catch (error) {
            // logging the error
            console.error(error);
          
            throw error;
        }
        for(let i = 0; i < points; i++){
            let accuracyCheck = Math.random() * 100;
            if(accuracyCheck > 50){
                finalPoints++;
            }
        }

        for(let h = 0; h < playerData.currentParty.length; h++){
            let unitIndex = playerData.maids.findIndex( function(item) { return item.pcID == playerData.currentParty[h] } );
            if(finalPoints > 0){
                updateHappiness(finalPoints, ID, unitIndex);
            }
        }

        

        
        
        
        
        let status = [];

        
        const newEmbed = new EmbedBuilder()
        .setColor('#E76AA3')
        .setTitle("**Current Party**")
        .setDescription(`__**Your Party**__`)
        
        for (let j = 0; j < sorted.length; j++){
            if(sorted[j].level != 100){
                let unitExp = expTable.find(function(item) { return item.name == sorted[j].growthRate});
                let expToNextLevel = unitExp.levelTable.find(function(expItem) { return expItem.level == sorted[j].level + 1});
                for(let [key, value] of sorted[j].statusMap){
                    if(key != 'sleepTurns' && key != 'confusionTurns'){
                        if(value) status.push(key);
                    }
                }
                console.log(status);
                newEmbed.addFields(
                    { name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value: `Level: ${sorted[j].level}, EXP: ${sorted[j].experience}/${expToNextLevel.experience}\nHealth: ${sorted[j].currentHealth}/${sorted[j].health}\nType: ${sorted[j].types.join(", ")}\nStatus: \nMoves: ${sorted[j].moves.join(", ")}`}
                )
            } else {
                newEmbed.addFields(
                    { name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value: `Level: ${sorted[j].level}, EXP: Max Level\nHealth: ${sorted[j].currentHealth}/${sorted[j].health}\nType: ${sorted[j].types.join(", ")}\nMoves: ${sorted[j].moves.join(", ")}`}
                )
            }


        }
        
        
        interaction.reply({ embeds: [newEmbed] });
        
        
        





        
    }
}
async function updateHappiness(points, ID, location){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $inc: {
                    ["maids." + location + ".happiness"]: points
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
    
}