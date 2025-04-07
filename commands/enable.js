import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import fs from "fs";

// 🔁 Load channels from JSON
let enabledChannels = new Set();
const filePath = "./enabledChannels.json";

try {
  const rawData = fs.readFileSync(filePath);
  const channelIds = JSON.parse(rawData);
  enabledChannels = new Set(channelIds);
} catch (err) {
  console.warn("⚠️ Could not load enabled channels:", err);
}

function saveEnabledChannels() {
  fs.writeFileSync(filePath, JSON.stringify([...enabledChannels], null, 2));
}

export { enabledChannels };

export default {
  data: new SlashCommandBuilder()
    .setName("enable")
    .setDescription("Enable Clappy in this channel (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channelId = interaction.channel.id;

    // Optional: double-check if the user has admin perms (if you're paranoid)
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "🛑 Only admins can summon this chaotic bitch 😤",
        ephemeral: true,
      });
    }

    if (enabledChannels.has(channelId)) {
      await interaction.reply({
        content: "💬 Clappy already slaps in this channel!",
        ephemeral: true,
      });
    } else {
      enabledChannels.add(channelId);
      saveEnabledChannels();
      await interaction.reply({
        content:
          "✅ Clappy is now active in this channel. Time to slap some souls! 😈",
        ephemeral: true,
      });
    }
  },
};
