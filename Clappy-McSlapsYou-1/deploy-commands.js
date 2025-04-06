import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
config();
console.log('TOKEN?', process.env.DISCORD_TOKEN?.slice(0, 5));


const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('🔁 Refreshing application (/) commands...');

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );

  console.log('✅ Successfully reloaded commands.');
} catch (error) {
  console.error('❌ Error:', error);
}
