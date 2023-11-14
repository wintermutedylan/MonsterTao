const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var routeEncounters = require("../units/routes.json");
var moveinfo = require("../units/moveinfo.json");
var moveList = require("../units/moves.json");
var typeList = require("../units/typechart.json");
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
        let unit = maids.find( function(item) { return item.id.toLowerCase() == wildPokemon.name } ); //finds the pokemon in the maids.json without using a for loop.  use this everywhere now.  
        let unitMoves = moveinfo.find( function(item) { return item.id.toLowerCase() == wildPokemon.name } );
        let moves = [];
        
        var sorted = unitMoves.leveUpMoves.sort((a, b) => (b.level) - (a.level)); //sorted the move array to go from highest learn level to lowest. 
        for(let m in sorted){
            
            if(wildPokemon.level >= sorted[m].level && moves.length < 4){  //goes down the array and adds the move to the moves array.  array is sorted highest to lowest.  so a high level pokemon won't just get low level moves
                moves.push(sorted[m].name);
            }
        }
        let baseAtk = unit.attack;
        let baseSpecialAtk = unit.specialAttack;
        let baseDef = unit.defense;
        let baseSpecialDef = unit.specialDefense;
        let baseHP = unit.health;
        let attackIV = randomIntFromInterval(0, 15);
        let specialAttackIV = randomIntFromInterval(0, 15);
        let defenseIV = randomIntFromInterval(0, 15);
        let specialDefenseIV = randomIntFromInterval(0, 15);
        let healthIV = randomIntFromInterval(0, 15);
        let hp = healthStatCalc(baseHP, healthIV, wildPokemon.level);
        let finalPokemon = {
            id: unit.id,
            types: unit.types,
            level: wildPokemon.level,
            health: hp,
            attack: otherStatCalc(baseAtk, attackIV, wildPokemon.level),
            defense: otherStatCalc(baseDef, defenseIV, wildPokemon.level),
            specialAttack: otherStatCalc(baseSpecialAtk, specialAttackIV, wildPokemon.level),
            specialDefense: otherStatCalc(baseSpecialDef, specialDefenseIV, wildPokemon.level),
            currentHealth: hp,
            moves: moves,
            attackIV: attackIV,
            specialAttackIV: specialAttackIV,
            defenseIV: defenseIV,
            specialDefenseIV: specialDefenseIV,
            healthIV: healthIV,
            baseXP: unit.baseEXP
        }
        createBattleThread(message, finalPokemon, Discord);
        

        
        

        //create move array here with the moves it can learn at its current level.  if there are more than 4 moves take the highest level moves.  
        //then create the pokemon with its ivs stats moves level using same format at pokemon in gym leader json
        //then just use trainerbattle.js stuff to do the battling. need to make some changes because it is a wild pokemon.  need to add exp gain after winning


        
        





        
    }
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
function healthStatCalc(base, iv, level){
    let top = ((base + iv) * 2) * level;
    let bot = top / 100;
    let total = bot + level + 10;
    return Math.floor(total);
}

function otherStatCalc(base, iv, level){
    let top = ((base + iv) * 2) * level;
    let bot = top / 100;
    let total = bot + 5;
    return Math.floor(total);
}

async function createBattleThread(message, boss, Discord){
    let threadName = `${message.author.username}'s battle against a wild ${boss.id}`;
    const thread = await message.channel.threads.create({
        name: threadName,
        autoArchiveDuration: 60,
        reason: 'Wild battle thread',
    });
    message.channel.send(`you are now in a battle a wild **${boss.id}** please move to the created thread ${channelMention(thread.id)}`);
    await thread.members.add(message.author.id);
    snapshot(message, boss, thread, Discord);
}

async function battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord){
    if(p1current.currentHealth <= 0){
        let usableUnits = false;
        for(let i = 0; i < p1party.length; i++){
            if (p1party[i].currentHealth > 0){
                usableUnits = true;
                break;
            }
        }
        if(!usableUnits){
            thread.send("Seems you are out of usable units.  you have died.  better luck next time");
            return;
        } else {
            //force swap
            pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, Discord, true); //set optional at the end to trigger a force swap
            
        }
    } else if(p2current.currentHealth <= 0){
        let usableUnits = false;
        for(let i = 0; i < p2party.length; i++){
            if (p2party[i].currentHealth > 0){
                usableUnits = true;
                break;
            }
        }
        if(!usableUnits){
            thread.send("You have beaten the wild pokemon congrats you get nothing rn.  becuase I haven't programed it"); //this is where to do exp gain
            return;
        } else {
            //force the bot to swap to a random unit for now
            //pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, true);//set optional at the end to trigger a force swap
            thread.send("it should never get to this point. since there is only 1 wild pokemon.  contact admin if this happens");
        }
    }
    if(turn % 2 == 1){ //check if turn is odd so p1 goes
        if (turn == 1){
            thread.send(`You have sent out ${p1current.id}`);
        } else {
            thread.send(`It is your turn to take action`)
        }
        
        
        thread.send('What would you like to do: Attack, Item, Switch (you have 60 seconds to decide)');


        const filter = (m) => {
            return  m.author.id === author.id && (m.content.toLowerCase() === 'attack' || m.content.toLowerCase() === 'item' || m.content.toLowerCase() === 'switch');
        }
        const collector = thread.createMessageCollector({ filter, max: 1, time: 60000})
        var s;
        
        

        collector.on('collect', message => {
            s = message.content;
            
        });

        collector.on('end', collected => {
        
            if (collected.size === 0) {
                
                    //battle(p1party, p2party, p1current, p2current, thread, author, 1);
                
                return
            }
            
                if (s.toLowerCase() == 'attack'){
                    
                    attack(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                 
                } else if (s.toLowerCase() == 'item'){
                    thread.send("this is a placeholder this doesn't work rn");
                    
                 
                } else if (s.toLowerCase() == 'switch'){
                    pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                    
                    
                 
                }
            
            
        });
    } else {
        thread.send(`The wild ${p2current.id} will now take action`);
        let move = p2current.moves[Math.floor(Math.random()*p2current.moves.length)];
        //thread.send(`**${p2current.id}** used ${move}`);
        dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move, Discord);

        

    }

}
async function pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, Discord, forceSwape = false){
    if(turn % 2 == 1){

        
        let pokemonAlive = [];
        for (let i = 0; i < p1party.length; i++){
            if (p1party[i].currentHealth > 0 && p1party[i].id != p1current.id){
                
                pokemonAlive.push(p1party[i].id);
                
            }
        }
        if (forceSwape){
            thread.send(`What unit would you like to switch in: ${pokemonAlive.join(", ")}`);
            const filter = (m) => {
                let isPokemon = false;
                for (let j = 0; j < pokemonAlive.length; j++){
                    if (m.content.toLowerCase() === pokemonAlive[j].toLowerCase()){
                        isPokemon = true;
                        break;
                    }
                }
                return  m.author.id === author.id && (isPokemon);
            }
            const collector = thread.createMessageCollector({ filter, max: 1, time: 60000})
            var s;
            
            

            collector.on('collect', message => {
                s = message.content;
                
            });

            collector.on('end', collected => {
            
                if (collected.size === 0) {
                        battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                    
                    return
                }
                    
                    for (let k = 0; k < p1party.length; k++){
                        if (p1party[k].id.toLowerCase() == s.toLowerCase()){
                            p1current = p1party[k];
                            break;
                        }
                    }
                    thread.send(`You have sent in ${p1current.id}`);
                    turn++;

                    battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                
                
                    
                
                
            });

        } else {

            
            thread.send(`What unit would you like to switch in: ${pokemonAlive.join(", ")} or type Cancel to go back`);
            const filter = (m) => {
                let isPokemon = false;
                for (let j = 0; j < pokemonAlive.length; j++){
                    if (m.content.toLowerCase() === pokemonAlive[j].toLowerCase() || m.content.toLowerCase() === "cancel"){
                        isPokemon = true;
                        break;
                    }
                }
                return  m.author.id === author.id && (isPokemon);
            }
            const collector = thread.createMessageCollector({ filter, max: 1, time: 60000})
            var s;
            
            

            collector.on('collect', message => {
                s = message.content;
                
            });

            collector.on('end', collected => {
            
                if (collected.size === 0) {
                        thread.send(`You took too long going back to battle select`);
                        battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                    
                    return
                }
                if (s.toLowerCase() == "cancel"){
                    thread.send(`You have cancelled and have been sent back to battle select`);
                    battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                } else {
                    let oldCurrent = p1current.id;
                    for (let k = 0; k < p1party.length; k++){
                        if (p1party[k].id.toLowerCase() == s.toLowerCase()){
                            p1current = p1party[k];
                            break;
                        }
                    }
                    thread.send(`You have switched out ${oldCurrent} and sent in ${p1current.id}`);
                    turn++;

                    battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                }
                
                    
                
                
            });
        }
    } else {
        let pokemonAlive = [];
        for (let i = 0; i < p2party.length; i++){
            if (p2party[i].currentHealth > 0 && p2party[i].id != p2current.id){
                
                pokemonAlive.push(p2party[i].id);
                
            }
        }
        let unitToSwap = pokemonAlive[Math.floor(Math.random()*pokemonAlive.length)];
        for (let k = 0; k < p2party.length; k++){
            if (p2party[k].id.toLowerCase() == unitToSwap.id.toLowerCase()){
                p2current = p2party[k];
                break;
            }
        }
        thread.send(`Your opponent has sent in ${p2current.id}`);
        turn++;

        battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);

    }

}

async function attack(p1party, p2party, p1current, p2current, thread, author, turn, Discord){
    let moves = p1current.moves;
    thread.send(`What attack would you like to use: ${moves.join(", ")}`);


        const filter = (m) => {
            let isPokemonMove = false;
            for (let j = 0; j < moves.length; j++){
                if (m.content.toLowerCase() === moves[j].toLowerCase() || m.content.toLowerCase() === "cancel"){
                    isPokemonMove = true;
                    break;
                }
            }
            return  m.author.id === author.id && (isPokemonMove);
        }
        const collector = thread.createMessageCollector({ filter, max: 1, time: 60000})
        var s;
        
        

        collector.on('collect', message => {
            s = message.content;
            
        });

        collector.on('end', collected => {
        
            if (collected.size === 0) {
                
                    battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
                
                return
            } if (s.toLowerCase() == "cancel"){
                thread.send(`You have cancelled and have been sent back to battle select`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord);
            } else {
                
                //thread.send(`You have selected the following move: ${s}`);
                
    
                dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, s, Discord)
            }
            
            
            
        });

}
function dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move, Discord){

    
    let moveDetails;
    let damage;
    for (let i = 0; i < moveList.length; i++){
        if (move.toLowerCase() === moveList[i].move.toLowerCase()){
            moveDetails = moveList[i];
            break;
        }
    }
    //check accuracy here.  if it misses don't do the switch statement
    let accuracyCheck = Math.random() * 100;
    if (accuracyCheck < moveDetails.accuracy){
        switch(moveDetails.move){
            case "Double-slap":
                let amountCheck = Math.random() * 100;
                let amount;
                if (amountCheck < 35){ // this is 2 slaps
                    amount = 2;
                } else if(amountCheck < 70 ){ // this is 3 slaps
                    amount = 3;
                } else if (amountCheck < 85){ // this is 4 slaps
                    amount = 4;
                } else { // this is 5 slaps
                    amount = 5;
                }
                for (let a = 0; a < amount; a++){
                    damage += damageFormula(moveDetails, p1current, p2current, turn);
                }
                thread.send(`Double slap hit ${amount} times.`);
                
                break;
            default:
                damage = damageFormula(moveDetails, p1current, p2current, turn);
        }

        
        
        
        if(turn % 2 == 1){ //p1 doing the dmg
            for (let j = 0; j < p2party.length; j++){
                if (p2current.id === p2party[j].id){
                    p2party[j].currentHealth = p2party[j].currentHealth - damage;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                }
            }
            //p2current.currentHealth = p2current.currentHealth - damage;
            const newEmbed = new Discord.MessageEmbed()
            .setColor('#E76AA3')
            .setAuthor(`Turn: ${turn}`)
            .setTitle(`${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            //thread.send(`You did a total of **${damage}** damage to the wild ${p2current.id}\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
        } else { //p2 doing the dmg
            for (let j = 0; j < p1party.length; j++){
                if (p1current.id === p1party[j].id){
                    p1party[j].currentHealth = p1party[j].currentHealth - damage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                }
            }
            //p1current.currentHealth = p1current.currentHealth - damage;
            const newEmbed = new Discord.MessageEmbed()
            .setColor('#E76AA3')
            .setAuthor(`Turn: ${turn}`)
            .setTitle(`${p2current.id} used ${moveDetails.move} doing **${damage}** damage`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            //thread.send(`The wild ${p2current.id} did **${damage}** damage to your ${p1current.id}\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nIt is your turn to take action\n----------------------------------`);
        }
        turn++;
        
        battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord)
    } else {
        if(turn % 2 == 1){//p1 miss
            const newEmbed = new Discord.MessageEmbed()
            .setColor('#E76AA3')
            .setAuthor(`Turn: ${turn}`)
            .setTitle(`${p1current.id} used ${moveDetails.move} but missed`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            turn++;
            //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
            battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord)
        } else {//p2 miss
            const newEmbed = new Discord.MessageEmbed()
            .setColor('#E76AA3')
            .setAuthor(`Turn: ${turn}`)
            .setTitle(`${p2current.id} used ${moveDetails.move} but missed`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            turn++;
            //thread.send(`The wild ${p2current.id} missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nIt is your turn to take action\n----------------------------------`);
            battle(p1party, p2party, p1current, p2current, thread, author, turn, Discord)
        }
        
    }
}
function damageFormula(details, p1current, p2current, turn){
    if(details.power == "None") return 0;
    let p1Type;
    let p2Type;
    let stab = 1;
    let weakness = 1;
    let randomNumber = randomIntFromInterval(85, 100);
    for (let u = 0; u < maids.length; u++){
        if (p1current.id.toLowerCase() == maids[u].id.toLowerCase()){
            p1Type = maids[u].types;
        } else if (p2current.id.toLowerCase() == maids[u].id.toLowerCase()){
            p2Type = maids[u].types;
        }
    }
    if(turn % 2 == 1){
        for(let f = 0; f < p1Type.length; f++){
            if (details.type == p1Type[f]){
                stab = 1.5;
            }
        }
        for (let i = 0; i < typeList.length; i++){
            if (details.type == typeList[i].type){
                for (let j = 0; j < p2Type.length; j++){
                    
                    if(typeList[i].superEffective.includes(p2Type[j])){
                        weakness = weakness * 2;
                    } else if(typeList[i].notEffective.includes(p2Type[j])){
                        weakness = weakness / 2;
                    } else if(typeList[i].immune.includes(p2Type[j])){
                        weakness = 0;
                    } 
                }
            }
        }
        let d;
        
        if (details.damageClass === "Physical"){
            d = ((((2 * p1current.level / 5 + 2) * p1current.attack * details.power / p2current.defense) / 50) + 2) * stab * weakness * randomNumber / 100;
        } else if (details.damageClass === "Special"){
            d = ((((2 * p1current.level / 5 + 2) * p1current.specialAttack * details.power / p2current.specialDefense) / 50) + 2) * stab * weakness * randomNumber / 100;
        }
            
        return Math.floor(d);
    } else {
        for(let f = 0; f < p2Type.length; f++){
            if (details.type == p2Type[f]){
                stab = 1.5;
            }
        }
        for (let i = 0; i < typeList.length; i++){
            if (details.type == typeList[i].type){
                for (let j = 0; j < p1Type.length; j++){
                    if(typeList[i].superEffective.includes(p1Type[j])){
                        weakness = weakness * 2;
                    } else if(typeList[i].notEffective.includes(p1Type[j])){
                        weakness = weakness / 2;
                    } else if(typeList[i].immune.includes(p1Type[j])){
                        weakness = 0;
                    } 
                }
            }
        }
        let d;
        if (details.damageClass === "Physical"){
            d = ((((2 * p2current.level / 5 + 2) * p2current.attack * details.power / p1current.defense) / 50) + 2) * stab * weakness * randomNumber / 100;
        } else if (details.damageClass === "Special"){
            d = ((((2 * p2current.level / 5 + 2) * p2current.specialAttack * details.power / p1current.specialDefense) / 50) + 2) * stab * weakness * randomNumber / 100;
        }
            
        return Math.floor(d);

    }
}


async function snapshot(message, boss, thread, Discord){
    let playerData; 
    let p1party = [];
    
    playerData = await playerModel.findOne({ userID: message.author.id});
    for(let j = 0; j < playerData.currentParty.length; j++){
        for(let k = 0; k < playerData.maids.length; k++){
            if (playerData.currentParty[j] == playerData.maids[k].pcID){
                p1party.push(playerData.maids[k]);
            }
        }
    }
    let p1current = p1party[0];

    
    let p2party =[];
    p2party.push(boss);
            
    let p2current = p2party[0];
    thread.send(`A wild Level ${p2current.level} ${p2current.id} has appeared`)
        
    
    startBattle(p1party, p2party, p1current, p2current, thread, message.author, Discord);
}
async function startBattle(p1party, p2party, p1current, p2current, thread, author, Discord){

        thread.send('The battle will start in 2 minutes or if you type Start');


        const filter = (m) => {
            return  m.author.id === author.id && (m.content.toLowerCase() === 'start');
        }
        const collector = thread.createMessageCollector({ filter, max: 1, time: 120000})
        var s;
        
        

        collector.on('collect', message => {
            s = message.content;
            
        });

        collector.on('end', collected => {
        
            if (collected.size === 0) {
                
                
                
                    battle(p1party, p2party, p1current, p2current, thread, author, 1, Discord);
                
                return
            }
            
                if (s.toLowerCase() == 'start'){
                    
                    battle(p1party, p2party, p1current, p2current, thread, author, 1, Discord);
                    
                    
                   

                }
            
            
        });

}