const { userMention, memberNicknameMention, channelMention, roleMention  } = require("@discordjs/builders");
var maids = require("../units/maids.json");
var routeEncounters = require("../units/routes.json");
var moveinfo = require("../units/moveinfo.json");
var moveList = require("../units/moves.json");
var typeList = require("../units/typechart.json");
var natureTable = require("../units/natures.json");
var expTable = require("../units/exptable.json");
var stageCalcs = require("../units/stages.json");
var items = require("../units/items.json");
var badgePenalty = require("../units/badgepenalty.json");
const lucky = require('lucky-item').default;
const playerModel = require("../models/playerSchema");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');


module.exports = {
    cooldown: 15,
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
        if (!playerData) return interaction.reply({content: "You don't exist. Please run /register to create a profile", ephemeral: true});
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
                let str = sorted[m].name;
                let modStr = str[0].toUpperCase() + str.slice(1);
                moves.push(modStr);
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
        let hp = healthStatCalc(baseHP, healthIV, 0, wildPokemon.level);
        
        
        let pickedNature = natureTable[Math.floor(Math.random()*natureTable.length)];
        let natureValues = pickNatureValues(pickedNature); //sets the nature values map so its easier to find

        let finalPokemon = {
            id: unit.id,
            pokedexNumber: unit.number,
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
            growthRate: unit.growthRate,
            stages: {
                attack: 0,
                defense: 0,
                specialAttack: 0,
                specialDefense: 0,
                evasion: 0,
                accuracy: 0
            },
            statusMap: {
                burned: false,
                frozen: false,
                paralysis: false,
                poisoned: false,
                asleep: false,
                sleepTurns: 0,
                confusion: false,
                confusionTurns: 0
            },
            catchRate: unit.catchRate
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
    if(turn % 2 == 0){
        if(p1current.statusMap.burned || p1current.statusMap.poisoned){
            for (let j = 0; j < p1party.length; j++){
                if (p1current.id === p1party[j].id){
                    let statusDamage = Math.floor(p1party[j].currentHealth/8);
                    if(statusDamage <= 0){
                        statusDamage = 1;
                    }
                    p1party[j].currentHealth -= statusDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    if(p1current.statusMap.burned){
                        thread.send(`Your ${p1party[j].id} took ${statusDamage} burn damage`);
                    } else {
                        thread.send(`Your ${p1party[j].id} took ${statusDamage} poison damage`);
                    }
                    
                }
            }
        } if(p2current.statusMap.burned || p2current.statusMap.poisoned){
            for (let j = 0; j < p2party.length; j++){
                if (p2current.id === p2party[j].id){
                    let statusDamage = Math.floor(p2party[j].currentHealth/8);
                    if(statusDamage <= 0){
                        statusDamage = 1;
                    }
                    p2party[j].currentHealth -= statusDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    if(p2current.statusMap.burned){
                        thread.send(`The wild ${p2party[j].id} took ${statusDamage} burn damage`);
                    } else {
                        thread.send(`The wild ${p2party[j].id} took ${statusDamage} poison damage`);
                    }
                    
                }
            }
        }
    }
    
    if(p1current.currentHealth <= 0){
        
        thread.send(`Your ${p1current.id} has fainted.`);
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
            if(turn == 1){
                thread.send("Looks like you have alive pokemon in your party.  go run the /heal command. this thread will close in 15 seconds");
                setTimeout(() => {
                    thread.delete();
                  }, 15000);
                  return;
                
            } else {
                thread.send("Seems you are out of usable units.  you have died.  better luck next time. The thread will be deleted in 15 seconds");
                setTimeout(() => {
                    thread.delete();
                }, 15000);
                
                return;
            }
        } else {
            //force swap
            pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, true); //set optional at the end to trigger a force swap
            
        }
    } else if(p2current.currentHealth <= 0){
        thread.send(`The wild ${p2current.id} has fainted.`);
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
                if(p1party[g].currentHealth > 0){
                    
                    usedPCID.push(p1party[g]);
                }
            }
            
            
            
            for(let x = 0; x < usedPCID.length; x++){
                let happinessCalc = 1;
                let used = 2;
                if(usedPCID[x].happiness >= 220){
                    happinessCalc = 1.2;
                }
                if(usedPCID[x].usedInBattle){
                    used = 1;
                }
                let resultExp = Math.floor(Math.floor((p2current.baseXP * p2current.level / 5) * (1/used) * (((2*p2current.level+10)/(p2current.level+usedPCID[x].level+10))**2.5) + 1) * happinessCalc);
                let startLevel = usedPCID[x].level;
                let totalXP = usedPCID[x].experience + resultExp;
                let finalXP = totalXP;
                let finalLevel = startLevel;
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
                    
                    
                    let player; 
                    player = await playerModel.findOne({ userID: author.id});
                    let unitIndex = player.maids.findIndex( function(item) { return item.pcID == usedPCID[x].pcID } );
                    let unitBaseStats = maids.find(function(item2) { return item2.id.toLowerCase() == usedPCID[x].id.toLowerCase()});
                        let natValues = pickNatureValues(usedPCID[x].nature);
                        let newStats = {
                            health: healthStatCalc(unitBaseStats.health, usedPCID[x].ivMap.healthIV, newEvs.hp, usedPCID[x].level),
                            attack: otherStatCalc(unitBaseStats.attack, usedPCID[x].ivMap.attackIV, newEvs.attack, usedPCID[x].level, natValues.attackNatureValue),
                            defense: otherStatCalc(unitBaseStats.defense, usedPCID[x].ivMap.defenseIV, newEvs.defense, usedPCID[x].level, natValues.defenseNatureValue),
                            specialAttack: otherStatCalc(unitBaseStats.specialAttack, usedPCID[x].ivMap.specialAttackIV, newEvs.specialAttack, usedPCID[x].level, natValues.specialAttackNatureValue),
                            specialDefense: otherStatCalc(unitBaseStats.specialDefense, usedPCID[x].ivMap.specialDefenseIV, newEvs.specialDefense, usedPCID[x].level, natValues.specialDefenseNatureValue)
                        }
                    if(finalLevel > startLevel){ //uses this if the pokemon levels up to calc new stats
                        
                        setExperienceAndLevel(finalLevel, finalXP, newEvs, unitIndex, author.id, usedPCID[x].statusMap, newStats);
                        leveledUpString += `Your ${usedPCID[x].id} gained ${resultExp} XP and leveled up to level ${finalLevel}\n`;
                        let leveledPokemon = p1party.findIndex(function(item) { return item.pcID == usedPCID[x].pcID });
                        p1party[leveledPokemon].currentHealth += (newStats.health - usedPCID[x].health);

                    } else { //this is used if pokemon didnt level up
                        setExperienceAndLevel(finalLevel, finalXP, newEvs, unitIndex, author.id, usedPCID[x].statusMap, newStats);
                        leveledUpString += `Your ${usedPCID[x].id} gained ${resultExp} XP\n`;
                    }
                    
                } else {
                    let player; 
                    player = await playerModel.findOne({ userID: author.id});
                    let unitIndex = player.maids.findIndex( function(item) { return item.pcID == usedPCID[x].pcID } );
                    let unitBaseStats = maids.find(function(item2) { return item2.id.toLowerCase() == usedPCID[x].id.toLowerCase()});
                        let natValues = pickNatureValues(usedPCID[x].nature);
                        let newStats = {
                            health: healthStatCalc(unitBaseStats.health, usedPCID[x].ivMap.healthIV, newEvs.hp, usedPCID[x].level),
                            attack: otherStatCalc(unitBaseStats.attack, usedPCID[x].ivMap.attackIV, newEvs.attack, usedPCID[x].level, natValues.attackNatureValue),
                            defense: otherStatCalc(unitBaseStats.defense, usedPCID[x].ivMap.defenseIV, newEvs.defense, usedPCID[x].level, natValues.defenseNatureValue),
                            specialAttack: otherStatCalc(unitBaseStats.specialAttack, usedPCID[x].ivMap.specialAttackIV, newEvs.specialAttack, usedPCID[x].level, natValues.specialAttackNatureValue),
                            specialDefense: otherStatCalc(unitBaseStats.specialDefense, usedPCID[x].ivMap.specialDefenseIV, newEvs.specialDefense, usedPCID[x].level, natValues.specialDefenseNatureValue)
                        }
                    setEVsForMaxLevel(newEvs, unitIndex, author.id, usedPCID[x].statusMap, newStats);
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
            addCoins(200, author.id);
            thread.send(`You have obtained 200 coins`);
            setTimeout(() => {
                thread.delete();
              }, 15000);
            return;
        } else {
            //force the bot to swap to a random unit for now
            //pokemonSwitch(p1party, p2party, p1current, p2current, thread, author, turn, true);//set optional at the end to trigger a force swap
            thread.send("it should never get to this point. since there is only 1 wild pokemon.  contact admin if this happens");
        }
    } else if(turn % 2 == 1){ //check if turn is odd so p1 goes
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
                    thread.send(`You took too long and now its the wild ${p2current.id}'s turn`);
                    turn++;
                    battle(p1party, p2party, p1current, p2current, thread, author, turn);
                
                return
            }
            
                if (s.toLowerCase() == 'attack'){
                    
                    attack(p1party, p2party, p1current, p2current, thread, author, turn);
                 
                } else if (s.toLowerCase() == 'item'){
                    //for items have then categorized as ball, heal, and 
                    useItem(p1party, p2party, p1current, p2current, thread, author, turn);
                    
                    
                 
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
async function useItem(p1party, p2party, p1current, p2current, thread, author, turn){
        thread.send('What type of item would you like to use: Heal, Ball, or type cancel to go back');


        const filter = (m) => {
            return  m.author.id === author.id && (m.content.toLowerCase() === 'heal' || m.content.toLowerCase() === 'ball' || m.content.toLowerCase() == 'cancel' );
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
            
                if (s.toLowerCase() == 'cancel'){
                    thread.send("You have cancelled and have been sent back to battle select.");
                    battle(p1party, p2party, p1current, p2current, thread, author, turn);
                 
                } else if (s.toLowerCase() == 'heal'){
                    //for items have then categorized as ball, heal, and 
                    thread.send("Not implemented yet going back to battle main function");
                    battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    
                    
                 
                } else if (s.toLowerCase() == 'ball'){
                    selectBall(p1party, p2party, p1current, p2current, thread, author, turn);
                    
                    
                 
                }
            
            
        });
}
async function selectBall(p1party, p2party, p1current, p2current, thread, author, turn){

    let playerBag; 
    playerBag = await playerModel.findOne({ userID: author.id});
    let balls = [];
    let ballString = "";
    for(let b = 0 ; b < playerBag.bag.length; b++){
        let foundItem = items.find(function(x){ return x.type == 'ball' && x.name == playerBag.bag[b].name});
        if(foundItem){
            let f = {
                name: foundItem.name,
                catchModifier: foundItem.catchModifier,
                amount: playerBag.bag[b].amount
            }
            balls.push(f);
            ballString += `${foundItem.name}, owned: ${playerBag.bag[b].amount}\n`;
        }
    }
    
        
    
    thread.send(`What ball would you like to use:\n${ballString}`);


    const filter = (m) => {
        let hasItem = false;
        for (let j = 0; j < balls.length; j++){
            if (m.content.toLowerCase() === balls[j].name.toLowerCase()){
                hasItem = true;
                break;
            }
        }
        return  m.author.id === author.id && (hasItem || m.content.toLowerCase() === "cancel");
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
        
            if (s.toLowerCase() == 'cancel'){
                thread.send("You have cancelled and been sent back to battle select");
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
                
            } else {
                let newBagArray = playerBag.bag;
                let ball = balls.find(function(item) { return item.name.toLowerCase() == s.toLowerCase()})
                let modifier = ball.catchModifier;
                let statusModifier = 1;
                let ballIndex = playerBag.bag.findIndex(function(h) { return h.name == ball.name});
                if(p2current.statusMap.asleep == true || p2current.statusMap.frozen == true){
                    statusModifier = 2.5;
                } else if(p2current.statusMap.burn == true || p2current.statusMap.poisoned == true || p2current.statusMap.paralysis == true){
                    statusModifier = 1.5;
                } else {
                    statusModifier = 1;
                }
                if(ball.amount - 1 == 0){
                    if(ballIndex > -1){
                        newBagArray.splice(ballIndex, 1); 
                        removeBall(author.id, newBagArray)
                    }   
                } else {
                    removeBallAmount(author.id, ballIndex);
                }
                let badgesNeeded = badgePenalty.find(function(item) { return p2current.level <= item.maxLevel }).badges;
                let lowLevelModifier = (36 - 2 * p2current.level)/10;
                if(lowLevelModifier < 1){
                    lowLevelModifier = 1;
                }
                
                let bp = badgesNeeded - playerBag.badges.length;
                if(bp < 0){
                    bp = 0;
                }
                let finalBP = 0.8 ** bp;
                
                let fullCatchRate = (((3*p2current.health - 2*p2current.currentHealth)*1*p2current.catchRate*modifier*finalBP)/(3*p2current.health)) * lowLevelModifier * statusModifier;
                
                let shakeCheck = Math.floor(65536/(255/fullCatchRate)**0.1875);
                
                let shakeTimes = 0;
                if(fullCatchRate >= 255){
                    shakeTimes = 4;
                } else {
                    for(let shake = 0; shake < 4; shake++){
                        let shakeRandomNumber = randomIntFromInterval(0, 65535);
                        
                        
                        if(shakeRandomNumber < shakeCheck){
                            shakeTimes++;
                        }

                    }
                }
                let delay = 1000; //1 second delay that will increase in the for loop
                if(shakeTimes == 0){
                    setTimeout(() => {
                        thread.send("Oh, no! The Pokémon broke free!");
                        turn++;
                        battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    }, delay)
                    
                } else if(shakeTimes == 1){
                    for(let i = 0; i < 1; i++){
                        setTimeout(() => {
                            thread.send("*Shake*");
                        }, delay);
                        delay+= 1000;
                    }
                    setTimeout(() => {
                        thread.send("Aww! It appeared to be caught!");
                        turn++;
                        battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    }, delay);

                } else if(shakeTimes == 2){
                    for(let i = 0; i < 2; i++){
                        setTimeout(() => {
                            thread.send("*Shake*");
                        }, delay);
                        delay+= 1000;
                    }
                    setTimeout(() => {
                        thread.send("Aargh! Almost had it!");
                        turn++;
                        battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    }, delay);

                } else if(shakeTimes == 3){
                    for(let i = 0; i < 3; i++){
                        setTimeout(() => {
                            thread.send("*Shake*");
                        }, delay);
                        delay+= 1000;
                    }
                    setTimeout(() => {
                        thread.send("Shoot! It was so close, too!");
                        turn++;
                        battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    }, delay);

                } else {
                    for(let i = 0; i < 4; i++){
                        setTimeout(() => {
                            thread.send("*Shake*");
                        }, delay);
                        delay+= 1000;
                    }
                    setTimeout(() => {
                        
                        thread.send(`Gotcha! ${p2current.id} was caught!`);
                        let pcID = playerBag.maids.length + 1;
                        
                        
                        let unitExp = expTable.find(function(item) { return item.name == p2current.growthRate});
                        let exp = unitExp.levelTable.find(function(expItem) { return expItem.level == p2current.level}).experience;
                        let expToNextLevel = unitExp.levelTable.find(function(expItem) { return expItem.level == p2current.level + 1});
                        const newEmbed = new EmbedBuilder()
                        .setColor('#E76AA3')
                        .setTitle(`Pokemon Info`)
                        .setDescription(`__**${p2current.id} PCID# ${pcID}**__`)
                        .setFields(
                            {name: "Level", value:`Level: ${p2current.level}, EXP: ${exp}/${expToNextLevel.experience}` },
                            {name: "Stats", value:`Hp: ${p2current.health}/${p2current.health}, Atk: ${p2current.attack}, SpAtk: ${p2current.specialAttack}, Def: ${p2current.defense}, SpDef: ${p2current.specialDefense}` },
                            {name: "IVs", value: `Hp: ${p2current.healthIV}, Atk: ${p2current.attackIV}, SpAtk: ${p2current.specialAttackIV}, Def: ${p2current.defenseIV}, SpDef: ${p2current.specialDefenseIV}`},
                            {name: "Moves", value: `${p2current.moves.join(", ")}`}
                        )
                        thread.send({content: "Here are the stats of the pokemon you just caught", embeds:[newEmbed]});
                        let pokemonLocation = playerBag.maids.findIndex(function(item) {return item.id.toLowerCase() == p1current.id.toLowerCase()});
                        addUnit(p2current, author.id, p2current.level, pcID, exp, p2current.nature);
                        setCurrentHealth(pokemonLocation, p1current.currentHealth, author.id);
                        setStatusMap(pokemonLocation, p1current.statusMap, author.id);
                        addCoins(100, author.id);
                        thread.send(`You have obtained 100 coins`);
                        thread.send("This thread will now self-destruct in 15 seconds.")
                        setTimeout(() => {
                            thread.delete();
                          }, 15000);
                        return;
                    }, delay);

                }


            }
        
        
    });
}
async function addUnit(unit, ID, level, pcID, exp, nature){
    
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $push: {
                    maids: {
                        "pcID": pcID,
                        "pokedexNumber": unit.pokedexNumber,
                        "id": unit.id,
                        "types": unit.types,
                        "level": level,
                        "experience": exp,
                        "nature": nature,
                        "happiness": 0,
                        "growthRate": unit.growthRate,
                        "health": unit.health,
                        "attack": unit.attack,
                        "defense": unit.defense,
                        "specialAttack": unit.specialAttack,
                        "specialDefense": unit.specialDefense,
                        "currentHealth": unit.health,
                        "moves": unit.moves,
                        "ivMap": {
                            "healthIV": unit.healthIV,
                            "attackIV": unit.attackIV,
                            "defenseIV": unit.defenseIV,
                            "specialAttackIV": unit.specialAttackIV,
                            "specialDefenseIV": unit.specialDefenseIV
                        },
                        "evMap": {
                            "hp": 0,
                            "attack": 0,
                            "defense": 0,
                            "specialAttack": 0,
                            "specialDefense": 0
                        },
                        "statusMap": {
                            "burned": false, 
                            "frozen": false, 
                            "paralysis": false, 
                            "poisoned": false, 
                            "asleep": false, 
                            "sleepTurns": 0, 
                            "confusion": false, 
                            "confusionTurns": 0
                        }
                        
                    }
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}
async function removeBallAmount(ID, location){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $inc: {
                    ["bag." + location + ".amount"]: -1
                }
                
            }
        );

    } catch(err){
        console.log(err);
    }
}
async function removeBall(ID, bagArray){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    bag: bagArray
                }
                
            }
        );

    } catch(err){
        console.log(err);
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
                        //battle(p1party, p2party, p1current, p2current, thread, author, turn);
                    
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
                p2party[k].stages = {
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
        thread.send(`Your opponent has sent in ${p2current.id}`);
        turn++;

        battle(p1party, p2party, p1current, p2current, thread, author, turn);

    }

}

async function attack(p1party, p2party, p1current, p2current, thread, author, turn){
    let moves = p1current.moves;
    thread.send(`What attack would you like to use: ${moves.join(", ")} or type cancel to go back`);


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
    let damage = 0;
    for (let i = 0; i < moveList.length; i++){
        if (move.toLowerCase() === moveList[i].move.toLowerCase()){
            moveDetails = moveList[i];
            break;
        }
    }
    if(moveDetails.move == "Metronome"){ //UPDATE THIS TO WORK FOR ALL THE MOVES!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        let alteredMoveList = moveList.filter((word) => word.damageClass != "Status");
        let slicedMoveList = alteredMoveList.slice(0,164);
        moveDetails = slicedMoveList[Math.floor(Math.random()*slicedMoveList.length)];
    }
    //check accuracy here.  if it misses don't do the switch statement
    let accuracyModified;
    if(turn % 2 == 1 && moveDetails.accuracy != "None"){//p1 accuracy and evasion check
        let combined = p1current.stages.accuracy - p2current.stages.evasion;
        if(combined < -6){
            combined = -6;
        } else if(combined > 6){
            combined = 6;
        }
        let accuracyStages = stageCalcs[0].stageTable.find(function(item) { return item.stage == combined});
        accuracyModified = moveDetails.accuracy * accuracyStages.value;
    } else if(turn % 2 == 0 && moveDetails.accuracy != "None"){ //p2 accuracy and evasion check
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
    let missed = false;
    let status = [];
    if(turn % 2 == 1){
        
        for(var key in p1current.statusMap) {
            if(key != 'sleepTurns' && key != 'confusionTurns'){
                if(p1current.statusMap[key]) status.push(key);
                
            }
        }
        

    } else {
        for(var key in p2current.statusMap) {
            if(key != 'sleepTurns' && key != 'confusionTurns'){
                if(p2current.statusMap[key]) status.push(key);
                
            }
        }
        
    }
    if(status.includes("frozen")){
        let stillFrozenCheck = Math.round(Math.random() * 100);
        if (stillFrozenCheck < 20){   
            if(turn % 2 == 1){
                p1current.statusMap.frozen = false;
            } else {
                p2current.statusMap.frozen = false;
            }
            missed = false;  
        } else {
            missed = true;
        }
                    
    } else if(status.includes("paralysis")){
        let stillParalysisCheck = Math.round(Math.random() * 100);
        if (stillParalysisCheck < 25){   
            
            missed = true;  
        } else {
            missed = false;
        }

    } else if(status.includes("sleep")){
        if(turn % 2 == 1 ){
            if(p1current.statusMap.sleepTurns != 0){
                p1current.statusMap.sleepTurns -= 1;
                missed = true;
            } else {
                thread.send(`Your ${p1current.id} woke up`);
                missed = false;
            }
            
        } else {
            if(p2current.statusMap.sleepTurns != 0){
                p2current.statusMap.sleepTurns -= 1;
                missed = true;
            } else {
                thread.send(`The wild ${p2current.id} woke up`);
                missed = false;
            }
            
        }
        
    } else if(status.includes("confusion")){
        if(turn % 2 == 1 ){
            if(p1current.statusMap.confusionTurns != 0){
                p1current.statusMap.confusionTurns -= 1;
                let hurtItselfCheck = Math.round(Math.random() * 100);
                if (hurtItselfCheck < 50){
                    missed = true;
                } else {
                    missed = false;
                }
                
            } else {
                thread.send(`Your ${p1current.id} snapped out of confusion`);
                missed = false;
            }
            
        } else {
            if(p2current.statusMap.confusionTurns != 0){
                p2current.statusMap.confusionTurns -= 1;
                let hurtItselfCheck = Math.round(Math.random() * 100);
                if (hurtItselfCheck < 50){
                    missed = true;
                } else {
                    missed = false;
                }
                
            } else {
                thread.send(`The wild ${p2current.id} snapped out of confusion`);
                missed = false;
            }
            
        }
    }
    
    if(moveDetails.accuracy == "None") {
        let stageQuote = "";
        let isSwift = false;
        switch(moveDetails.move){
            case "Swords-dance":
                if(turn % 2 == 1){
                    p1current.stages.attack += 2;
                    if(p1current.stages.attack > 6){
                        p1current.stages.attack = 6;
                        stageQuote += `Your ${p1current.id}'s Attack won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Attack sharply rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.attack += 2;
                    if(p2current.stages.attack > 6){
                        p2current.stages.attack = 6;
                        stageQuote += `The wild ${p2current.id}'s Attack won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Attack sharply rose!\n`;
                    }
                    break;
                }
            case "Meditate":
            case "Sharpen":
                if(turn % 2 == 1){
                    p1current.stages.attack += 1;
                    if(p1current.stages.attack > 6){
                        p1current.stages.attack = 6;
                        stageQuote += `Your ${p1current.id}'s Attack won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Attack rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.attack += 1;
                    if(p2current.stages.attack > 6){
                        p2current.stages.attack = 6;
                        stageQuote += `The wild ${p2current.id}'s Attack won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Attack rose!\n`;
                    }
                    break;
                }
            case "Double-team":
            case "Minimize":
                if(turn % 2 == 1){
                    p1current.stages.evasion += 1;
                    if(p1current.stages.evasion > 6){
                        p1current.stages.evasion = 6;
                        stageQuote += `Your ${p1current.id}'s Evasion won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Evasion rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.evasion += 1;
                    if(p2current.stages.evasion > 6){
                        p2current.stages.evasion = 6;
                        stageQuote += `The wild ${p2current.id}'s Evasion won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Evasion rose!\n`;
                    }
                    break;
                }
            case "Recover":
            case "Soft-boiled":
            case "Ingrain":
                if(turn % 2 == 1){
                    let healAmount = Math.floor(p1current.health/2);
                    
                    for (let j = 0; j < p1party.length; j++){ //updates health for the current pokemon out
                        if (p1current.id === p1party[j].id){
                            p1party[j].currentHealth += healAmount;
                            let total = p1party[j].currentHealth + healAmount;  
                            if(total > p1party[j].health){
                                p1party[j].currentHealth = p1party[j].health;
                            }
                        }
                    }
                    stageQuote += `Your ${p1current.id} healed for ${healAmount} hp\n`;
                    break;
                } else {
                    let healAmount = Math.floor(p2current.health/2);
                    
                    for (let j = 0; j < p2party.length; j++){ //updates health for the current pokemon out
                        if (p2current.id === p2party[j].id){
                            p2party[j].currentHealth += healAmount
                            let total = p2party[j].currentHealth + healAmount;  
                            if(total > p2party[j].health){
                                p2party[j].currentHealth = p2party[j].health;
                            }
                        }
                    }
                    stageQuote += `The wild ${p2current.id} healed for ${healAmount} hp\n`;
                    break;
                }
            case "Harden":
            case "Withdraw":
            case "Defense-curl":
                if(turn % 2 == 1){
                    p1current.stages.defense += 1;
                    if(p1current.stages.defense > 6){
                        p1current.stages.defense = 6;
                        stageQuote += `Your ${p1current.id}'s Defense won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Defense rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.defense += 1;
                    if(p2current.stages.defense > 6){
                        p2current.stages.defense = 6;
                        stageQuote += `The wild ${p2current.id}'s Defense won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Defense rose!\n`;
                    }
                    break;
                }
            case "Barrier":
            case "Acid-armor":
                if(turn % 2 == 1){
                    p1current.stages.defense += 2;
                    if(p1current.stages.defense > 6){
                        p1current.stages.defense = 6;
                        stageQuote += `Your ${p1current.id}'s Defense won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Defense rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.defense += 2;
                    if(p2current.stages.defense > 6){
                        p2current.stages.defense = 6;
                        stageQuote += `The wild ${p2current.id}'s Defense won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Defense rose!\n`;
                    }
                    break;
                }
            case "Growth":
                if(turn % 2 == 1){
                    p1current.stages.specialAttack += 1;
                    if(p1current.stages.specialAttack > 6){
                        p1current.stages.specialAttack = 6;
                        stageQuote += `Your ${p1current.id}'s Special Attack won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Special Attack rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.specialAttack += 1;
                    if(p2current.stages.specialAttack > 6){
                        p2current.stages.specialAttack = 6;
                        stageQuote += `The wild ${p2current.id}'s Special Attack won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Special Attack rose!\n`;
                    }
                    break;
                }
            case "Calm-mind":
                if(turn % 2 == 1){
                    p1current.stages.specialAttack += 1;
                    p1current.stages.specialDefense += 1;
                    if(p1current.stages.specialAttack > 6){
                        p1current.stages.specialAttack = 6;
                        stageQuote += `Your ${p1current.id}'s Special Attack won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Special Attack rose!\n`;
                    }
                    if(p1current.stages.specialDefense > 6){
                        p1current.stages.specialDefense = 6;
                        stageQuote += `Your ${p1current.id}'s Special Defense won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Special Defense rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.specialAttack += 1;
                    p2current.stages.specialDefense += 1;
                    if(p2current.stages.specialAttack > 6){
                        p2current.stages.specialAttack = 6;
                        stageQuote += `The wild ${p2current.id}'s Special Attack won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Special Attack rose!\n`;
                    }
                    if(p2current.stages.specialDefense > 6){
                        p2current.stages.specialDefense = 6;
                        stageQuote += `The wild ${p2current.id}'s Special Defense won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Special Defense rose!\n`;
                    }
                    break;
                }
            case "Amnesia":
                if(turn % 2 == 1){
                    p1current.stages.specialDefense += 2;
                    if(p1current.stages.specialDefense > 6){
                        p1current.stages.specialDefense = 6;
                        stageQuote += `Your ${p1current.id}'s Special Defense won't go higher!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Special Defense rose!\n`;
                    }
                    break;
                } else {
                    p2current.stages.specialDefense += 2;
                    if(p2current.stages.specialDefense > 6){
                        p2current.stages.specialDefense = 6;
                        stageQuote += `The wild ${p2current.id}'s Special Defense won't go higher!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Special Defense rose!\n`;
                    }
                    break;
                }
            case "Haze":
                p1current.stages.attack = 0;
                p1current.stages.defense = 0;
                p1current.stages.specialAttack = 0;
                p1current.stages.specialDefense = 0;
                p1current.stages.evasion = 0;
                p1current.stages.accuracy = 0;
                p2current.stages.attack = 0;
                p2current.stages.defense = 0;
                p2current.stages.specialAttack = 0;
                p2current.stages.specialDefense = 0;
                p2current.stages.evasion = 0;
                p2current.stages.accuracy = 0;
                stageQuote += "All stat changes were eliminated!\n"
                break;
            case "Light-screen":
            case "Reflect":
            case "Mirror-move":
            case "Conversion":
                stageQuote += "NOT IMPLEMENTED YET SORRY\n";
                break;
            case "Focus-energy":
                stageQuote += "NO CRITS IN THIS.  DON'T USE THIS MOVE\n";
                break;
            case "Swift":
            case "Shock-wave":
                isSwift = true;
                damage = damageFormula(moveDetails, p1current, p2current, turn);
                break;
            case "Splash":
                stageQuote += `No Effect!`;
                break;
            case "Rest":
                if(turn % 2 == 1){
                    p1current.statusMap.burn = false;
                    p1current.statusMap.poisoned = false;
                    p1current.statusMap.sleep = true;
                    p1current.statusMap.sleepTurns = 2;
                    p1current.statusMap.paralysis = false;
                    let healAmount = p1current.health;
                    
                    for (let j = 0; j < p1party.length; j++){ //updates health for the current pokemon out
                        if (p1current.id === p1party[j].id){
                            
                            p1party[j].currentHealth = healAmount;  
                            
                        }
                    }
                    stageQuote += `Your ${p1current.id} healed for ${healAmount} hp and fell asleep\n`;
                    break;
                    
                } else {
                    p2current.statusMap.burn = false;
                    p2current.statusMap.poisoned = false;
                    p2current.statusMap.sleep = true;
                    p2current.statusMap.sleepTurns = 2;
                    p2current.statusMap.paralysis = false;
                    let healAmount = p2current.health;
                    
                    for (let j = 0; j < p2party.length; j++){ //updates health for the current pokemon out
                        if (p2current.id === p2party[j].id){
                            
                            p2party[j].currentHealth = healAmount;  
                            
                        }
                    }
                    stageQuote += `The wild${p2current.id} healed for ${healAmount} hp and fell asleep\n`;
                    break;
                }
            
                
            
            

        }
        if(turn % 2 == 1){
            let statusArray = getStatus(p1current, p2current);
            if(isSwift){
                for (let j = 0; j < p2party.length; j++){
                    if (p2current.id === p2party[j].id){
                        p2party[j].currentHealth = p2party[j].currentHealth - damage;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            } else {
                
                
                //p2current.currentHealth = p2current.currentHealth - damage;
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move}`)
                .setDescription(`${stageQuote}\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            }
        } else {
            let statusArray = getStatus(p1current, p2current);
            if(isSwift){
                for (let j = 0; j < p1party.length; j++){
                    if (p1current.id === p1party[j].id){
                        p1party[j].currentHealth = p1party[j].currentHealth - damage;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            } else {
                //p2current.currentHealth = p2current.currentHealth - damage;
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move}`)
                .setDescription(`${stageQuote}\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            }
        }
        turn++;
        battle(p1party, p2party, p1current, p2current, thread, author, turn);

    } else if(moveDetails.move == "Guillotine" || moveDetails.move == "Fissure" || moveDetails.move == "Horn-drill" || moveDetails.move == "Sheer-cold"){
        let hitChance = 30;
        if(turn % 2 == 1){
            thread.send(`Your ${p1current.id} used ${moveDetails.move}`);
            if(p1current.level < p2current.level){
                hitChance = 0;
            } else {
                hitChance = p1current.level - p2current.level + 30;
            }
        } else {
            thread.send(`The wild ${p2current.id} used ${moveDetails.move}`);
            if(p2current.level < p1current.level){
                hitChance = 0;
            } else {
                hitChance = p2current.level - p1current.level + 30;
            }
        }
        

        
        if(Math.round(accuracyCheck) < hitChance){
            if(turn % 2 == 1){
                for (let j = 0; j < p2party.length; j++){
                    if (p2current.id === p2party[j].id){
                        p2party[j].currentHealth -= p2party[j].currentHealth;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                thread.send(`Its a one-hit KO!`);
                turn++;
        
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else {
                for (let j = 0; j < p1party.length; j++){
                    if (p1current.id === p1party[j].id){
                        p1party[j].currentHealth -= p1party[j].currentHealth;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                thread.send(`Its a one-hit KO!`);
                turn++;
        
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }
        } else {
            thread.send("But missed");
            turn++;
        
            battle(p1party, p2party, p1current, p2current, thread, author, turn);

        }
        
    } else if (Math.round(accuracyCheck) < Math.round(accuracyModified) && !missed){
        let stageQuote = "";
        switch(moveDetails.move){
            case "Double-slap":
            case "Comment-punch":
            case "Bind":
            case "Fury-attack":
            case "Wrap":
            case "Pin-missile":
            case "Fire-spin":
            case "Clamp":
            case "Spike-cannon":
            case "Barrage":
            case "Fury-swipes":
            case "Rock-blast":
            case "Sand-tomb":
                let amountCheck = Math.round(Math.random() * 100);
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
                thread.send(`${moveDetails.move} hit ${amount} times.`);
                
                break;
            case "Pay-day":
                let coins = 5 * p1current.level;
                damage = damageFormula(moveDetails, p1current, p2current, turn);
                if(damage == 0){
                    coins = 0;
                }
                addCoins(coins, author.id);
                thread.send(`You picked up ${coins} coins`);
                break;
            case "Magnitude":
                let magnitudeCheck = Math.round(Math.random() * 100);
                let orPower = moveDetails.power;
                let power;
                
                if (magnitudeCheck < 5){ 
                    power = 10;
                    stageQuote += "Magnitude 4!";
                } else if(magnitudeCheck < 15 ){ 
                    power = 30;
                    stageQuote += "Magnitude 5!";
                } else if (magnitudeCheck < 35){ 
                    power = 50;
                    stageQuote += "Magnitude 6!";
                } else if (magnitudeCheck < 65){ 
                    power = 70;
                    stageQuote += "Magnitude 7!";
                } else if (magnitudeCheck < 85){ 
                    power = 90;
                    stageQuote += "Magnitude 8!";
                } else if (magnitudeCheck < 95){ 
                    power = 110;
                    stageQuote += "Magnitude 9!";
                } else { 
                    power = 150;
                    stageQuote += "Magnitude 10!";
                }
                moveDetails.power = power;
                damage = damageFormula(moveDetails, p1current, p2current, turn);
                moveDetails.power = orPower;
                
                
                
                break;
            case "Ember":
            case "Fire-punch":
            case "Flamethrower":
            case "Fire-blast":
                let isBurned = nonVolitileCheck(p1current, p2current, turn, 10, ["Fire"], thread);
                if(isBurned && turn % 2 == 1){
                    p2current.statusMap.burned = true;
                    thread.send(`The wild ${p2current.id} has been burned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(isBurned && turn % 2 == 0){
                    p1current.statusMap.burned = true;
                    thread.send(`Your ${p1current.id} has been burned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Ice-punch":
            case "Ice-beam":
            case "Blizzard":
                let isFrozen = nonVolitileCheck(p1current, p2current, turn, 10, ["Ice"], thread);
                if(isFrozen && turn % 2 == 1){
                    p2current.statusMap.frozen = true;
                    thread.send(`The wild ${p2current.id} has been frozen.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(isFrozen && turn % 2 == 0){
                    p1current.statusMap.frozen = true;
                    thread.send(`Your ${p1current.id} has been frozen.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Thunder-punch":
            case "Thunder-shock":
            case "Thunderbolt":
            case "Thunder":
                let isParalysis = nonVolitileCheck(p1current, p2current, turn, 10, ["Electric"], thread);
                if(isParalysis && turn % 2 == 1){
                    p2current.statusMap.paralysis = true;
                    thread.send(`The wild ${p2current.id} has been paralyzed.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(isParalysis && turn % 2 == 0){
                    p1current.statusMap.paralysis = true;
                    thread.send(`Your ${p1current.id} has been paralyzed.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Double-kick":
            case "Bonemerang":
                for (let a = 0; a < 2; a++){
                    damage += damageFormula(moveDetails, p1current, p2current, turn);
                }
                thread.send(`${moveDetails.move} hit 2 times.`);
                break;
            case "Sand-attack":
            case "Smokescreen":
            case "Kinesis":
                

                if(turn % 2 == 1){
                    
                    p2current.stages.accuracy -= 1;
                    if(p2current.stages.accuracy < -6){
                        p2current.stages.accuracy = -6;
                        stageQuote += `The wild ${p2current.id}'s Accuracy won't go lower\n`;
                    } else{
                        stageQuote += `The wild ${p2current.id}'s Accuracy fell\n`;
                    }
                    break;
                } else {
                    
                    p1current.stages.accuracy -= 1;
                    if(p1current.stages.accuracy < -6){
                        p1current.stages.accuracy = -6;
                        stageQuote += `Your ${p1current.id}'s Accuracy won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Accuracy fell\n`;
                    }
                    
                    break;
                    
                }
            case "Body-slam":
            case "Lick":
            case "Bounce":
                let bodyCheck = nonVolitileCheck(p1current, p2current, turn, 30, ["Electric"], thread);
                if(bodyCheck && turn % 2 == 1){
                    p2current.statusMap.paralysis = true;
                    thread.send(`The wild ${p2current.id} has been paralyzed.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(bodyCheck && turn % 2 == 0){
                    p1current.statusMap.paralysis = true;
                    thread.send(`Your ${p1current.id} has been paralyzed.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Smog":
                let smogCheck = nonVolitileCheck(p1current, p2current, turn, 40, ["Poison", "Steel"], thread);
                if(smogCheck && turn % 2 == 1){
                    p2current.statusMap.poisoned = true;
                    thread.send(`The wild ${p2current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(smogCheck && turn % 2 == 0){
                    p1current.statusMap.poisoned = true;
                    thread.send(`Your ${p1current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Sludge":
                let sludgeCheck = nonVolitileCheck(p1current, p2current, turn, 30, ["Poison", "Steel"], thread);
                if(sludgeCheck && turn % 2 == 1){
                    p2current.statusMap.poisoned = true;
                    thread.send(`The wild ${p2current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(sludgeCheck && turn % 2 == 0){
                    p1current.statusMap.poisoned = true;
                    thread.send(`Your ${p1current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            
                
            case "Take-down":
            case "Double-edge":
            case "Submission":
                damage = damageFormula(moveDetails, p1current, p2current, turn);
                let selfDamage = Math.floor(damage/4)
                if(turn % 2 == 1){
                    for (let j = 0; j < p1party.length; j++){
                        if (p1current.id === p1party[j].id){
                            p1party[j].currentHealth = p1party[j].currentHealth - selfDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                        }
                    }
                    thread.send(`Your ${p1current.id} took ${selfDamage} recoil damage`);
                    break;
                } else {
                    for (let j = 0; j < p1party.length; j++){
                        if (p2current.id === p2party[j].id){
                            p2party[j].currentHealth = p2party[j].currentHealth - selfDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                        }
                    }
                    thread.send(`The wild ${p2current.id} took ${selfDamage} recoil damage`);
                    break;
                }
            case "Thrash":
            case "Petal-dance":
                for(let mv = 0; mv < 3; mv++){
                    damage += damageFormula(moveDetails, p1current, p2current, turn);
                }
                if(turn % 2 == 1){
                    p1current.statusMap.confusion = true;
                    p1current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                    thread.send(`Your ${p1current.id} hit 3 times and is now confused`);
                    break;
                } else {
                    p2current.statusMap.confusion = true;
                    p2current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                    thread.send(`The wild ${p2current.id} hit 3 times and is now confused`);
                    break;
                }
            case "Leer":
            case "Tail-whip":
                if(turn % 2 == 1){
                    
                    p2current.stages.defense -= 1;
                    if(p2current.stages.defense < -6){
                        p2current.stages.defense = -6;
                        stageQuote += `The wild ${p2current.id}'s Defense won't go lower\n`;
                    } else{
                        stageQuote += `The wild ${p2current.id}'s Defense fell\n`;
                    }
                    break;
                } else {
                    
                    p1current.stages.defense -= 1;
                    if(p1current.stages.defense < -6){
                        p1current.stages.defense = -6;
                        stageQuote += `Your ${p1current.id}'s Defense won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Defense fell\n`;
                    }
                    
                    break;
                    
                }
            case "Poison-sting":
                let isPoisoned = nonVolitileCheck(p1current, p2current, turn, 30, ["Poison", "Steel"], thread);
                if(isPoisoned && turn % 2 == 1){
                    p2current.statusMap.poisoned = true;
                    thread.send(`The wild ${p2current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(isPoisoned && turn % 2 == 0){
                    p1current.statusMap.poisoned = true;
                    thread.send(`Your ${p1current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Twineedle":
                let Poisoned = nonVolitileCheck(p1current, p2current, turn, 30, ["Poison", "Steel"], thread);
                if(Poisoned && turn % 2 == 1){
                    p2current.statusMap.poisoned = true;
                    thread.send(`The wild ${p2current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn) + damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else if(Poisoned && turn % 2 == 0){
                    p1current.statusMap.poisoned = true;
                    thread.send(`Your ${p1current.id} has been poisoned.`);
                    damage = damageFormula(moveDetails, p1current, p2current, turn) + damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn) + damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Growl":
                if(turn % 2 == 1){
                    
                    p2current.stages.attack -= 1;
                    if(p2current.stages.attack < -6){
                        p2current.stages.attack = -6;
                        stageQuote += `The wild ${p2current.id}'s Attack won't go lower\n`;
                    } else{
                        stageQuote += `The wild ${p2current.id}'s Attack fell\n`;
                    }
                    break;
                } else {
                    
                    p1current.stages.attack -= 1;
                    if(p1current.stages.attack < -6){
                        p1current.stages.attack = -6;
                        stageQuote += `Your ${p1current.id}'s Attack won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Attack fell\n`;
                    }
                    
                    break;
                    
                }
            case "Flash":
                if(turn % 2 == 1){
                    
                    p2current.stages.accuracy -= 1;
                    if(p2current.stages.accuracy < -6){
                        p2current.stages.accuracy = -6;
                        stageQuote += `The wild ${p2current.id}'s Accuracy won't go lower\n`;
                    } else{
                        stageQuote += `The wild ${p2current.id}'s Accuracy fell\n`;
                    }
                    break;
                } else {
                    
                    p1current.stages.accuracy -= 1;
                    if(p1current.stages.accuracy < -6){
                        p1current.stages.accuracy = -6;
                        stageQuote += `Your ${p1current.id}'s Accuracy won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Accuracy fell\n`;
                    }
                    
                    break;
                    
                }
            case "Mud-slap":
                if(turn % 2 == 1){
                    
                    p2current.stages.accuracy -= 1;
                    if(p2current.stages.accuracy < -6){
                        p2current.stages.accuracy = -6;
                        stageQuote += `The wild ${p2current.id}'s Accuracy won't go lower\n`;
                    } else{
                        stageQuote += `The wild ${p2current.id}'s Accuracy fell\n`;
                    }
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                } else {
                    
                    p1current.stages.accuracy -= 1;
                    if(p1current.stages.accuracy < -6){
                        p1current.stages.accuracy = -6;
                        stageQuote += `Your ${p1current.id}'s Accuracy won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Accuracy fell\n`;
                    }
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                    
                }
            case "Sing":
            case "Hypnosis":
            case "Sleep-powder":
            case "Lovely-kiss":
            case "Spore":
                let isSleep = nonVolitileCheck(p1current, p2current, turn, 100, [], thread);
                if(isSleep && turn % 2 == 1){
                    p2current.statusMap.sleep = true;
                    p2current.statusMap.sleepTurns = randomIntFromInterval(1,5);
                    thread.send(`The wild ${p2current.id} has been put to sleep.`);
                    
                    break;
                } else if(isSleep && turn % 2 == 0){
                    p1current.statusMap.sleep = true;
                    p1current.statusMap.sleepTurns = randomIntFromInterval(1,5);
                    thread.send(`Your ${p1current.id} has been put to sleep.`);
                    
                    break;
                } else {
                    
                    thread.send("The move failed");
                    break;
                }
            case "Supersonic":
            case "Confuse-ray":
                if(turn % 2 == 1){
                    if(p2current.statusMap.confusion == false){
                        p2current.statusMap.confusion = true;
                        p2current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                    
                    
                        stageQuote += `The wild ${p2current.id} is now confused\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id} is already confused\n`;
                    }
                    
                    break;
                } else {
                    
                    if(p1current.statusMap.confusion == false){
                        p1current.statusMap.confusion = true;
                        p1current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                    
                    
                        stageQuote += `Your ${p1current.id} is now confused\n`;
                    } else {
                        stageQuote += `Your ${p1current.id} is already confused\n`;
                    }
                    break;
                    
                }
            case "Sonic-boom":
                if(turn % 2 == 1){
                    if(p2current.types.includes("Ghost")){
                        damage = 0;
                    } else {
                        damage = 20;
                    }
                    break;
                } else {
                    if(p1current.types.includes("Ghost")){
                        damage = 0;
                    } else {
                        damage = 20;
                    }
                    break;
                }
            case "Acid":
                let acidCheck = Math.round(Math.random() * 100);
                
                if(turn % 2 == 1){
                    if(acidCheck < 10){
                        p2current.stages.defense -= 1;
                        if(p2current.stages.defense < -6){
                            p2current.stages.defense = -6;
                            stageQuote += `The wild ${p2current.id}'s Defense won't go lower\n`;
                        } else{
                            stageQuote += `The wild ${p2current.id}'s Defense fell\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                } else {
                    if(acidCheck < 10){
                    p1current.stages.defense -= 1;
                    if(p1current.stages.defense < -6){
                        p1current.stages.defense = -6;
                        stageQuote += `Your ${p1current.id}'s Defense won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Defense fell\n`;
                    }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                    
                }
            case "Psybeam":
            case "Confusion":
                let psybeamCheck = Math.round(Math.random() * 100);
                
                if(turn % 2 == 1){
                    if(psybeamCheck < 10){
                        if(p2current.statusMap.confusion == false){
                            p2current.statusMap.confusion = true;
                            p2current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                        
                        
                            stageQuote += `The wild ${p2current.id} is now confused\n`;
                        } else {
                            stageQuote += `The wild ${p2current.id} is already confused\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                } else {
                    if(psybeamCheck < 10){
                        if(p1current.statusMap.confusion == false){
                            p1current.statusMap.confusion = true;
                            p1current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                        
                        
                            stageQuote += `Your ${p1current.id} is now confused\n`;
                        } else {
                            stageQuote += `Your ${p1current.id} is already confused\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                    
                }
            case "Aurora-beam":
                let bubblebeamCheck = Math.round(Math.random() * 100);
                
                if(turn % 2 == 1){
                    if(bubblebeamCheck < 10){
                        p2current.stages.attack -= 1;
                        if(p2current.stages.attack < -6){
                            p2current.stages.attack = -6;
                            stageQuote += `The wild ${p2current.id}'s Attack won't go lower\n`;
                        } else{
                            stageQuote += `The wild ${p2current.id}'s Attack fell\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                } else {
                    if(bubblebeamCheck < 10){
                    p1current.stages.attack -= 1;
                    if(p1current.stages.attack < -6){
                        p1current.stages.attack = -6;
                        stageQuote += `Your ${p1current.id}'s Attack won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Attack fell\n`;
                    }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                    
                }
            case "Seismic-toss":
            case "Night-shade":
                if(turn % 2 == 1){
                    if(p2current.types.includes("Ghost")){
                        damage = 0;
                    } else {
                        damage = p1current.level;
                    }
                    break;
                } else {
                    if(p1current.types.includes("Ghost")){
                        damage = 0;
                    } else {
                        damage = p2current.level;
                    }
                    break;
                }
            case "Mimic":
            case "Leech-seed":
                stageQuote = "NOT IMPLEMENTED YET SORRY";
                break;
            case "Stun-spore":
            case "Thunder-wave":
            case "Glare":
                let isStun = nonVolitileCheck(p1current, p2current, turn, 100, ["Electric"], thread);
                
                if(isStun && turn % 2 == 1){

                    p2current.statusMap.paralyzed = true;
                    thread.send(`The wild ${p2current.id} has been paralyzed.`);
                    
                    break;
                } else if(isStun && turn % 2 == 0){
                    p1current.statusMap.paralyzed = true;
                    thread.send(`Your ${p1current.id} has been paralyzed.`);
                    
                    break;
                } else {
                    thread.send("The move failed");
                        break;
                    
                }
            case "Dragon-rage":
                damage = 40;
                break;
            case "Toxic":

                let isToxic = nonVolitileCheck(p1current, p2current, turn, 30, ["Poison", "Steel"], thread);
                if(isToxic && turn % 2 == 1){

                    p2current.statusMap.poisoned = true;
                    thread.send(`The wild ${p2current.id} has been poisoned.`);
                    
                    break;
                } else if(isToxic && turn % 2 == 0){
                    p1current.statusMap.poisoned = true;
                    thread.send(`Your ${p1current.id} has been poisoned.`);
                    
                    break;
                } else {
                    thread.send("The move failed");
                        break;
                    
                }
            case "Poison-powder":
            case "Poison-gas":
                let isPisonStuff = nonVolitileCheck(p1current, p2current, turn, 100, ["Poison", "Steel"], thread);
                if(isPisonStuff && turn % 2 == 1){

                    p2current.statusMap.poisoned = true;
                    thread.send(`The wild ${p2current.id} has been poisoned.`);
                    
                    break;
                } else if(isPisonStuff && turn % 2 == 0){
                    p1current.statusMap.poisoned = true;
                    thread.send(`Your ${p1current.id} has been poisoned.`);
                    
                    break;
                } else {
                    thread.send("The move failed");
                        break;
                    
                }
            case "Psychic":
                let psychicCheck = Math.round(Math.random() * 100);
                
                if(turn % 2 == 1){
                    if(psychicCheck < 10){
                        p2current.stages.specialDefense -= 1;
                        if(p2current.stages.specialDefense < -6){
                            p2current.stages.specialDefense = -6;
                            stageQuote += `The wild ${p2current.id}'s Special Defense won't go lower\n`;
                        } else{
                            stageQuote += `The wild ${p2current.id}'s Special Defense fell\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                } else {
                    if(psychicCheck < 10){
                    p1current.stages.specialDefense -= 1;
                    if(p1current.stages.specialDefense < -6){
                        p1current.stages.specialDefense = -6;
                        stageQuote += `Your ${p1current.id}'s Special Defense won't go lower\n`;
                    } else{
                        stageQuote += `Your ${p1current.id}'s Special Defense fell\n`;
                    }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                    
                }
            case "Screech":
                if(turn % 2 == 1){
                    p2current.stages.defense -= 2;
                    if(p2current.stages.defense < -6){
                        p2current.stages.defense = -6;
                        stageQuote += `The wild ${p2current.id}'s Defense won't go lower!\n`;
                    } else {
                        stageQuote += `The wild ${p2current.id}'s Defense sharply fell!\n`;
                    }
                    break;
                } else {
                    p1current.stages.defense -= 2;
                    if(p1current.stages.defense < -6){
                        p1current.stages.defense = -6;
                        stageQuote += `Your ${p1current.id}'s Defense won't go lower!\n`;
                    } else {
                        stageQuote += `Your ${p1current.id}'s Defense sharply fell!\n`;
                    }
                    break;
                }
            case "Absorb":
            case "Mega-drain":
            case "Leech-life":
            case "Giga-drain":
                damage = damageFormula(moveDetails, p1current, p2current, turn);
                if(turn % 2 == 1){
                    let healAmount = 0;
                    if(damage == 1){
                        healAmount = 1;
                    } else {
                        healAmount = Math.floor(damage/2);
                    }
                    
                    
                    for (let j = 0; j < p1party.length; j++){ //updates health for the current pokemon out
                        if (p1current.id === p1party[j].id){
                            p1party[j].currentHealth = p1party[j].currentHealth + healAmount;
                            let total = p1party[j].currentHealth + healAmount;  
                            if(total > p1party[j].health){
                                p1party[j].currentHealth = p1party[j].health;
                            }
                        }
                    }
                    stageQuote += `Your ${p1current.id} healed for ${healAmount} hp\n`;
                    break;
                } else {
                    let healAmount = 0;
                    if(damage == 1){
                        healAmount = 1;
                    } else {
                        healAmount = Math.floor(damage/2);
                    }
                    
                    for (let j = 0; j < p2party.length; j++){ //updates health for the current pokemon out
                        if (p2current.id === p2party[j].id){
                            p2party[j].currentHealth = p2party[j].currentHealth + healAmount;
                            let total = p2party[j].currentHealth + healAmount;  
                            if(total > p2party[j].health){
                                p2party[j].currentHealth = p2party[j].health;
                            }
                        }
                    }
                    stageQuote += `The wild ${p2current.id} healed for ${healAmount} hp\n`;
                    break;
                }
            case "Self-destruct":
            case "Explosion":
                if(turn % 2 == 1){
                    for (let j = 0; j < p1party.length; j++){
                        if (p1current.id === p2party[j].id){
                            p1party[j].currentHealth -= p1party[j].currentHealth;  
                        }
                    }
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                    
                } else {
                    for (let j = 0; j < p2party.length; j++){
                        if (p2current.id === p2party[j].id){
                            p2party[j].currentHealth -= p2party[j].currentHealth;
                        }
                    }
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                    
                }
            case "Dream-eater":
                damage = damageFormula(moveDetails, p1current, p2current, turn);
                if(turn % 2 == 1){
                    if(p2current.statusMap.sleep == true){
                    
                        let healAmount = 0;
                        if(damage == 1){
                            healAmount = 1;
                        } else {
                            healAmount = Math.floor(damage/2);
                        }
                        
                        
                        for (let j = 0; j < p1party.length; j++){ //updates health for the current pokemon out
                            if (p1current.id === p1party[j].id){
                                p1party[j].currentHealth += healAmount;
                                let total = p1party[j].currentHealth + healAmount;  
                                if(total > p1party[j].health){
                                    p1party[j].currentHealth = p1party[j].health;
                                }
                            }
                        }

                        stageQuote += `Your ${p1current.id} healed for ${healAmount} hp\n`;
                        break;
                    } else {
                        stageQuote += `You used Dream-eater but failed becuase the enemy isn't asleep\n`;
                        break;
                    }
                } else {
                    if(p1current.statusMap.sleep == true){
                        let healAmount = 0;
                        if(damage == 1){
                            healAmount = 1;
                        } else {
                            healAmount = Math.floor(damage/2);
                        }
                        
                        for (let j = 0; j < p2party.length; j++){ //updates health for the current pokemon out
                            if (p2current.id === p2party[j].id){
                                p2party[j].currentHealth += healAmount; 
                                let total =  p2party[j].currentHealth + healAmount; 
                                if(total > p2party[j].health){
                                    p2party[j].currentHealth = p2party[j].health;
                                }
                            }
                        }
                        stageQuote += `The wild ${p2current.id} healed for ${healAmount} hp\n`;
                        break;
                    } else {
                        stageQuote += `The enemy used Dream-eater but failed becuase you aren't sleep\n`;
                        break;
                    }
                }
            case "Transform":
            case "Substitute":
                stageQuote += "THIS MOVE DOESN'T WORK.  SORRY\n";
                break;
            case "Dizzy-punch":
            case "Water-pulse":
                let dizzyCheck = Math.round(Math.random() * 100);
                
                if(turn % 2 == 1){
                    if(dizzyCheck < 20){
                        if(p2current.statusMap.confusion == false){
                            p2current.statusMap.confusion = true;
                            p2current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                        
                        
                            stageQuote += `The wild ${p2current.id} is now confused\n`;
                        } else {
                            stageQuote += `The wild ${p2current.id} is already confused\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                } else {
                    if(dizzyCheck < 20){
                        if(p1current.statusMap.confusion == false){
                            p1current.statusMap.confusion = true;
                            p1current.statusMap.confusionTurns = randomIntFromInterval(1, 5);
                        
                        
                            stageQuote += `Your ${p1current.id} is now confused\n`;
                        } else {
                            stageQuote += `Your ${p1current.id} is already confused\n`;
                        }
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    } else {
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                    }
                    
                    break;
                    
                }
            case "Psywave":
                let randomN = randomIntFromInterval(0, 10);
                if(turn % 2 == 1){
                    damage = Math.floor((p1current.level * (10* randomN + 50))/100);
                    if(damage == 0){
                        damage = 1;
                    }
                    break;
                } else {
                    damage = Math.floor((p2current.level * (10* randomN + 50))/100);
                    if(damage == 0){
                        damage = 1;
                    }
                    break;
                }
            case "Tri-attack":
                let tri1Check = nonVolitileCheck(p1current, p2current, turn, 20, ["Electric"], thread);
                let tri2Check = nonVolitileCheck(p1current, p2current, turn, 20, ["Fire"], thread);
                let tri3Check = nonVolitileCheck(p1current, p2current, turn, 20, ["Ice"], thread);
                if((tri1Check || tri2Check || tri3Check) && turn % 2 == 1){
                    if(tri1Check){
                        p2current.statusMap.paralysis = true;
                        thread.send(`The wild ${p2current.id} has been paralyzed.`);
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                        break;
                    } else if (tri2Check){
                        p2current.statusMap.burn = true;
                        thread.send(`The wild ${p2current.id} has been burned.`);
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                        break;
                    } else if (tri3Check){
                        p2current.statusMap.frozen = true;
                        thread.send(`The wild ${p2current.id} has been frozen.`);
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                        break;
                    }
                    
                } else if((tri1Check || tri2Check || tri3Check) && turn % 2 == 0){
                    if(tri1Check){
                        p1current.statusMap.paralysis = true;
                        thread.send(`Your ${p1current.id} has been paralyzed.`);
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                        break;
                    } else if (tri2Check){
                        p1current.statusMap.burn = true;
                        thread.send(`Your ${p1current.id} has been burned.`);
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                        break;
                    } else if (tri3Check){
                        p1current.statusMap.frozen = true;
                        thread.send(`Your ${p1current.id} has been frozen.`);
                        damage = damageFormula(moveDetails, p1current, p2current, turn);
                        break;
                    }
                } else {
                    
                    damage = damageFormula(moveDetails, p1current, p2current, turn);
                    break;
                }
            case "Super-fang":
                if (turn % 2 == 1){
                    damage = Math.floor(p2current.currentHealth/2);
                    if(damage == 0){
                        damage = 1;
                    }
                    break;
                } else {
                    damage = Math.floor(p1current.currentHealth/2);
                    if(damage == 0){
                        damage = 1;
                    }
                    break;
                }
            

            
            
            
                
            
                
                
                


            default:
                damage = damageFormula(moveDetails, p1current, p2current, turn);
        }

        
        
        
        if(turn % 2 == 1){ //p1 doing the dmg
            let statusArray = getStatus(p1current, p2current);
            if(stageQuote != "" && damage == 0){
                
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move}`)
                .setDescription(`${stageQuote}\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            } else if(stageQuote != "" && damage != 0){
                for (let j = 0; j < p2party.length; j++){
                    if (p2current.id === p2party[j].id){
                        p2party[j].currentHealth = p2party[j].currentHealth - damage;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
                .setDescription(`${stageQuote}\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            } else {
                for (let j = 0; j < p2party.length; j++){
                    if (p2current.id === p2party[j].id){
                        p2party[j].currentHealth = p2party[j].currentHealth - damage;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            }
            
        } else { //p2 doing the dmg
            let statusArray = getStatus(p1current, p2current);
            if(stageQuote != "" && damage == 0){
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move}`)
                .setDescription(`${stageQuote}\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            } else if(stageQuote != "" && damage != 0){
                for (let j = 0; j < p1party.length; j++){
                    if (p1current.id === p1party[j].id){
                        p1party[j].currentHealth = p1party[j].currentHealth - damage;  //this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} doing **${damage}** damage`)
                .setDescription(`${stageQuote}\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            } else {
                for (let j = 0; j < p1party.length; j++){
                    if (p1current.id === p1party[j].id){
                        p1party[j].currentHealth = p1party[j].currentHealth - damage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move} doing **${damage}** damage`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
            }
            
        }
        turn++;
        
        battle(p1party, p2party, p1current, p2current, thread, author, turn);
    } else {
        
        if(turn % 2 == 1){//p1 miss
            let statusArray = getStatus(p1current, p2current);
            if((moveDetails.move == "Jump-kick" || moveDetails.move == "High-jump-kick") && !missed){
                let crashDamage = Math.floor(damageFormula(moveDetails, p1current, p2current, turn)/2);
                for (let j = 0; j < p1party.length; j++){
                    if (p1current.id === p1party[j].id){
                        p1party[j].currentHealth = p1party[j].currentHealth - crashDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} but crashed and did ${crashDamage} dmg to itself`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else if(status.includes("frozen") && missed){
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} but is frozen solid`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else if(status.includes("paralysis") && missed){
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} but is paralyzed`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else if(status.includes("sleep") && missed){
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} but is asleep`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }  else if(status.includes("confusion") && missed){
                let randomConfusionNumber = randomIntFromInterval(85, 100);
                let confusionDamage = ((((2 * p1current.level / 5 + 2) * (p1current.attack) * 40 / (p1current.defense)) / 50) + 2) * 1 * 1 * randomConfusionNumber / 100;
                for (let j = 0; j < p1party.length; j++){
                    if (p1current.id === p1party[j].id){
                        p1party[j].currentHealth = p1party[j].currentHealth - confusionDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} hurt itself in its confusion doing ${confusionDamage} dmg`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else {
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`Your ${p1current.id} used ${moveDetails.move} but missed`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }
        } else {
            let statusArray = getStatus(p1current, p2current);
            if(moveDetails.move == "Jump-kick" && !missed){
                let crashDamage = Math.floor(damageFormula(moveDetails, p1current, p2current, turn)/2);
                for (let j = 0; j < p2party.length; j++){
                    if (p2current.id === p2party[j].id){
                        p2party[j].currentHealth = p2party[j].currentHealth - crashDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move} but crashed and did ${crashDamage} dmg to itself`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }
            else if(status.includes("frozen") && missed){
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move} but is frozen solid`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else if(status.includes("paralysis") && missed){
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move} but is paralyzed`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            } else if(status.includes("sleep") && missed){
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move} but is asleep`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }  else if(status.includes("confusion") && missed){
                let randomConfusionNumber = randomIntFromInterval(85, 100);
                let confusionDamage = ((((2 * p2current.level / 5 + 2) * (p2current.attack) * 40 / (p2current.defense)) / 50) + 2) * 1 * 1 * randomConfusionNumber / 100;
                for (let j = 0; j < p2party.length; j++){
                    if (p2current.id === p2party[j].id){
                        p2party[j].currentHealth = p2party[j].currentHealth - confusionDamage;//this does the dmg but some how it also updates the current BECAUSE REFERENCES.  im passing a reference to the party. its very cool
                    }
                }
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} hurt itself in its confusion doing ${confusionDamage} dmg`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`Your move missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nThe wild ${p2current.id} will now take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }else {//p2 miss
                
                const newEmbed = new EmbedBuilder()
                .setColor('#E76AA3')
                
                .setTitle(`The wild ${p2current.id} used ${moveDetails.move} but missed`)
                .setDescription(`Your ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nStatus': ${statusArray[0].join(", ")}\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nStatus': ${statusArray[1].join(", ")}`)
            
            
                thread.send({ embeds: [newEmbed] });
                turn++;
                //thread.send(`The wild ${p2current.id} missed\n----------------------------------\nYour ${p1current.id}'s health is: **${p1current.currentHealth}/${p1current.health}**\nThe wild ${p2current.id} health is: **${p2current.currentHealth}/${p2current.health}**\nIt is your turn to take action\n----------------------------------`);
                battle(p1party, p2party, p1current, p2current, thread, author, turn);
            }
        }
        
    }
}
function getStatus(p1current, p2current){
    let results = [];
    let p1status = [];
    let p2status = [];
    for(var key in p1current.statusMap) {
        if(key != 'sleepTurns' && key != 'confusionTurns'){
            if(p1current.statusMap[key]) p1status.push(key);
            
        }
    }
    if(p1status.length == 0) p1status.push("none");
    results.push(p1status);
    for(var key in p2current.statusMap) {
        if(key != 'sleepTurns' && key != 'confusionTurns'){
            if(p2current.statusMap[key]) p2status.push(key);
            
        }
    }
    if(p2status.length == 0) p2status.push("none");
    results.push(p2status);
    return results;
}
function nonVolitileCheck(p1current, p2current, turn, chance, immuneType, thread){
    let results = false;
    let p1type = maids.find(function(item) { return item.id.toLowerCase() == p1current.id.toLowerCase()}).types;
    let p2type = maids.find(function(item) { return item.id.toLowerCase() == p2current.id.toLowerCase()}).types;
    if(turn % 2 == 1){ //p1 attacking p2
        let p2status = [];
        for(var key in p2current.statusMap) {
            if(key != 'sleepTurns' && key != 'confusionTurns' && key != 'confusion'){
                if(p2current.statusMap[key]) p2status.push(key);
                
            }
        }
        let affect = false;
        for(let s = 0; s < immuneType.length; s++){
            if(p2type.includes(immuneType[s])){
                affect = true;
            }
        }
        if(affect){
            results = false;
            
        } else {
            let amountCheck = Math.floor(Math.random() * 100);
            
            if (amountCheck < chance){
                if(p2status.length > 0){
                    thread.send(`The wild ${p2current.id} already has a status.`);
                    results = false;
                } else {
                    results = true;
                }
                
            } else {
                results = false;
            }
        }
    } else { //p2 attacking p1
        let p1status = [];
        for(var key in p1current.statusMap) {
            if(key != 'sleepTurns' && key != 'confusionTurns' && key != 'confusion'){
                if(p1current.statusMap[key]) p1status.push(key);
                
            }
        }
        let affect = false;
        for(let s = 0; s < immuneType.length; s++){
            if(p1type.includes(immuneType[s])){
                affect = true;
            }
        }
        if(affect || p1status.length > 0){
            results = false;
        } else {
            let amountCheck = Math.floor(Math.random() * 100);
            
            if (amountCheck < chance){ 
                if(p1status.length > 0){
                    thread.send(`Your ${p1current.id} already has a status.`);
                    results = false;
                } else {
                    results = true;
                }
                
                
            } else {
                results = false;
            }
        }
    }
    return results;
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
        if(p1current.statusMap.burned){
            return Math.floor(d / 2);
        } else{    
            return Math.floor(d);
        }
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
            
        if(p2current.statusMap.burned){
            return Math.floor(d / 2);
        } else{    
            return Math.floor(d);
        }

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
            accuracy: 0
        };
        p1party[d]["usedInBattle"] = false;
    }
    let p1current = p1party[0];
    p1party[0].usedInBattle = true;

    
    let p2party =[];
    p2party.push(boss);
    // let p2party = [];
    
    // for (let i = 0; i < bosses.length; i++){
    //     if (boss === bosses[i].id){
    //         p2party = bosses[i].units;
            
    //     }
    // }
    // let p2current = p2party[0];
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
async function setExperienceAndLevel(finalLevel, finalXP, evMap, location, ID, status, stats){
   
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
async function setEVsForMaxLevel(evMap, location, ID, status, stats){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
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
async function setStatusMap(location, status, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $set: {
                    ["maids." + location + ".statusMap"]: status,
                    
                }
                
            }
            
        );

    } catch(err){
        console.log(err);
    }
}
async function addCoins(amount, ID){
    try {
        await playerModel.findOneAndUpdate(
            {
                userID: ID
            },
            {
                $inc: {
                    coins: amount,
                    
                }
                
            }
            
        );

    } catch(err){
        console.log(err);
    }
}
