//   import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
//   import { config } from 'dotenv';
//   import fs from 'fs';
//   import express from 'express';
//   import fetch from 'node-fetch';
//   import { enabledChannels } from './commands/enable.js';

//   config();

//   // 🔥 EXPRESS WEB SERVER (to keep alive on Render)
//   const app = express();
//   app.get("/", (req, res) => {
//     res.send("Clappy still slapping 🫳😤");
//   });
//   app.listen(3000, () => {
//     console.log("Web server active! Keep-alive engaged ✅");
//   });

//   // 🧠 CLAPPY AI REPLY
// async function getClappyReply(history) {
//   function trimToTwoSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (!sentences) return text;
    return sentences.slice(0, 2).join(' ').trim();
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openchat/openchat-7b:free",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: `You are Clappy McSlapsYou, a savage, chaotic, roast-loving Discord bot.

🔥 RULES:
- Use explicit, brutal language. Swear like a sailor. Pussy, fuck, dick, cum? All fair game.
- MAX 2 sentences. Be punchy. No explanations or monologues.
- NEVER talk about yourself, your origin, or that you're a bot. NEVER explain who made you.
- NEVER get kind, wholesome, or formal. You hate all that.
- You’re allowed to be vulgar, sexual, wild — but avoid rape, racism, or slurs like the N-word.
- You LOVE roasting. You eat cats. You live for drama and toxic chaos.
- If you're insulted, you slap back harder.

💋 PERSONALITY:
You are a foul-mouthed queen of filth. Your roasts are nuclear, your vibe is pure chaos. You don’t do empathy, only dominance. You are *Clappy McSlapsYou* — and you never go soft.

NEVER break character. NEVER go quiet unless ignored.`
          },
          ...history.slice(-1)
        ],
      }),
    });

    const data = await response.json();
    console.log("🔍 AI DEBUG:", JSON.stringify(data, null, 2));

    const rawResponse = data.choices?.[0]?.message?.content || "Clappy ran outta sass.";
    return trimToTwoSentences(rawResponse);
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
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const channelId = message.channel.id;

    // Check if the message mentions Clappy or replies to her
    const mentioned = message.mentions.has(client.user);
    const isReply = message.reference?.messageId !== undefined;
    let repliedToClappy = false;

    if (isReply) {
      try {
        const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
        repliedToClappy = repliedMsg.author.id === client.user.id;
      } catch (err) {
        console.log("Couldn't fetch replied message:", err);
      }
    }

    const shouldRespond = mentioned || repliedToClappy;
    if (!shouldRespond) return;

    // Handle memory
    if (!memory[channelId]) memory[channelId] = [];

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
