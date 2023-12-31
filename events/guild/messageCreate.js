require('dotenv').config();
const fs = require("fs");
const JSON_FILE = "../monstertao/units/friendship.json"; //base experience

const playerModel = require("../../models/playerSchema");


module.exports = async (Discord, client, message) => {
    let playerData; 
    playerData = await playerModel.findOne({ userID: message.author.id});
    
    const prefix = process.env.PREFIX;
    if(!message.author.bot && !message.content.startsWith(prefix) && playerData){ //stores steps in json file locally.  then when you run the party command it will update mongo
        try{
        const jsonData = fs.readFileSync(JSON_FILE);
        const newData = JSON.parse(jsonData);
        let index = newData.findIndex( function(item) { return item.userID == message.author.id } )
        
        
        if(index != -1){
            
            newData[index].steps += 1;
            let data = JSON.stringify(newData);
            fs.writeFileSync(JSON_FILE, data);
        } else {
            newData.push({userID: message.author.id, steps: 1});
            let data = JSON.stringify(newData);
            fs.writeFileSync(JSON_FILE, data);
        }
    } catch (error) {
        // logging the error
        console.error(error);
      
        throw error;
      }
    }
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const cmd = args.shift().toLowerCase();
    if (cmd[0] === '!') return;
    

    const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));
    
    
    if (!command) {
        return message.channel.send("This command doesn't exist!");
    }
    

    const validPermissions = [
        "ADMINISTRATOR",
        "CREATE_INSTANT_INVITE",
        "KICK_MEMBERS",
        "BAN_MEMBERS",
        "MANAGE_CHANNELS",
        "MANAGE_GUILD",
        "ADD_REACTIONS",
        "VIEW_AUDIT_LOG",
        "PRIORITY_SPEAKER",
        "STREAM",
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "SEND_TTS_MESSAGES",
        "MANAGE_MESSAGES",
        "EMBED_LINKS",
        "ATTACH_FILES",
        "READ_MESSAGE_HISTORY",
        "MENTION_EVERYONE",
        "USE_EXTERNAL_EMOJIS",
        "VIEW_GUILD_INSIGHTS",
        "CONNECT",
        "SPEAK",
        "MUTE_MEMBERS",
        "DEAFEN_MEMBERS",
        "MOVE_MEMBERS",
        "USE_VAD",
        "CHANGE_NICKNAME",
        "MANAGE_NICKNAMES",
        "MANAGE_ROLES",
        "MANAGE_WEBHOOKS",
        "MANAGE_EMOJIS"
    ];

    if (command.permissions.length) {
        let invalidPerms = [];
        for (const perm of command.permissions){
            if (!validPermissions.includes(perm)){
                return console.log(`Invalid Permissions ${perm}`);
            }
            if (!message.member.permissions.has(perm)){
                invalidPerms.push(perm);
            }
        }
        if (invalidPerms.length) {
            return message.channel.send(`Missing Permissions: \`${invalidPerms}\``);
        }
    }
    


    try {
        command.execute(client, message, cmd, args, Discord);
    } catch (err){
        message.reply("There was an error trying to execute this command!");
        console.log(err);
    }
}