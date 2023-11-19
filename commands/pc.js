const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'pc',
    cooldown: 10,
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        if (args.length > 1) {
            return message.reply('Please only enter one number');
        }
        if (args.length === 0){
            args.push('1');
        }
        var pageNumber = args[0];
        var sorted = playerData.maids;
        var sortedTotal = Math.floor(sorted.length/5) + 1;
        
        pageNumber = Number(pageNumber) - 1; 
        if (sorted.length > 5) sorted = sorted.slice(pageNumber * 5, pageNumber * 5 + 5);
        
        
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setTitle("**PC**")
        .setDescription(`__**Your PC**__`)
        
        for (let j = 0; j < sorted.length; j++){
            
            newEmbed.addFields(
                { name: `PCID# ${sorted[j].pcID}: ${sorted[j].id}`, value: `Level: ${sorted[j].level}\nHealth: ${sorted[j].health}\nAttack: ${sorted[j].attack}, Special Attack: ${sorted[j].specialAttack}\nDefense: ${sorted[j].defense}, Special Defense: ${sorted[j].specialDefense}\nMoves: ${sorted[j].moves.join(", ")}`}
            )


        }
        pageNumber++;
        newEmbed.setFooter(`Page # ${pageNumber}/${sortedTotal}`)
        message.channel.send({ embeds: [newEmbed] });
        
        
        





        
    }
}



