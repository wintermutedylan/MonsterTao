var units = require("../units/maids.json");
var bosses = require("../units/raidbosses.json");
var moveList = require("../units/moves.json");
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
                    
                    attack(p1party, p2party, p1current, p2current, thread, author, 1);
                 
                } else if (s.toLowerCase() == 'item'){
                    thread.send("this is a placeholder this doesn't work rn");
                    
                 
                } else if (s.toLowerCase() == 'switch'){
                    thread.send("this is a placeholder this doesn't work rn");
                    
                 
                }
            
            
        });
    } else {
        let move = p2current.moves[Math.floor(Math.random()*p2current.moves.length)];
        let movePower;
        for (let i = 0; i < moveList.length; i++){
            if (move === moveList[i].name){
                movePower = moveList[i].power;
            }
        }
        let attackStrength = Math.floor(p2current.attack * (0.01 * movePower));
        for (let j = 0; j < p1party.length; j++){
            if (p1current.id === p1party[j].id){
                p1party[j].currentHealth = p1party[j].currentHealth - attackStrength;
            }
        }
        p1current.currentHealth = p1current.currentHealth - attackStrength;
        turn++;
        thread.send(`
    Your current unit health is: ${p1current.currentHealth}/${p1current.health}
    Your foes current unit health is: ${p2current.currentHealth}/${p2current.health}
    It is your turn to take action now
    ----------------------------------`);

        battle(p1party, p2party, p1current, p2current, thread, author, turn)

    }

}

async function attack(p1party, p2party, p1current, p2current, thread, author, turn){
    let moves = p1current.moves.join(", ");
    thread.send(`What attack would you like to use: ${moves}`);


        const filter = (m) => {
            return  m.author.id === author.id && (m.content.toLowerCase() === p1current.moves[0].toLowerCase() || m.content.toLowerCase() === p1current.moves[1].toLowerCase() || m.content.toLowerCase() === 'placeholder' || m.content.toLowerCase() === 'placeholder');
        }
        const collector = thread.createMessageCollector({ filter, max: 1, time: 60000})
        var s;
        
        

        collector.on('collect', message => {
            s = message.content;
            
        });

        collector.on('end', collected => {
        
            if (collected.size === 0) {
                
                    battle(p1party, p2party, p1current, p2current, thread, author, 1);
                
                return
            }
            
                if (s.toLowerCase() == p1current.moves[0].toLowerCase()){
                    // from here take the move that was chosen and go into a another function.  that function will ahve all the moves in a switch statement and that will tell the game what to do.  
                    // then it will call the dmg calc function or status calc function
                    dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, p1current.moves[0])
                    
                 
                } else if (s.toLowerCase() == p1current.moves[1].toLowerCase()){
                    dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, p1current.moves[1])
                    
                 
                } //add a cancel here to go back to main battle thing tell them current hp again and ask what they want to do again.  don't remove a turn.  
            
            
        });

}
async function dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move){
    
    let movePower;
    let moveType;
    for (let i = 0; i < moveList.length; i++){
        if (move === moveList[i].name){
            movePower = moveList[i].power;
            moveType = moveList[i].type;
        }
    }
    let x = ((2*p1current.level)/5)+2;
    let y;
    if(moveType === "Physical"){
        y = x*movePower*(p1current.attack/p2current.defense);
    } else if(moveType === "Special"){
        y = x*movePower*(p1current.specialAttack/p2current.specialDefense);
    }
        
    let z = Math.floor((y/50) + 2); //remove math.floor from here when adding the two lines below
    //add typing here
    //add stab
    
    //let attackStrength = Math.floor(p1current.attack * (0.01 * movePower));
    for (let j = 0; j < p2party.length; j++){
        if (p2current.id === p2party[j].id){
            p2party[j].currentHealth = p2party[j].currentHealth - z;//z is a placeholder for the attack dmg
        }
    }
    p2current.currentHealth = p2current.currentHealth - attackStrength;
    turn++;
    thread.send(`
    Your current unit health is: ${p1current.currentHealth}/${p1current.health}
    Your foes current unit health is: ${p2current.currentHealth}/${p2current.health}
    Your foe will now take action
    ----------------------------------`);
    battle(p1party, p2party, p1current, p2current, thread, author, turn)

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