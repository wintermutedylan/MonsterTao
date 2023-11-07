const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'addmove',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        
    
        
        var moveName = args.join("-");
        var isMove = false;
        let move;
        for (let i = 0; i < moves.length; i++){ //for loop to actually create the party.  then use the if statement below to make sure you actually own the unit. 
            if (moveName === moves[i].move){ //tho you can just check if you own it here.  can use pc id for it instead should make it easier to set your party
                isMove = true;  
                move = moves[i];
            }
        }
        if (!isMove) return message.reply(`**${moveName}** is not a valid unit, Please enter a valid unit`); //change this to check if you have that unit. need to add ids to all units that you own to make it easier to set party
        
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        let unitName;
        let location;
        message.channel.send(`Please select a pokemon you want to add the move to. (Type out the PC ID. You can get this by searching up you pokemon in the pc)`);


        const filter = (m) => {
            let haveUnit = false;
            for(let h = 0; h < playerData.maids.length; h++){
                if (Number(m.content) == playerData.maids[h].pcID){
                    haveUnit = true;
                    unitName = playerData.maids[h];
                    location = h;
                    break;
                }
            }
            return  m.author.id === message.author.id && haveUnit;
        }
        const collector = message.channel.createMessageCollector({ filter, max: 1, time: 60000})
        var s;
        
        

        collector.on('collect', message => {
            s = message.content;
            
        });

        collector.on('end', collected => {
        
            if (collected.size === 0) {
                
                
                
                    message.channel.send(`${userMention(message.author.id)} You did not select a unit in time.`)
                
                return
            }
            if (move.learnedBy.includes(unitName.id) && unitName.moves.length < 4){
                addMove(move.move, ID, location, message, unitName.id, s);
                
                
                
            } else {
                message.reply(`Your ${unitName.id} with PC ID of ${s} either can't learn ${move.move} or has already learned 4 moves.  Please run this command again or the replace move command if it already has 4 moves`);
            }
            
                
            
            
        });
        





        
    }
}

async function addMove(move, ID, location, message, unitName, pcid){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    ["maids." + location + ".moves"]: move
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
    message.reply(`Your ${unitName} with PC ID of ${pcid} learned ${move}`);
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
