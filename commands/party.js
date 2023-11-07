const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'party',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
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
        
        
        
        
        
        
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setTitle("**Current Party**")
        .setDescription(`__**Your Party**__`)
        
        for (let j = 0; j < sorted.length; j++){
            
            newEmbed.addFields(
                { name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value: `Level: ${sorted[j].level}\nHealth: ${sorted[j].health}\nAttack: ${sorted[j].attack}, Special Attack: ${sorted[j].specialAttack}\nDefense: ${sorted[j].defense}, Special Defense: ${sorted[j].specialDefense}\nMoves: ${sorted[j].moves.join(", ")}`}
            )


        }
        
        
        message.channel.send({ embeds: [newEmbed] });
        
        
        





        
    }
}