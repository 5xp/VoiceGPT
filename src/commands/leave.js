const { getVoiceConnection } = require("@discordjs/voice");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("leave").setDescription("Leaves the voice channel.").setDMPermission(false),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
      return interaction.reply({ content: "Not in a voice channel.", ephemeral: true });
    }

    connection.destroy();
    interaction.reply({ content: "Left the voice channel.", ephemeral: true });
  },
};
