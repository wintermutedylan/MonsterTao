const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
var stageInfo = require("../units/stages.json");
var temp = require("../units/tempfile.json");
const fs = require("fs");
const JSON_FILE = "../monstertao/units/friendship.json"; //base experience
const jsonData = fs.readFileSync(JSON_FILE);
const newData = JSON.parse(jsonData);

const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'reload',
    cooldown: 10,
    aliases: [],
    permissions: ["ADMINISTRATOR"],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        if(args.length > 1){
            return message.reply("Please only enter one command");
        }
        const commandName = client.commands.get(args[0])
        
        
        
        





        
    }
}