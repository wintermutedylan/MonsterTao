const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'unitinfo',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        let move = args.join("-");
        let info;
        let isunit = false;
        
        
        for(let i = 0; i < maids.length; i++){
            if(move == maids[i].id.toLowerCase()){
                info = maids[i];
                isunit = true;
            }
        }

        if(!isunit) return message.reply(`**${move}** is not a valid unit.  please try again`)
        
        
        
        
        
        
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setTitle("**Unit Info**")
        .setDescription(`__**${info.id}**__\nType: ${info.types}\nBase Attack: ${info.attack}\nBase Defense: ${info.defense}\nBase Special Attack: ${info.specialAttack}\nBase Special Defense: ${info.specialDefense}`)
        
        
        message.channel.send({ embeds: [newEmbed] });
        
        
        





        
    }
}