const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'moveinfo',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        let move = args.join("-");
        let info;
        let ismove = false;
        
        
        for(let i = 0; i < moves.length; i++){
            if(move == moves[i].move.toLowerCase()){
                info = moves[i];
                ismove = true;
            }
        }
        if(!ismove) return message.reply(`**${move}** is not a valid move.  please try again`)
        
        
        
        
        
        
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setTitle("**Move Info**")
        .setDescription(`__**${info.move}**__\nType: ${info.type}\nDamage Type: ${info.damageClass}\nPower: ${info.power}\nAccuracy: ${info.accuracy}`)
        
        
        message.channel.send({ embeds: [newEmbed] });
        
        
        





        
    }
}