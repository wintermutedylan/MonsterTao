//add code here to display move info.  
//what the move is, type, power, accuracy.  maybe who cna learn it if there is enough room or I will have to make the a seperate command
const { userMention, memberNicknameMention, channelMention, roleMention } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var moves = require("../units/moves.json");
var moveinfo = require("../units/moveinfo.json");
var items = require("../units/items.json");
var temp = require("../units/tempfile.json");

var routeEncounters = require("../units/routes.json");

const Pokedex = require("pokeapi-js-wrapper")
const customOptions = {cache: false, cacheImages: false}
const P = new Pokedex.Pokedex(customOptions)
const fs = require("fs");
const playerModel = require("../models/playerSchema");

module.exports = {
    name: 'api',
    cooldown: 10,
    aliases: [],
    permissions: ["ADMINISTRATOR"],
    description: "Create user profile",
    async execute(client, message, cmd, args, Discord) {
        
        let finalPokemonArray = [];
        let finalItem = [];
        
        
        
        let searchArray = [];
        for(let s = 0; s < temptm.length; s++){
            
            searchArray.push(temptm[s].name);
            
            
        }
        // let searchArray = [];
        // for(let s = 400; s < maids.length; s++){
        //     if(maids[s].id.toLowerCase() != 'deoxys-speed' && maids[s].id.toLowerCase() != 'deoxys-defense'&&maids[s].id.toLowerCase() != 'deoxys-attack'&&maids[s].id.toLowerCase() != 'deoxys-normal'&&maids[s].id.toLowerCase() != 'giratina-altered'&&maids[s].id.toLowerCase() != 'wormadam-plant'&&maids[s].id.toLowerCase() != 'shaymin-land'&&maids[s].id.toLowerCase() != 'giratina-origin'){
        //         searchArray.push(maids[s].id.toLowerCase());
        //     }
            
            
        //  }
        
        
       
       try{
        (async () => {
            // const growthArray = await P.getPokemonSpeciesByName(searchArray);
            //finalPokemonArray = getlocations("sinnoh", 127);
           
            
            // for(let i = 0; i < moveinfo.length; i++){
            //     for(let j = 0; j < moveinfo[i].otherMoves.length; j++){
            //         if(moveinfo[i].otherMoves[j].method == "machine"){
            //             if(!finalPokemonArray.includes(moveinfo[i].otherMoves[j].name)){
            //                 finalPokemonArray.push(moveinfo[i].otherMoves[j].name);
            //             }
            //         }
            //     }
            // }

            // const growthArray = await P.getItemByName(searchArray);
            // for(let x = 0; x < growthArray.length; x++){
            //     let othertm = temptm.find(function(item) { return item.name == growthArray[x].name});
            //         let itemMap = {
                    
            //             name: othertm.name,
            //             catchModifier: null,
            //             healAmount: null,
            //             moveName: othertm.moveName,
            //             cost: growthArray[x].cost,
            //             type: "machine"
                    
            //     }
            //         finalItem.push(itemMap);
                    
                
            // }
            // const JSON_FILE = "../monstertao/units/temptm.json";
            // let data = JSON.stringify(finalItem);
            // fs.writeFileSync(JSON_FILE, data);
            
            

            // const JSON_FILE = "../monstertao/units/maids.json";
            // const jsonData = fs.readFileSync(JSON_FILE);
            // let newData = JSON.parse(jsonData);
            // for(let i = 0; i < growthArray.length; i++){
            //     for(let g = 0; g < maids.length; g++){
            //         if(growthArray[i].name == maids[g].id.toLowerCase()){
                        
            //                 newData[g]["catchRate"] = growthArray[i].capture_rate;
                        
                        
            //         }
            //     }
            // }
                
                
            
            
            //const growthArray = await P.getEvolutionChainById(searchArray);
            // let moreData = [];
            // const JSON_FILE = "../monstertao/units/tempfile.json"; //base experience
            // //const jsonData = fs.readFileSync(JSON_FILE);
            
            // for(let i = 0; i < routeEncounters.length; i++){
            //     if(moreData.findIndex(function(item) { return item.name == routeEncounters[i].area}) == -1){
            //         let x = {
            //             name: routeEncounters[i].area,
            //             badges: 0
            //         }
            //         moreData.push(x);
            //     }
            // }
            
            //let data = JSON.stringify(moreData);
            //fs.writeFileSync(JSON_FILE, data);
            
            // for(let i = 0; i < growthArray.length; i++){
            //     for(let j = 0; j < maids.length; j++){
            //         if(growthArray[i].name == maids[j].id.toLowerCase()){
            //             newData[j]["evMap"] = {"hp": growthArray[i].stats[0].effort,"attack": growthArray[i].stats[1].effort,"defense": growthArray[i].stats[2].effort,"specialAttack": growthArray[i].stats[3].effort,"specialDefense": growthArray[i].stats[4].effort};
            //         }
            //     }
            // }
            
            
            
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
            
            
            // for(let c = 0; c < maids.length; c++){
            //     let det = {
            //         evolvesTo: null,
            //         evolutionData: null,
            //         is_baby: false
            //     }
            //     newData[c]["evolutionDetails"] = det;
            //     let data = JSON.stringify(newData);
            //     fs.writeFileSync(JSON_FILE, data);
            // }
            /*
            for(let i = 0; i < growthArray.length; i++){  // this is to get growth rates from api
                
                    for(let k = 0; k < maids.length; k++){
                        if(maids[k].id.toLowerCase() == growthArray[i].chain.species.name && growthArray[i].chain.evolves_to.length != 0){
                            for(let j = 0; j < growthArray[i].chain.evolves_to.length; j++){
                                let det = {
                                    evolvesTo: growthArray[i].chain.evolves_to[j].species.name,
                                    evolutionData: growthArray[i].chain.evolves_to[j].evolution_details[0],
                                    is_baby: growthArray[i].chain.is_baby
                                }
                                newData[k]["evolutionDetails"] = det;
                                let data = JSON.stringify(newData);
                                fs.writeFileSync(JSON_FILE, data);
                                
                            }

                            
                        } else if(growthArray[i].chain.evolves_to.length != 0){
                            for(let j = 0; j < growthArray[i].chain.evolves_to.length; j++){
                                if(growthArray[i].chain.evolves_to[j].species.name == maids[k].id.toLowerCase() && growthArray[i].chain.evolves_to[j].evolves_to.length != 0){
                                    for(let a = 0; a < growthArray[i].chain.evolves_to[j].evolves_to.length; a++){
                                        let det = {
                                            evolvesTo: growthArray[i].chain.evolves_to[j].evolves_to[a].species.name,
                                            evolutionData: growthArray[i].chain.evolves_to[j].evolves_to[a].evolution_details[0],
                                            is_baby: growthArray[i].chain.evolves_to[j].is_baby
                                        }
                                        newData[k]["evolutionDetails"] = det;
                                        let data = JSON.stringify(newData);
                                        fs.writeFileSync(JSON_FILE, data);
                                        
                                    }
                                }

                            }
                            
                        } else {
                            //just put an empty thing here.  either null or idk since im doing a map ill think of something
                            
                        }
                    }
                      
                    
                
               
            }
            */
            
            

            /*
            if(growthArray[i].name == "slow-then-very-fast"){ 
                                newData[j]["growthRate"] = "Fluctuating";
                            } else if(growthArray[i].name == "fast-then-very-slow"){
                                newData[j]["growthRate"] = "Erratic";
                            } else if(growthArray[i].name == "medium"){
                                newData[j]["growthRate"] = "medium-fast";
                            } else {
                                newData[j]["growthRate"] = growthArray[i].name;
                            }
            */
            

            
            
        // let data = JSON.stringify(moreData); //this is for writing to a new file
        // console.log(data);
        // let data = JSON.stringify(newData); //this is for editing a json.  to add more to each array
        // fs.writeFileSync(JSON_FILE, data)
        
        // fs.writeFile(JSON_FILE, data, (error) => {
        //     // throwing the error
        //     // in case of a writing problem
        //     if (error) {
        //       // logging the error
        //       console.error(error);
          
        //       throw error;
        //     }
          
        //     console.log("data.json written correctly");
        //   });
          
          
          
          
          
          
          
           
            
            
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
                        
                        if(growthArray[b].pokemon_encounters[i].version_details[j].version.name == "diamond" || growthArray[b].pokemon_encounters[i].version_details[j].version.name == "pearl" || growthArray[b].pokemon_encounters[i].version_details[j].version.name == "platinum"){
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
        
        fs.writeFileSync("../monstertao/units/tempfile.json", data, (error) => {
            // throwing the error
            // in case of a writing problem
            if (error) {
              // logging the error
              console.error(error);
          
              throw error;
            }
          
            console.log("data.json written correctly");
          });
}