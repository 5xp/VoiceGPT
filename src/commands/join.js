const { SlashCommandBuilder } = require("discord.js");
const VoiceClient = require("../voice/VoiceClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins the voice channel you are in.")
    .setDMPermission(false)
    .addStringOption(option => option.setName("id").setDescription("Voice channel ID to join.").setRequired(false)),
  async execute(interaction) {
    let voiceChannel;

    const channelId = interaction.options.getString("id");
    if (channelId) {
      const channel = interaction.client.channels.cache.get(channelId);
      if (channel.isVoiceBased?.()) {
        voiceChannel = channel;
      }
    } else {
      voiceChannel = interaction.member.voice.channel;
    }

    if (!voiceChannel) {
      return interaction.reply({ content: "You need to be in a voice channel to use this command.", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const voiceClient = new VoiceClient(interaction.client);
      await voiceClient.connectToChannel(voiceChannel);
      console.log("🔊 Joined voice channel.");
    } catch (error) {
      console.warn(error);
      return interaction.followUp("Failed to join voice channel within 20 seconds, please try again later.");
    }

    await interaction.followUp("Ready!");
  },
};
