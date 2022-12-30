const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection, joinVoiceChannel, entersState, VoiceConnectionStatus } = require("@discordjs/voice");
const speakingStart = require("../voice/speakingStart");

module.exports = {
  data: new SlashCommandBuilder().setName("join").setDescription("Joins the voice channel you are in."),
  async execute(interaction) {
    const { channel: voiceChannel } = interaction.member.voice;
    if (!voiceChannel) {
      return interaction.reply({ content: "You need to be in a voice channel to use this command.", ephemeral: true });
    }

    await interaction.deferReply();

    let connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        selfDeaf: false,
        selfMute: false,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
    }

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
      const receiver = connection.receiver;
      console.log("Joined voice channel.");

      receiver.speaking.on("start", userId => {
        speakingStart(receiver, userId, interaction.client.users.cache.get(userId));
      });
    } catch (error) {
      console.warn(error);
      return interaction.followUp("Failed to join voice channel within 20 seconds, please try again later.");
    }

    await interaction.followUp("Ready!");
  },
};
