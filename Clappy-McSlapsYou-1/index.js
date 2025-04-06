import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import { getClappyReply } from './ai.js';
import express from "express";

config();

const app = express();
app.get("/", (req, res) => {
  res.send("Clappy still slapping 🫳😤");
});
app.listen(3000, () => {
  console.log("Web server active! Keep-alive engaged ✅");
});


// 👉 Enable proper intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // 🧠 This one’s spicy
  ],
});


// 🔁 Load Slash Commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

// ✅ On Ready
client.once('ready', () => {
  console.log(`👏 Clappy McSlapsYou is online as ${client.user.tag}`);
});

// 💬 Handle Slash Commands
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Oops! Clappy tripped over her own sass.', ephemeral: true });
  }
});

// 🧠 Memory (per channel)
const memory = {};

// 🔥 Handle Mentions / Replies to Clappy
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channelId = message.channel.id;
  if (!memory[channelId]) memory[channelId] = [];

  const mentioned = message.mentions.has(client.user);
  const isReply = message.type === 19 && message.reference;
  let repliedToClappy = false;

  if (isReply) {
    try {
      const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMsg.author.id === client.user.id) {
        repliedToClappy = true;
      }
    } catch (err) {
      console.log("Couldn't fetch replied message:", err);
    }
  }

  if (mentioned || repliedToClappy) {
    const promptHistory = [
      ...memory[channelId].slice(-6),
      { role: "user", content: message.content }
    ];

    const response = await getClappyReply(promptHistory);
    if (!response) return;

    await message.reply(response);

    memory[channelId].push({ role: "user", content: message.content });
    memory[channelId].push({ role: "assistant", content: response });
  }
});

// 🚀 Login
client.login(process.env.DISCORD_TOKEN);
