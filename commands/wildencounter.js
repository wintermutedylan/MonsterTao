const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var routeEncounters = require("../units/routes.json");
var moveinfo = require("../units/moveinfo.json");
const lucky = require('lucky-item').default;
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'encounter',
    aliases: [],
    permissions: [],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord){
        let route = "kanto-route-1-area";//use args here.  this is just a placeholder for testing
        let encounterArr = [];
        for(let i = 0; i < routeEncounters.length; i++){
            if(routeEncounters[i].area == route){
                for(let j = 0; j < routeEncounters[i].encounter[0].encounter_details.length; j++){
                    let info = {
                        name: routeEncounters[i].name,
                        weight: routeEncounters[i].encounter[0].encounter_details[j].chance,
                        level: routeEncounters[i].encounter[0].encounter_details[j].max_level,
                        
                    }
                    encounterArr.push(info);
                }
            }
        }

        let wildPokemon = lucky.itemBy(encounterArr, 'weight');
        let unit;
        let moves = [];
        for(let w = 0; w < maids.length; w++){
            if(wildPokemon.name == maids[w].id.toLowerCase()){
                unit = maids[w];
                break;
            }
        }
        //create move array here with the moves it can learn at its current level.  if there are more than 4 moves take the highest level moves.  
        //then create the pokemon with its ivs stats moves level using same format at pokemon in gym leader json
        //then just use trainerbattle.js stuff to do the battling. need to make some changes because it is a wild pokemon.  need to add exp gain after winning


        
        





        
    }
}