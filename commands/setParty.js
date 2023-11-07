const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'setparty',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        if(args.length == 0){
            return message.reply("Please pass in at least 1 pokemon to set your party.  If you want to re-order your party please use the command: switchparty");
        }
        if (args.length > 6){
            return message.reply("You can only set a maximum of 6 units into your party");
        }
        let newParty = [];
        for(let i = 0; i < args.length; i++){
            for(let j = 0; j < playerData.maids.length; j++){
                if(args[i] == playerData.maids[j].pcID){
                    newParty.push(args[i]);
                }
            }
        }
        
        if (!newParty){
            return message.reply("An error has occured. either you entered the PC ID in wrong or you don't have the unit you thought you did.  please try again");
        }
        setParty(newParty, ID, message);
        
        
        





        
    }
}

async function setParty(newParty, ID, message){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    currentParty: newParty
                }
                 
                
            }
        );

    } catch(err){
        console.log(err);
    }
    message.reply("Your party has been set.  You can run the command, **party**, to view your new party.");
}

