const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var expTable = require("../units/exptable.json");
const fs = require("fs");
const JSON_FILE = "../monstertao/units/friendship.json"; //base experience

const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'party',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        const jsonData = fs.readFileSync(JSON_FILE);
        const newData = JSON.parse(jsonData);
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        
        
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
            let index = newData.findIndex( function(item) { return item.userID == message.author.id } );
            
            
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
            updateHappiness(finalPoints, ID, unitIndex);
        }

        

        
        
        
        
        
        
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setTitle("**Current Party**")
        .setDescription(`__**Your Party**__`)
        
        for (let j = 0; j < sorted.length; j++){
            if(sorted[j].level != 100){
                let unitExp = expTable.find(function(item) { return item.name == sorted[j].growthRate});
                let expToNextLevel = unitExp.levelTable.find(function(expItem) { return expItem.level == sorted[j].level + 1});
                newEmbed.addFields(
                    { name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value: `Level: ${sorted[j].level}, EXP: ${sorted[j].experience}/${expToNextLevel.experience}\nHealth: ${sorted[j].currentHealth}/${sorted[j].health}\nAttack: ${sorted[j].attack}, Special Attack: ${sorted[j].specialAttack}\nDefense: ${sorted[j].defense}, Special Defense: ${sorted[j].specialDefense}\nHappiness: ${sorted[j].happiness + finalPoints}\nMoves: ${sorted[j].moves.join(", ")}`}
                )
            } else {
                newEmbed.addFields(
                    { name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value: `Level: ${sorted[j].level}, EXP: Max Level\nHealth: ${sorted[j].currentHealth}/${sorted[j].health}\nAttack: ${sorted[j].attack}, Special Attack: ${sorted[j].specialAttack}\nDefense: ${sorted[j].defense}, Special Defense: ${sorted[j].specialDefense}\nHappiness: ${sorted[j].happiness + finalPoints}\nMoves: ${sorted[j].moves.join(", ")}`}
                )
            }


        }
        
        
        message.channel.send({ embeds: [newEmbed] });
        
        
        





        
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