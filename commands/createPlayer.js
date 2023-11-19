const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");
module.exports = {
    name: 'createProfile',
    cooldown: 10,
    aliases: ['register', 'create'],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        

        message.channel.send(`${userMention(message.author.id)} Profile created.`);
   
    }
}