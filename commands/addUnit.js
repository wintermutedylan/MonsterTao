const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");
module.exports = {
    name: 'addunit',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        var unitName = args.join(" ");
        var isUnit = false;
        for (let i = 0; i < maids.length; i++){
            if (unitName === maids[i].id){
                isUnit = true;  
            }
        }
        if (!isUnit) return message.reply(`**${unitName}** is not a valid unit, Please enter a valid unit`);

        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        addUnit(unitName, ID);
        message.channel.send(`Added ${unitName} to your account`);


        
    }
}

async function addUnit(unitName, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    maids: {
                        "id": "Milim",
                        "level": 5,
                        "attack": 10,
                        "defense": 10,
                        "health": 25,
                        "currentHealth": 25,
                        "moves": ["Tackle", "Scratch"]
                    }
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}