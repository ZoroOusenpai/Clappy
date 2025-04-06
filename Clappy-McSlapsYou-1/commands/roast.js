import { SlashCommandBuilder } from 'discord.js';
import { getClappyReply } from '../ai.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Clappy roasts someone!')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Who deserves the roast?')
        .setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    await interaction.deferReply();

    const prompt = `Roast ${target.username} like you're a savage sassy Discord bot.`;

    const roast = await getClappyReply(prompt);

    await interaction.editReply({
      content: `🔥 **Clappy roasts ${target.username}:**\n${roast}`
    });
  }
};
