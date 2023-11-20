const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var routeEncounters = require("../units/routes.json");
var moveinfo = require("../units/moveinfo.json");
var moveList = require("../units/moves.json");
var typeList = require("../units/typechart.json");
var natureTable = require("../units/natures.json");
var expTable = require("../units/exptable.json");
var stageCalcs = require("../units/stages.json");
const lucky = require('lucky-item').default;
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');


module.exports = {
    cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('encounter')
		.setDescription('Encounters a wild Pokemon')
		.addStringOption(option =>
			option.setName('region')
				.setDescription('Region to encounter a pokemon')
                .setRequired(true)
				.addChoices(
                    { name: 'Kanto', value: 'kanto'},
                    { name: 'Johto', value: 'johto'},
                    { name: 'Hoenn', value: 'hoenn'},
                    { name: 'Sinnoh', value: 'sinnoh'}
                    ))
        .addStringOption(option =>
            option.setName('route')
                .setDescription('Route to encounter a pokemon')
                .setRequired(true)
				.setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'route') {
            
            let routes = [];
            for(let i = 0; i < routeEncounters.length; i++){
                if(routeEncounters[i].region == interaction.options.getString('region').toLowerCase() && !routes.includes(routeEncounters[i].area)){
                    routes.push(routeEncounters[i].area);
                }
            }
            
            choices = routes;
            
			
		}

		const filtered = choices.filter(choice => choice.includes(focusedOption.value));
        
		await interaction.respond(
			filtered.slice(0, 25).map(choice => ({ name: choice, value: choice })),
		);
    },
    async execute(interaction){
        let playerData; 
        playerData = await playerModel.findOne({ userID: interaction.user.id});
        if (!playerData) return interaction.reply("You don't exist. Please try again.");
        var ID = interaction.user.id;
        let route = interaction.options.getString('route');//use args here.  this is just a placeholder for testing
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
        let hp = healthStatCalc(baseHP, unit.healthIV, 0, wildPokemon.level);
        
        
        let pickedNature = natureTable[Math.floor(Math.random()*natureTable.length)];
        let natureValues = pickNatureValues(pickedNature); //sets the nature values map so its easier to find

        let finalPokemon = {
            id: unit.id,
            types: unit.types,
            level: wildPokemon.level,
            nature: pickedNature.name,
            health: hp,
            attack: otherStatCalc(baseAtk, attackIV, 0, wildPokemon.level, natureValues.attackNatureValue),
            defense: otherStatCalc(baseDef, defenseIV, 0, wildPokemon.level, natureValues.defenseNatureValue),
            specialAttack: otherStatCalc(baseSpecialAtk, specialAttackIV, 0, wildPokemon.level, natureValues.specialAttackNatureValue),
            specialDefense: otherStatCalc(baseSpecialDef, specialDefenseIV, 0, wildPokemon.level, natureValues.specialDefenseNatureValue),
            currentHealth: hp,
            moves: moves,
            attackIV: attackIV,
            specialAttackIV: specialAttackIV,
            defenseIV: defenseIV,
            specialDefenseIV: specialDefenseIV,
            healthIV: healthIV,
            baseXP: unit.baseEXP,
            evs: unit.evMap,
            stages: {
                attack: 0,
                defense: 0,
                specialAttack: 0,
                specialDefense: 0,
                evasion: 6,
                accuracy: 0
            }
        }
        createBattleThread(interaction, finalPokemon);
        

        
        

        //create move array here with the moves it can learn at its current level.  if there are more than 4 moves take the highest level moves.  
        //then create the pokemon with its ivs stats moves level using same format at pokemon in gym leader json
        //then just use trainerbattle.js stuff to do the battling. need to make some changes because it is a wild pokemon.  need to add exp gain after winning


        
        





        
    }
}
function pickNatureValues(nature){
    let values= {
        attackNatureValue: 1,
        defenseNatureValue: 1,
        specialAttackNatureValue: 1,
        specialDefenseNatureValue: 1
    };
    switch(nature.increase){ //switch statement to get the increased stat from the nature
        case "attack":
            values.attackNatureValue = 1.1;
            break;
        case "defense":
            values.defenseNatureValue = 1.1;
            break;
        case "special-attack":
            values.specialAttackNatureValue = 1.1;
            break;
        case "special-defense":
            values.specialDefenseNatureValue = 1.1;
            break;

    }
    switch(nature.decrease){ //switch statement to get the decreased stat from the nature
        case "attack":
            values.attackNatureValue = 0.9;
            break;
        case "defense":
            values.defenseNatureValue = 0.9;
            break;
        case "special-attack":
            values.specialAttackNatureValue = 0.9;
            break;
        case "special-defense":
            values.specialDefenseNatureValue = 0.9;
            break;

    }
    return values;
}
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
function healthStatCalc(base, iv, ev, level){
    let top = (2 * base + iv + Math.floor(ev/4)) * level;
    let bot = Math.floor(top / 100);
    let total = bot + level + 10;
    return total;
}

function otherStatCalc(base, iv, ev, level, nature){
    let top = (2 * base + iv + Math.floor(ev/4)) * level;
    let bot = Math.floor(top / 100);
    let total = bot + 5;
    return Math.floor(total * nature);
}

async function createBattleThread(message, boss){
    if(message.channel.isThread()) return message.reply("please use this command out of a thread");
    let threadName = `${message.user.globalName}'s battle against a wild ${boss.id}`;
    const thread = await message.channel.threads.create({
        name: threadName,
        autoArchiveDuration: 60,
        type: ChannelType.PrivateThread,
        reason: 'Wild battle thread',
    });
    message.reply({ content: `you are now in a battle a wild **${boss.id}** please move to the created thread ${channelMention(thread.id)}`, ephemeral: true});
    await thread.members.add(message.user.id);
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
            let player1; 
            player1 = await playerModel.findOne({ userID: author.id});
            for(let un = 0; un < p1party.length; un++){
                let unIndex = player1.maids.findIndex( function(item) { return item.pcID == p1party[un].pcID } )
                if(unIndex != -1){
                    setCurrentHealth(unIndex, p1party[un].currentHealth, author.id);
                }
                
            }
            thread.send("Seems you are out of usable units.  you have died.  better luck next time. The thread will be deleted in 15 seconds");
            setTimeout(15000)
            setTimeout(() => {
                thread.delete();
              }, "15000");
            
            return;
        } else {
            //force swap
            pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, true); //set optional at the end to trigger a force swap
            
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
            
            let usedPCID = [];
            let leveledUpString = "";
            for(let g = 0; g < p1party.length; g++){
                if(p1party[g].usedInBattle && p1party[g].currentHealth > 0){
                    
                    usedPCID.push(p1party[g]);
                }
            }
            let resultExp = Math.floor(((p2current.baseXP * p2current.level) / 7) * (1 / usedPCID.length)); //exp formula.  ((base * enemylevel)/7) * (1/number used in battle and alive) * (1 if wild, 1.5 if trainer)
            
            
            for(let x = 0; x < usedPCID.length; x++){
                let startLevel = usedPCID[x].level;
                let totalXP = usedPCID[x].experience + resultExp;
                let finalXP = totalXP;
                let finalLevel = startLevel;
                if(startLevel != 100){
                    let unitExp = expTable.find(function(item) { return item.name == usedPCID[x].growthRate});
                    
                    for(let c = startLevel; c < unitExp.levelTable.length; c++){
                        let newXP = totalXP - unitExp.levelTable[c].experience;
                        if(newXP >= 0){
                            finalLevel = unitExp.levelTable[c].level;
                            //finalXP = newXP;
                        } else {
                            break;
                        }
                    }
                    let newEvs = {
                        hp: usedPCID[x].evMap.hp,
                        attack: usedPCID[x].evMap.attack,
                        defense: usedPCID[x].evMap.defense,
                        specialAttack: usedPCID[x].evMap.specialAttack,
                        specialDefense: usedPCID[x].evMap.specialDefense
                    };
                    let evTotal = newEvs.hp + newEvs.attack + newEvs.defense + newEvs.specialAttack + newEvs.specialDefense;
                    let wildEvs = p2current.evs.attack + p2current.evs.hp + p2current.evs.defense + p2current.evs.specialAttack + p2current.evs.specialDefense;
                    while(evTotal < 425 && wildEvs > 0){
                        if(p2current.evs.hp > 0 && newEvs.hp != 252){
                            let oldHP = newEvs.hp;
                            newEvs.hp += p2current.evs.hp;
                            if(newEvs.hp > 252){
                                evTotal += 252 - oldHP;
                                newEvs.hp = 252;
                                wildEvs -= p2current.evs.hp;
                                p2current.evs.hp = 0;
                            } else {
                                evTotal += p2current.evs.hp;
                                wildEvs -= p2current.evs.hp;
                                p2current.evs.hp = 0;
                            }
                            
                        }
                        if(p2current.evs.attack > 0 && newEvs.attack != 252){
                            let oldattack = newEvs.attack;
                            newEvs.attack += p2current.evs.attack;
                            if(newEvs.attack > 252){
                                evTotal += 252 - oldattack;
                                newEvs.attack = 252;
                                wildEvs -= p2current.evs.attack;
                                p2current.evs.attack = 0;
                            } else {
                                evTotal += p2current.evs.attack;
                                wildEvs -= p2current.evs.attack;
                                p2current.evs.attack = 0;
                            }
                            
                        }
                        if(p2current.evs.defense > 0 && newEvs.defense != 252){
                            let olddefense = newEvs.defense;
                            newEvs.defense += p2current.evs.defense;
                            if(newEvs.defense > 252){
                                evTotal += 252 - olddefense;
                                newEvs.defense = 252;
                                wildEvs -= p2current.evs.defense;
                                p2current.evs.defense = 0;
                            } else {
                                evTotal += p2current.evs.defense;
                                wildEvs -= p2current.evs.defense;
                                p2current.evs.defense = 0;
                            }
                            
                        }
                        if(p2current.evs.specialAttack > 0 && newEvs.specialAttack != 252){
                            let oldspecialAttack = newEvs.specialAttack;
                            newEvs.specialAttack += p2current.evs.specialAttack;
                            if(newEvs.specialAttack > 252){
                                evTotal += 252 - oldspecialAttack;
                                newEvs.specialAttack = 252;
                                wildEvs -= p2current.evs.specialAttack;
                                p2current.evs.specialAttack = 0;
                            } else {
                                evTotal += p2current.evs.specialAttack;
                                wildEvs -= p2current.evs.specialAttack;
                                p2current.evs.specialAttack = 0;
                            }
                            
                        }
                        if(p2current.evs.specialDefense > 0 && newEvs.specialDefense != 252){
                            let oldspecialDefense = newEvs.specialDefense;
                            newEvs.specialDefense += p2current.evs.specialDefense;
                            if(newEvs.specialDefense > 252){
                                evTotal += 252 - oldspecialDefense;
                                newEvs.specialDefense = 252;
                                wildEvs -= p2current.evs.specialDefense;
                                p2current.evs.specialDefense = 0;
                            } else {
                                evTotal += p2current.evs.specialDefense;
                                wildEvs -= p2current.evs.specialDefense;
                                p2current.evs.specialDefense = 0;
                            }
                            
                        }
                        
                        
                        
                    }
                    
                    let player; 
                    player = await playerModel.findOne({ userID: author.id});
                    let unitIndex = player.maids.findIndex( function(item) { return item.pcID == usedPCID[x].pcID } );
                    let sMap = {
                        burned: usedPCID[x].statusMap.burned,
                        frozen: usedPCID[x].statusMap.frozen,
                        paralysis: usedPCID[x].statusMap.paralysis,
                        poisoned: usedPCID[x].statusMap.poisoned,
                        asleep: usedPCID[x].statusMap.asleep,
                        sleepTurns: usedPCID[x].statusMap.sleepTurns,
                        confusion: usedPCID[x].statusMap.confusion,
                        confusionTurns: usedPCID[x].statusMap.confusionTurns
                    }
                    if(finalLevel > startLevel){ //uses this if the pokemon levels up to calc new stats
                        let unitBaseStats = maids.find(function(item2) { return item2.id.toLowerCase() == usedPCID[x].id.toLowerCase()});
                        let natValues = pickNatureValues(usedPCID[x].nature);
                        let newStats = {
                            health: healthStatCalc(unitBaseStats.health, usedPCID[x].ivMap.healthIV, newEvs.hp, usedPCID[x].level),
                            attack: otherStatCalc(unitBaseStats.attack, usedPCID[x].ivMap.attackIV, newEvs.attack, usedPCID[x].level, natValues.attackNatureValue),
                            defense: otherStatCalc(unitBaseStats.defense, usedPCID[x].ivMap.defenseIV, newEvs.defense, usedPCID[x].level, natValues.defenseNatureValue),
                            specialAttack: otherStatCalc(unitBaseStats.specialAttack, usedPCID[x].ivMap.specialAttackIV, newEvs.specialAttack, usedPCID[x].level, natValues.specialAttackNatureValue),
                            specialDefense: otherStatCalc(unitBaseStats.specialDefense, usedPCID[x].ivMap.specialDefenseIV, newEvs.specialDefense, usedPCID[x].level, natValues.specialDefenseNatureValue)
                        }
                        setExperienceAndLevel(finalLevel, finalXP, newEvs, unitIndex, author.id, sMap, newStats);
                        leveledUpString += `Your ${usedPCID[x].id} gained ${resultExp} XP and leveled up to level ${finalLevel}\n`;
                        let leveledPokemon = p1party.findIndex(function(item) { return item.pcID == usedPCID[x].pcID });
                        p1party[leveledPokemon].currentHealth += (newStats.health - usedPCID[x].health);

                    } else { //this is used if pokemon didnt level up
                        setExperienceAndLevel(finalLevel, finalXP, newEvs, unitIndex, author.id, sMap);
                        leveledUpString += `Your ${usedPCID[x].id} gained ${resultExp} XP\n`;
                    }
                    
                }
            }
            let player1; 
            player1 = await playerModel.findOne({ userID: author.id});
            for(let un = 0; un < p1party.length; un++){
                let unIndex = player1.maids.findIndex( function(item) { return item.pcID == p1party[un].pcID } )
                if(unIndex != -1){
                    setCurrentHealth(unIndex, p1party[un].currentHealth, author.id);
                }
                
            }
            const newEmbed = new EmbedBuilder()
            .setColor('#E76AA3')
            .setTitle(`XP gain`)
            .setDescription(leveledUpString)
            thread.send({ embeds: [newEmbed] });
            thread.send(`You have defeated the wild ${p2current.id} congrats.  This thread will self-destruct in 15 seconds`); //this is where to do exp gain and ev stuff.  need to run api to get evs for all pokemon. ignore speed ev.
            setTimeout(() => {
                thread.delete();
              }, "15000");
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
                    
                    attack(p1party, p2party, p1current, p2current, thread, author, turn);
                 
                } else if (s.toLowerCase() == 'item'){
                    //for items have then categorized as ball, heal, and 
                    thread.send("this is a placeholder this doesn't work rn");
                    
                 
                } else if (s.toLowerCase() == 'switch'){
                    pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn);
                    
                    
                 
                }
            
            
        });
    } else {
        thread.send(`The wild ${p2current.id} will now take action`);
        let move = p2current.moves[Math.floor(Math.random()*p2current.moves.length)];
        //thread.send(`**${p2current.id}** used ${move}`);
        dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move);

        

    }

}
async function pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, forceSwape = false){
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
                        battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    
                    return
                }
                    
                    for (let k = 0; k < p1party.length; k++){
                        if (p1party[k].id.toLowerCase() == s.toLowerCase()){
                            p1current = p1party[k];
                            p1party[k].usedInBattle = true;
                            p1party[k].stages = {
                                attack: 0,
                                defense: 0,
                                specialAttack: 0,
                                specialDefense: 0,
                                evasion: 0,
                                accuracy: 0
                            };
                            break;
                        }
                    }
                    thread.send(`You have sent in ${p1current.id}`);
                    turn++;

                    battle(p1party, p2party, p1current, p2current, thread, author, turn);
                
                
                    
                
                
            });

        } else {

            
            thread.send(`What unit would you like to switch in: ${pokemonAlive.join(", ")} or type Cancel to go back`);
            const filter = (m) => {
                let isPokemon = false;
                for (let j = 0; j < pokemonAlive.length; j++){
                    if (m.content.toLowerCase() === pokemonAlive[j].toLowerCase()){
                        isPokemon = true;
                        break;
                    }
                }
                return  m.author.id === author.id && (isPokemon || m.content.toLowerCase() === "cancel");
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
                            p1party[k].usedInBattle = true;
                            p1party[k].stages = {
                                attack: 0,
                                defense: 0,
                                specialAttack: 0,
                                specialDefense: 0,
                                evasion: 0,
                                accuracy: 0
                            };
                            break;
                        }
                    }
                    thread.send(`You have switched out ${oldCurrent} and sent in ${p1current.id}`);
                    turn++;
                    
                    battle(p1party, p2party, p1current, p2current, thread, author, turn);
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
                p2current = p2party[k]; //do stages here for trainer battle
                console.log("need to do stages for trainer battle at line 652");
                break;
            }
        }
        thread.send(`Your opponent has sent in ${p2current.id}`);
        turn++;

        battle(p1party, p2party, p1current, p2current, thread, author, turn);

    }

}

async function attack(p1party, p2party, p1current, p2current, thread, author, turn){
    let moves = p1current.moves;
    thread.send(`What attack would you like to use: ${moves.join(", ")}`);


        const filter = (m) => {
            let isPokemonMove = false;
            for (let j = 0; j < moves.length; j++){
                if (m.content.toLowerCase() === moves[j].toLowerCase()){
                    isPokemonMove = true;
                    break;
                }
            }
            return  m.author.id === author.id && (isPokemonMove || m.content.toLowerCase() === "cancel");
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
                
                //thread.send(`You have selected the following move: ${s}`);
                
    
                dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, s)
            }
            
            
            
        });

}
function dmgcalc(p1party, p2party, p1current, p2current, thread, author, turn, move){

    
    let moveDetails;
    let damage;
    for (let i = 0; i < moveList.length; i++){
        if (move.toLowerCase() === moveList[i].move.toLowerCase()){
            moveDetails = moveList[i];
            break;
        }
    }
    //check accuracy here.  if it misses don't do the switch statement
    let accuracyModified;
    
    if(turn % 2 == 1){//p1 accuracy and evasion check
        let combined = p1current.stages.accuracy - p2current.stages.evasion;
        if(combined < -6){
            combined = -6;
        } else if(combined > 6){
            combined = 6;
        }
        let accuracyStages = stageCalcs[0].stageTable.find(function(item) { return item.stage == combined});
        accuracyModified = moveDetails.accuracy * accuracyStages.value;
    } else { //p2 accuracy and evasion check
        let combined = p2current.stages.accuracy - p1current.stages.evasion;
        if(combined < -6){
            combined = -6;
        } else if(combined > 6){
            combined = 6;
        }
        let accuracyStages = stageCalcs[0].stageTable.find(function(item) { return item.stage == combined});
        accuracyModified = moveDetails.accuracy * accuracyStages.value;
    }
    let accuracyCheck = Math.random() * 100;
    if (accuracyCheck < accuracyModified){
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
            const newEmbed = new EmbedBuilder()
            .setColor('#E76AA3')
            
            .setTitle(`Your ${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
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
            const newEmbed = new EmbedBuilder()
            .setColor('#E76AA3')
            
            .setTitle(`The wild ${p2current.id} used ${moveDetails.move} doing **${damage}** damage`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            //thread.send(`The wild ${p2current.id} did **${damage}** damage to your ${p1current.id}\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nIt is your turn to take action\n----------------------------------`);
        }
        turn++;
        
        battle(p1party, p2party, p1current, p2current, thread, author, turn)
    } else {
        if(turn % 2 == 1){//p1 miss
            const newEmbed = new EmbedBuilder()
            .setColor('#E76AA3')
            
            .setTitle(`Your ${p1current.id} used ${moveDetails.move} but missed`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            turn++;
            //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
            battle(p1party, p2party, p1current, p2current, thread, author, turn)
        } else {//p2 miss
            const newEmbed = new EmbedBuilder()
            .setColor('#E76AA3')
            
            .setTitle(`The wild ${p2current.id} used ${moveDetails.move} but missed`)
            .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**`)
        
        
            thread.send({ embeds: [newEmbed] });
            turn++;
            //thread.send(`The wild ${p2current.id} missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nIt is your turn to take action\n----------------------------------`);
            battle(p1party, p2party, p1current, p2current, thread, author, turn)
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
        } if (p2current.id.toLowerCase() == maids[u].id.toLowerCase()){
            
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
        let attackModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p1current.stages.attack});
        let defenseModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p2current.stages.defense});
        let specialAttackModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p1current.stages.specialAttack});
        let specialDefenseModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p2current.stages.specialDefense});
        if (details.damageClass === "Physical"){
            d = ((((2 * p1current.level / 5 + 2) * (p1current.attack * attackModifier.value) * details.power / (p2current.defense * defenseModifier.value)) / 50) + 2) * stab * weakness * randomNumber / 100;
        } else if (details.damageClass === "Special"){
            d = ((((2 * p1current.level / 5 + 2) * (p1current.specialAttack * specialAttackModifier.value)* details.power / (p2current.specialDefense * specialDefenseModifier.value)) / 50) + 2) * stab * weakness * randomNumber / 100;
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
        let attackModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p2current.stages.attack});
        let defenseModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p1current.stages.defense});
        let specialAttackModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p2current.stages.specialAttack});
        let specialDefenseModifier = stageCalcs[1].stageTable.find(function(item) { return item.stage == p1current.stages.specialDefense});
        if (details.damageClass === "Physical"){
            d = ((((2 * p2current.level / 5 + 2) * (p2current.attack * attackModifier.value) * details.power / (p1current.defense * defenseModifier.value)) / 50) + 2) * stab * weakness * randomNumber / 100;
        } else if (details.damageClass === "Special"){
            d = ((((2 * p2current.level / 5 + 2) * (p2current.specialAttack * specialAttackModifier.value) * details.power / (p1current.specialDefense * specialDefenseModifier.value)) / 50) + 2) * stab * weakness * randomNumber / 100;
        }
            
        return Math.floor(d);

    }
}


async function snapshot(message, boss, thread){
    //maybe push a attack, def, boosts array here.  this will have X items, status moves that lower or raise those stats,  accuracy.  will need to update accuracy calc after 
    //for accuracy subtracted the evasion stage from the accuracy stage.  if that is higher than than +6 just use +6 from evasion.  and if its lower than -6 just use -6 from evasion. so if +2 accuracy and enemy has +1 evasion then its +1 total then grab 
    //from array
    //or just make one stage array in json.  then store the accuracy and evasion stages.  keep same formula then check json instead of having an array for both accuracy and evasion
    let playerData; 
    let p1party = [];
    
    playerData = await playerModel.findOne({ userID: message.user.id});
    for(let j = 0; j < playerData.currentParty.length; j++){
        for(let k = 0; k < playerData.maids.length; k++){
            if (playerData.currentParty[j] == playerData.maids[k].pcID){
                p1party.push(playerData.maids[k]);
            }
        }
    }
    for(let d = 0; d < p1party.length; d++){
        p1party[d]["stages"] = {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            evasion: 0,
            accuracy: -6
        };
        p1party[d]["usedInBattle"] = false;
    }
    let p1current = p1party[0];
    p1party[0].usedInBattle = true;

    
    let p2party =[];
    p2party.push(boss);
    /* this is for gym battles and pvp to add stat stages to every pokemon in party
    for(let f = 0; f < p2party.length; f++){
        p2party[f]["stages"] = {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            evasion: 0,
            accuracy: 0
        };
    }
    */
            
    let p2current = p2party[0];
    thread.send(`A wild Level ${p2current.level} ${p2current.id} has appeared`)
        
    
    startBattle(p1party, p2party, p1current, p2current, thread, message.user);
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
async function setExperienceAndLevel(finalLevel, finalXP, evMap, location, ID, status, stats = null){
    if(stats == null){ //no new stats just evs and xp
        try {
            await playerModel.findOneAndUpdate(
                {
                    userID: ID
                },
                {
                    $set: {
                        ["maids." + location + ".level"]: finalLevel,
                        ["maids." + location + ".experience"]: finalXP,
                        ["maids." + location + ".evMap"]: evMap,
                        ["maids." + location + ".statusMap"]: status
                    }
                    
                }
            );
    
        } catch(err){
            console.log(err);
        }
    } else { //set the new stats, evs, level
        try {
            await playerModel.findOneAndUpdate(
                {
                    userID: ID
                },
                {
                    $set: {
                        ["maids." + location + ".level"]: finalLevel,
                        ["maids." + location + ".experience"]: finalXP,
                        ["maids." + location + ".evMap"]: evMap,
                        ["maids." + location + ".health"]: stats.health,
                        ["maids." + location + ".attack"]: stats.attack,
                        ["maids." + location + ".defense"]: stats.defense,
                        ["maids." + location + ".specialAttack"]: stats.specialAttack,
                        ["maids." + location + ".specialDefense"]: stats.specialDefense,
                        ["maids." + location + ".statusMap"]: status
                    }
                    
                }
            );
    
        } catch(err){
            console.log(err);
        }
    }
    

}
async function setCurrentHealth(location, currenthealth, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    ["maids." + location + ".currentHealth"]: currenthealth,
                    
                }
                
            }
            
        );

    } catch(err){
        console.log(err);
    }
}