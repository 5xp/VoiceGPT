const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer } = require("@discordjs/voice");
const speakingStart = require("../voice/speakingStart");
const GPTClient = require("../voice/GPTClient");

const player = createAudioPlayer();

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    selfDeaf: false,
    selfMute: false,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    return connection;
  } catch (error) {
    connection.destroy();
    console.warn(error);
  }
}

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
      const connection = await connectToChannel(voiceChannel);
      console.log("🔊 Joined voice channel.");

      connection.subscribe(player);
      const receiver = connection.receiver;

      const gpt = new GPTClient();

      receiver.speaking.on("start", userId => {
        speakingStart(receiver, userId, interaction.client.users.cache.get(userId), gpt, player);
      });
    } catch (error) {
      console.warn(error);
      return interaction.followUp("Failed to join voice channel within 20 seconds, please try again later.");
    }

    await interaction.followUp("Ready!");
  },
};
