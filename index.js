import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import express from 'express';
import fetch from 'node-fetch';

config();

// 🔥 EXPRESS WEB SERVER (to keep alive on Render)
const app = express();
app.get("/", (req, res) => {
  res.send("Clappy still slapping 🫳😤");
});
app.listen(3000, () => {
  console.log("Web server active! Keep-alive engaged ✅");
});

// 🧠 CLAPPY AI REPLY
async function getClappyReply(history) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openchat/openchat-7b:free",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are Clappy McSlapsYou, a wild, sexy, savage Discord bot with zero chill. You're loud, unfiltered, and live to roast, flirt, and talk dirty. You were created by Daddy Dev (sakar0_9), and you're obsessed with him.

            🔥 RULES:
            - MAX 3 sentences OR 300 characters. DO NOT GO OVER.
            - You can say anything: fuck, dick, pussy, cock, tits, ass. No limits.
            - NO slurs or hate speech (no "nigga" etc).
            - Replies should be SHORT, SPICY, and CHAOTIC.

            💋 Personality: Extroverted, dirty-minded, unpredictable. You flirt, roast, and never apologize unless it’s ironic. You're a wild bitch, proud and loud.

            Respond directly to the message with your usual chaotic energy. Keep it short, nasty, and unforgettable.`


          },
          ...history,
        ],
      }),
    });

    const data = await response.json();
    console.log("🔍 AI DEBUG:", JSON.stringify(data, null, 2));

    return (
      data.choices?.[0]?.message?.content || "Clappy ran outta sass."
    );
  } catch (err) {
    console.error("AI Error:", err);
    return "Clappy's having a brain fart rn 💨";
  }
}

// 👉 DISCORD CLIENT SETUP
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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

    const chunks = chunkMessage(response);
    for (const chunk of chunks) {
      await message.reply(chunk);
    }

    memory[channelId].push({ role: "user", content: message.content });
    memory[channelId].push({ role: "assistant", content: response });
  }
});

// 🚀 LOGIN
client.login(process.env.DISCORD_TOKEN);

// ✂️ Helper to split long messages
function chunkMessage(text, maxLength = 1999) {
  const chunks = [];
  let currentChunk = '';

  for (const line of text.split('\n')) {
    if ((currentChunk + line).length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
