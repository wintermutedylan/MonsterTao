const { REST, Routes } = require('discord.js');
const { clientId, guildId} = require('./units/config.json');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'interactioncommands');
const commandFolders = fs.readdirSync(foldersPath);


	// Grab all the command files from the commands directory you created earlier
	const interaction_command_files = fs.readdirSync('./interactioncommands/').filter(file => file.endsWith('.js'));

    for(const interactfile of interaction_command_files){
        const interactcommand = require(`./interactioncommands/${interactfile}`);
        if ('data' in interactcommand && 'execute' in interactcommand) {
			commands.push(interactcommand.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ./interactioncommands/${interactfile} is missing a required "data" or "execute" property.`);
		}
    }
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	


// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();