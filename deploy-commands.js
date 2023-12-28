import { REST, Routes } from 'discord.js';
import config from "./config.json" assert { type: 'json' }
import fs from 'fs';
import path from 'path';
import { supabase } from './libs/database.js';

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join('commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import("./" + filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON())
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

LoadCommandsToGuild(config.guildId, commands)

// and deploy your commands!

async function LoadCommandsToGuild (guildId, commands) {		

		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);
	
			// The put method is used to fully refresh all commands in the guild with the current set
			console.log(`Refreshing commands for guild ${guildId}`)
			const data = await rest.put(
				Routes.applicationGuildCommands(config.clientId, guildId),
				{ body: commands },
			);
	
			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}

}