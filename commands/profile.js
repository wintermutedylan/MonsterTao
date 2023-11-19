var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");
const { userMention, memberNicknameMention, channelMention, roleMention } = require('@discordjs/builders');
module.exports = {
    name: 'profile',
    cooldown: 10,
    aliases: ['p','units'],
    permissions: [],
    description: "embeds",
    async execute(client, message,cmd,args,Discord){
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        
        
        
        var totalCP = playerData.totalCP;
        var totalCoins = playerData.coins;
        let unit = playerData.maids[0];
        let moves = unit.moves.join(", ");
   
        
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setAuthor(`${message.author.username}'s Units`)
        .setDescription(`**Unit:** ${unit.id}, level: ${unit.level} 
        **Total coins:** ${new Intl.NumberFormat().format(totalCoins)} 
        **Moves:** ${moves}`)
        .setThumbnail(message.author.avatarURL())

        

        
        
        
        message.channel.send({ embeds: [newEmbed] });
        
        
        
    }
    
}