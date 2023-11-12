//add code here to display move info.  
//what the move is, type, power, accuracy.  maybe who cna learn it if there is enough room or I will have to make the a seperate command
const { userMention, memberNicknameMention, channelMention, roleMention } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
const Pokedex = require("pokeapi-js-wrapper")
const customOptions = {cache: false, cacheImages: false}
const P = new Pokedex.Pokedex(customOptions)
const fs = require("fs");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'api',
    aliases: [],
    permissions: ["ADMINISTRATOR"],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord) {
        
        let finalPokemonArray = [];
        
        let searchArray = [];
        for(let s = 400; s < maids.length; s++){
            searchArray.push(maids[s].id.toLowerCase());
        }
        
        
       
       try{
        (async () => {
            /*
            const growthArray = await P.getPokemonByName(searchArray);
            const JSON_FILE = "../monstertao/units/maids.json";
            const jsonData = fs.readFileSync(JSON_FILE);
            let newData = JSON.parse(jsonData);
            
            for(let i = 0; i < growthArray.length; i++){
                for(let j = 0; j < maids.length; j++){
                    if(growthArray[i].name == maids[j].id.toLowerCase()){
                        newData[j]["baseEXP"] = growthArray[i].base_experience;
                    }
                }
            }
            */
            
            
            const growthArray = await P.getLocationAreaByName("kanto-route-1-area");
            
            for(let i = 0; i < growthArray.pokemon_encounters.length; i++){
                let encounters;
                let earray = [];
                let pokemonName = growthArray.pokemon_encounters[i].pokemon.name;
                let isInRedBlue = false;
                for(let j = 0; j < growthArray.pokemon_encounters[i].version_details.length; j++){
                    
                    if(growthArray.pokemon_encounters[i].version_details[j].version.name == "red" || growthArray.pokemon_encounters[i].version_details[j].version.name == "blue"){
                        earray.push(growthArray.pokemon_encounters[i].version_details[j]);
                        isInRedBlue = true;
                        break;
                    }
                }
                if(isInRedBlue){
                    encounters = {
                        name: pokemonName,
                        encounter: earray
                    }
                    finalPokemonArray.push(encounters);
                }
            }
            
            
            /*
            for(let i = 0; i < growthArray.length; i++){
                let newData;
                /*
                for(let a = 0; a < growthArray[i].pokemon_species.length; a++){
                    for(let j = 0; j < maids.length; j++){
                        if(growthArray[i].pokemon_species[a].name == maids[j].id.toLowerCase()){
                            if(growthArray[i].name == "slow-then-very-fast"){
                                newData[j]["growthRate"] = "Fluctuating";
                            } else if(growthArray[i].name == "fast-then-very-slow"){
                                newData[j]["growthRate"] = "Erratic";
                            } else if(growthArray[i].name == "medium"){
                                newData[j]["growthRate"] = "medium-fast";
                            } else {
                                newData[j]["growthRate"] = growthArray[i].name;
                            }
                        }
                    }   
                    
                }
                
                if(growthArray[i].name == "slow-then-very-fast"){
                    newData = {
                        name: "Fluctuating",
                        levelTable: growthArray[i].levels
                    } 
                } else if(growthArray[i].name == "fast-then-very-slow"){
                    newData = {
                        name: "Erratic",
                        levelTable: growthArray[i].levels
                    } 
                } else if(growthArray[i].name == "medium"){
                    newData = {
                        name: "medium-fast",
                        levelTable: growthArray[i].levels
                    } 
                } else {
                    newData = {
                        name: growthArray[i].name,
                        levelTable: growthArray[i].levels
                    }
                }
                
               finalPokemonArray.push(newData);
            }
            */

            
            
        
        let data = JSON.stringify(finalPokemonArray);
        console.log(data);
        /*
        fs.writeFile("../monstertao/units/exptable.json", data, (error) => {
            // throwing the error
            // in case of a writing problem
            if (error) {
              // logging the error
              console.error(error);
          
              throw error;
            }
          
            console.log("data.json written correctly");
          });
          */
          
          
          
          
           
            
            
          })()
       } catch(err){
        console.log(err);
       }
       
        











    }
}