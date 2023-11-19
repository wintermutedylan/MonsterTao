const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
const playerModel = require("../models/playerSchema");

module.exports = { //make this a slash command where when you enter the pcid it iwll get all the moves you can learn at your level
    name: 'addmove',
    cooldown: 10,
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        
    
        
        var moveName = args.join("-");
        var isMove = false;
        let move;
        
        for (let i = 0; i < moves.length; i++){ 
            if (moveName === moves[i].move.toLowerCase()){ 
                isMove = true;  
                move = moves[i];
            }
        }
        
        if (!isMove) return message.reply(`**${moveName}** is not a valid move, Please enter a valid move`); //change this to check if you have that unit. need to add ids to all units that you own to make it easier to set party
        
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
            //REPLACE THIS WITH NEW CHECK FOR LEVEL AS WELL
            //ONCE I UPDATE THE MOVE JSON

            if (move.learnedBy.includes(unitName.id) && unitName.moves.length < 4){
                for(let a = 0; a < moveinfo.length; a++){
                    if(unitName.id.toLowerCase() == moveinfo[a].id){
                        if((moveinfo[a].leveUpMoves.some(e => e.name == move.move.toLowerCase() && unitName.level >= e.level)) || (moveinfo[a].otherMoves.some(z => z.name == move.move.toLowerCase() && z.method == "tutor"))){
                            addMove(move.move, ID, location, message, unitName.id, s);
                        } else {
                            return message.reply(`Your ${unitName.id} is too low of level or the move you are try to teach is TM only. Level up your pokemon or use the useitem command to use a TM`);
                        }
                    }
                }
                
                
                
                
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
