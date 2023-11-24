const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var expTable = require("../units/exptable.json");
var natureTable = require("../units/natures.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'addcoins',
    cooldown: 10,
    aliases: [],
    permissions: ["ADMINISTRATOR"],
    description: "adds a pokemon to your pc.  arguments it takes are the pokemon name then level in that order",
    async execute(client, message, cmd, args, Discord){
        
        
        if(args.length < 2){
            return message.reply("error need id then amount to give that id");
        }
        
        var id = args[0];
        var coins = args[1];
        if(coins < 0){
            return message.reply("Need coins greater than 0");
        }
        addCoins(coins, id);
        message.channel.send(`you have added ${coins} to ${userMention(id)}`);





        
    }
}



async function addCoins(amount, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $inc: {
                    coins: amount
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}

