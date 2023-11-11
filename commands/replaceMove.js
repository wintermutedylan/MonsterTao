
const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'replacemove',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        let playerData; 
        playerData = await playerModel.findOne({ userID: message.author.id});
        if (!playerData) return message.channel.send("You don't exist. Please try again.");
        var ID = message.author.id;
        if(args.length == 0){
            return message.reply("Please pass in a a pokemon then the move you watn to replace then the move you are replacing it with");
        }
        if (args.length > 4){
            return message.reply("Please only type 2 moves and a pokemon to set the moves to.  If the move has 2 words please add a - between the words. for example: n$replacemove Charmander Scratch Ember");
        }
        let move1 = args[1];
        let move2 = args[2];
        let pokemon = args[0];
        let isMove1 = false;
        let isMove2 = false;
        let finalMove1;
        let finalMove2;
        for (let i = 0; i < moves.length; i++){ 
            if (move2 === moves[i].move){
                isMove2 = true;
                finalMove2 = moves[i];
            }
            if (move1 === moves[i].move){
                isMove1 = true;
                finalMove1 = moves[i];
            }
        }
        if (!isMove1) return message.reply(`**${move1}** is not a valid move please try again`); //change this to check if you have that unit. need to add ids to all units that you own to make it easier to set party
        if (!isMove2) return message.reply(`**${move2}** is not a valid move please try again`); //change this to check if you have that unit. need to add ids to all units that you own to make it easier to set party
        
        let havePokemon = false
        let unitName;
        let location;
        let pokemonMoves;
        for(let j = 0; j < playerData.maids.length; j++){
            if(Number(pokemon) == playerData.maids[j].pcID){ //finds your pokemon and makes sure you have it
                havePokemon = true;
                unitName = playerData.maids[j];
                location = j;
                pokemonMoves = playerData.maids[j].moves;
                break;
            }
        }

        
        
        if (!havePokemon){
            return message.reply("An error has occured. either you entered the PC ID in wrong or you don't have the unit you thought you did.  please try again");
        }
        if(finalMove2.learnedBy.includes(unitName.id) && pokemonMoves.includes(finalMove1.move)){ //this checks if your pokemon can learn the move and if it actually knows the first move you sent in
            for(let i = 0; i < pokemonMoves.length; i++){ //this replaces the old move with the new move
                if(finalMove1.move == pokemonMoves[i]){
                    pokemonMoves[i] = finalMove2.move;
                }
            }

            replaceMove(pokemonMoves, ID, location, message, unitName.id, unitName.pcID, finalMove1.move, finalMove2.move) //send in the new array set it in the database
        } else {
            return message.reply(`An error has occured.  Either your **${unitName.id}** can't learn **${finalMove2.move}** or doesn't know **${finalMove1.move}**. Please try again`);
        }
        
        
        
        





        
    }
}

async function replaceMove(move, ID, location, message, unitName, pcid, oldmove, newmove){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    ["maids." + location + ".moves"]: move
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
    message.reply(`Your **${unitName}** with PC ID of **${pcid}** forgot **${oldmove}** and learned **${newmove}**`);
}