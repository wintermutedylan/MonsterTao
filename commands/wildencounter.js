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

        console.log(lucky.itemBy(encounterArr, 'weight'));

        
        





        
    }
}