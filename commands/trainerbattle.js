var units = require("../units/maids.json");
var bosses = require("../units/raidbosses.json");
var moveList = require("../units/moves.json");
var typeList = require("../units/typechart.json");
const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
const playerModel = require("../models/playerSchema");
module.exports = {
    name: 'trainerbattle',
    aliases: [],
    permissions: [],
    description: "embeds",
    async execute(client, message,cmd,args,Discord){

        
        
        message.channel.send(`Please select a trainer you want to battle`);


        const filter = (m) => {
            return  m.author.id === message.author.id && (m.content.toLowerCase() === 'oak');
        }
        const collector = message.channel.createMessageCollector({ filter, max: 1, time: 60000})
        var s;
        
        

        collector.on('collect', message => {
            s = message.content;
            
        });

        collector.on('end', collected => {
        
            if (collected.size === 0) {
                
                
                
                    message.channel.send(`${userMention(message.author.id)} You did not select a starter in time.`)
                
                return
            }
            
                if (s.toLowerCase() == 'oak'){
                    
                    createBattleThread(message, 'Oak');
                    
                    
                   

                }
            
            
        });


        
        
        
        
        

        
    }

    
}
async function createBattleThread(message, boss){
    let threadName = `${message.author.username}'s battle against ${boss}`;
    const thread = await message.channel.threads.create({
        name: threadName,
        autoArchiveDuration: 1440,
        reason: 'Boss battle thread',
    });
    message.channel.send(`you are now in a battle with ${boss} please move to the created thread ${channelMention(thread.id)}`);
    await thread.members.add(message.author.id);
    snapshot(message, boss, thread);
}

async function battle(p1party, p2party, p1current, p2current, thread, author, turn){
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
            thread.send("this is where you would need to swap unit if I programed it");
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
            thread.send("You have beaten the boss congrats you get nothing rn.  becuase I haven't programed it");
            return;
        } else {
            //force the bot to swap to a random unit for now
            thread.send("this is where the foe would need to swap unit if I programed it");
        }
    }
    if(turn % 2 == 1){ //check if turn is odd so p1 goes
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
                    
                    attack(p1party, p2party, p1current, p2current, thread, author, turn);
                 
                } else if (s.toLowerCase() == 'item'){
                    thread.send("this is a placeholder this doesn't work rn");
                    
                 
                } else if (s.toLowerCase() == 'switch'){
                    pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn);
                    
                    
                 
                }
            
            
        });
    } else {
        let move = p2current.moves[Math.floor(Math.random()*p2current.moves.length)];
        thread.send(`Your opponent used ${move}`);
        dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move);

        

    }

}
async function pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn){
    let pokemonAlive = [];
    for (let i = 0; i < p1party.length; i++){
        if (p1party[i].currentHealth > 0 && p1party[i].id != p1current.id){
            
            pokemonAlive.push(p1party[i].id);
            
        }
    }
    thread.send(`What unit would you like to switch in: ${pokemonAlive.join(", ")} or type Cancel to go back(currently doesn't work)`);
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
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            
            return
        }
        if (s.toLowerCase() == "cancel"){
            thread.send(`You have cancelled and have been sent back to battle select`);
            battle(p1party, p2party, p1current, p2current, thread, author, turn);
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

            battle(p1party, p2party, p1current, p2current, thread, author, turn);
        }
        
            
        
        
    });

}

async function attack(p1party, p2party, p1current, p2current, thread, author, turn){
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
                
                    battle(p1party, p2party, p1current, p2current, thread, author, turn);
                
                return
            } if (s.toLowerCase() == "cancel"){
                thread.send(`You have cancelled and have been sent back to battle select`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else {
                
                thread.send(`You have selected the following move: ${s}`);
                
    
                dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, s)
            }
            
            
            
        });

}
function dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move){

    
    let moveDetails;
    let damage;
    for (let i = 0; i < moveList.length; i++){
        if (move.replace(" ", "-").toLowerCase() === moveList[i].move.toLowerCase()){
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
                    damage += damageFormula(moveDetails, p1current, p2current);
                }
                thread.send(`Double slap hit ${amount} times.`);
                
                break;
            default:
                damage = damageFormula(moveDetails, p1current, p2current);
        }

        
        
        
        if(turn % 2 == 1){ //p1 doing the dmg
            for (let j = 0; j < p2party.length; j++){
                if (p2current.id === p2party[j].id){
                    p2party[j].currentHealth = p2party[j].currentHealth - damage;
                }
            }
            p2current.currentHealth = p2current.currentHealth - damage;
            thread.send(`
        You did a total of ${damage} to your opponent
        ----------------------------------`);
            thread.send(`
        Your current unit health is: ${p1current.currentHealth}/${p1current.health}
        Your foes current unit health is: ${p2current.currentHealth}/${p2current.health}
        Your foe will now take action
        ----------------------------------`);
        } else { //p2 doing the dmg
            for (let j = 0; j < p2party.length; j++){
                if (p1current.id === p1party[j].id){
                    p1party[j].currentHealth = p1party[j].currentHealth - damage;
                }
            }
            p1current.currentHealth = p1current.currentHealth - damage;
            thread.send(`
        Your opponent did ${damage} to you
        ----------------------------------`);
            thread.send(`
        Your current unit health is: ${p1current.currentHealth}/${p1current.health}
        Your foes current unit health is: ${p2current.currentHealth}/${p2current.health}
        It is your turn to take action
        ----------------------------------`);
        }
        turn++;
        
        battle(p1party, p2party, p1current, p2current, thread, author, turn)
    } else {
        if(turn % 2 == 1){//p1 miss
            thread.send(`
            Your move missed
            ----------------------------------`);
            turn++;
            thread.send(`
            Your current unit health is: ${p1current.currentHealth}/${p1current.health}
            Your foes current unit health is: ${p2current.currentHealth}/${p2current.health}
            Your foe will now take action
            ----------------------------------`);
            battle(p1party, p2party, p1current, p2current, thread, author, turn)
        } else {//p2 miss
            thread.send(`
        Your opponent missed
        ----------------------------------`);
        turn++;
        thread.send(`
        Your current unit health is: ${p1current.currentHealth}/${p1current.health}
        Your foes current unit health is: ${p2current.currentHealth}/${p2current.health}
        It is your turn to take action
        ----------------------------------`);
        battle(p1party, p2party, p1current, p2current, thread, author, turn)
        }
        
    }
}
function damageFormula(details, p1current, p2current){
    let stab = 1;
    let weakness = 1;
    let randomNumber = randomIntFromInterval(85, 100);
    for(let f = 0; f < p1current.types.length; f++){
        if (details.type == p1current.types[f]){
            stab = 1.5;
        }
    }
    for (let i = 0; i < typeList.length; i++){
        if (details.type == typeList[i].type){
            for (let j = 0; j < p2current.types.length; j++){
                if(typeList[i].superEffective.includes(p2current.types[j])){
                    weakness = weakness * 2;
                } else if(typeList[i].notEffective.includes(p2current.types[j])){
                    weakness = weakness / 2;
                } else if(typeList[i].immune.includes(p2current.types[j])){
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
}
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

async function snapshot(message, boss, thread){
    let playerData; 
    playerData = await playerModel.findOne({ userID: message.author.id});

    let p1party = playerData.maids;
    let p1current = playerData.maids[0];
    let p2party;
    let p2current;
    for (let i = 0; i < bosses.length; i++){
        if (boss === bosses[i].id){
            p2party = bosses[i].units;
            p2current = bosses[i].units[0];
        }
    }
    startBattle(p1party, p2party, p1current, p2current, thread, message.author);
}
async function startBattle(p1party, p2party, p1current, p2current, thread, author){
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
                
                
                
                    battle(p1party, p2party, p1current, p2current, thread, author, 1);
                
                return
            }
            
                if (s.toLowerCase() == 'start'){
                    
                    battle(p1party, p2party, p1current, p2current, thread, author, 1);
                    
                    
                   

                }
            
            
        });

}