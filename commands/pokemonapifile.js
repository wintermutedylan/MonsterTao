//add code here to display move info.  
//what the move is, type, power, accuracy.  maybe who cna learn it if there is enough room or I will have to make the a seperate command
const { userMention, memberNicknameMention, channelMention, roleMention } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var temp = require("../units/tempfile.json");

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
        
        // let searchArray = [];
        // for(let s = 0; s < locationInfo.length; s++){
        //     for(let g = 0; g < locationInfo[s].locationAreas.length; g++){
        //         searchArray.push(locationInfo[s].locationAreas[g].toLowerCase());
        //     }
            
        // }
        let searchArray = [];
        for(let s = 400; s < maids.length; s++){
            searchArray.push(maids[s].id.toLowerCase());
            
        }
        
        
       
       try{
        (async () => {
            //finalPokemonArray = getlocations("kanto", 51);
            
                // const JSON_FILE = "../monstertao/units/regionlocations.json";
                // const jsonData = fs.readFileSync(JSON_FILE);
                // let newData = JSON.parse(jsonData);
                
                
            
            
            const growthArray = await P.getPokemonByName(searchArray);
            const JSON_FILE = "../monstertao/units/maids.json"; //base experience
            const jsonData = fs.readFileSync(JSON_FILE);
            let newData = JSON.parse(jsonData);
            
            for(let i = 0; i < growthArray.length; i++){
                for(let j = 0; j < maids.length; j++){
                    if(growthArray[i].name == maids[j].id.toLowerCase()){
                        newData[j]["evMap"] = {"hp": growthArray[i].stats[0].effort,"attack": growthArray[i].stats[1].effort,"defense": growthArray[i].stats[2].effort,"specialAttack": growthArray[i].stats[3].effort,"specialDefense": growthArray[i].stats[4].effort};
                    }
                }
            }
            
            
            
            // const growthArray = await P.getLocationAreaByName("kanto-route-1-area"); //main one to get encounters from location-areas
            
            // for(let i = 0; i < growthArray.pokemon_encounters.length; i++){
            //     let encounters;
            //     let earray = [];
            //     let pokemonName = growthArray.pokemon_encounters[i].pokemon.name;
            //     let isInRedBlue = false;
            //     for(let j = 0; j < growthArray.pokemon_encounters[i].version_details.length; j++){
                    
            //         if(growthArray.pokemon_encounters[i].version_details[j].version.name == "red" || growthArray.pokemon_encounters[i].version_details[j].version.name == "blue"){
            //             earray.push(growthArray.pokemon_encounters[i].version_details[j]);
            //             isInRedBlue = true;
            //             break;
            //         }
            //     }
            //     if(isInRedBlue){
            //         encounters = {
            //             name: pokemonName,
            //             area: growthArray.name,
            //             encounter: earray
            //         }
            //         finalPokemonArray.push(encounters);
            //     }
            // }
            
            
            
            /*
            for(let i = 0; i < growthArray.length; i++){  // this is to get growth rates from api
                let newData;
                
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

            
            
        //let data = JSON.stringify(finalPokemonArray); //this is for writing to a new file
        //console.log(data);
        let data = JSON.stringify(newData); //this is for editing a json.  to add more to each array
        //console.log(data);
        
        fs.writeFileSync("../monstertao/units/maids.json", data, (error) => {
            // throwing the error
            // in case of a writing problem
            if (error) {
              // logging the error
              console.error(error);
          
              throw error;
            }
          
            console.log("data.json written correctly");
          });
          
          
          
          
          
          
          
           
            
            
          })()
       } catch(err){
        console.log(err);
       }
       
        











    }
}
async function getlocations(region, amount){
    const growthArray = await P.getRegionByName(region);
    let finalPokemonArray = [];
            
    for(let o = 0; o < amount; o++){
        finalPokemonArray.push(growthArray.locations[o].name);
    }
    getlocationAreas(finalPokemonArray, region);
}
async function getlocationAreas(searchArray, region){
    const growthArray = await P.getLocationByName(searchArray);
    let finalPokemonArray = [];
    for(let i = 0; i < growthArray.length; i++){ //this gets locationareas from an array of locations           
        for(let j = 0; j < searchArray.length; j++){
            if(growthArray[i].name == searchArray[j]){
                for(let a = 0; a < growthArray[i].areas.length; a++){
                    finalPokemonArray.push(growthArray[i].areas[a].name);
                    
                }
                
            } 
            
            
        }
        
       
    }
    getEncounters(finalPokemonArray, region);

}
async function getEncounters(searchArray, r){
            const growthArray = await P.getLocationAreaByName(searchArray); //main one to get encounters from location-areas
            let finalPokemonArray = [];
            for(let b = 0; b <growthArray.length; b++){
                for(let i = 0; i < growthArray[b].pokemon_encounters.length; i++){
                    let encounters;
                    let earray = [];
                    let pokemonName = growthArray[b].pokemon_encounters[i].pokemon.name;
                    let isInRedBlue = false;
                    for(let j = 0; j < growthArray[b].pokemon_encounters[i].version_details.length; j++){
                        
                        if(growthArray[b].pokemon_encounters[i].version_details[j].version.name == "red" || growthArray[b].pokemon_encounters[i].version_details[j].version.name == "blue"){
                            earray.push(growthArray[b].pokemon_encounters[i].version_details[j]);
                            isInRedBlue = true;
                            break;
                        }
                    }
                    if(isInRedBlue){
                        encounters = {
                            name: pokemonName,
                            region: r,
                            area: growthArray[b].name,
                            encounter: earray
                        }
                        finalPokemonArray.push(encounters);
                    }
                }
            }
        let data = JSON.stringify(finalPokemonArray); //this is for writing to a new file
        console.log(data);
        //let data = JSON.stringify(newData); //this is for editing a json.  to add more to each array
        //console.log(data);
        
        // fs.writeFileSync("../monstertao/units/tempfile.json", data, (error) => {
        //     // throwing the error
        //     // in case of a writing problem
        //     if (error) {
        //       // logging the error
        //       console.error(error);
          
        //       throw error;
        //     }
          
        //     console.log("data.json written correctly");
        //   });
}