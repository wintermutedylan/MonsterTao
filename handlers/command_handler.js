const fs = require('fs');

module.exports = (client, Discord) =>{
    const command_files = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

    for(const file of command_files){
        const command = require(`../commands/${file}`);
        if(command.name){
            client.commands.set(command.name, command);

        } else {
            continue;
        }
    }
    
    const interaction_command_files = fs.readdirSync('./interactioncommands/').filter(file => file.endsWith('.js'));

    for(const interactfile of interaction_command_files){
        const interactcommand = require(`../interactioncommands/${interactfile}`);
        if(interactcommand.data.name){
            client.interactioncommands.set(interactcommand.data.name, interactcommand);

        } else {
            continue;
        }
    }
}