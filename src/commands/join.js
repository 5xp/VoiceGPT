const { SlashCommandBuilder } = require("discord.js");
const VoiceClient = require("../voice/VoiceClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins the voice channel you are in.")
    .setDMPermission(false),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: "You need to be in a voice channel to use this command.", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const voiceClient = new VoiceClient(interaction.client);
      await voiceClient.connectToChannel(voiceChannel);
    } catch (error) {
      console.warn(error);
      return interaction.followUp("Failed to join voice channel within 20 seconds, please try again later.");
    }

    await interaction.followUp("Ready!");
  },
};
