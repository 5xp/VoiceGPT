const { SlashCommandBuilder, bold, channelMention } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const VoiceClient = require("../VoiceClient");
const TikTokTTS = require("../TikTokTTS");

function constructEmbed(listeningIds) {
  const embed = new EmbedBuilder().setTitle("Click the button below to toggle listening.").setColor("Blurple");

  // embed description format: Responding to: @user1, @user2, @user3...
  const listeningIdsString = [...listeningIds].map(id => `<@${id}>`).join(", ");
  embed.setDescription(`Responding to: ${listeningIdsString}`);

  return embed;
}

function constructComponents() {
  const recordButton = new ButtonBuilder()
    .setCustomId("record")
    .setLabel("Toggle Listening")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(recordButton);

  return [row];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins the voice channel you are in.")
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName("voice")
        .setDescription("The voice to use.")
        .setRequired(false)
        .addChoices(...TikTokTTS.voiceStringOptionChoices),
    ),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: "You need to be in a voice channel to use this command.", ephemeral: true });
    }

    await interaction.deferReply();

    let voiceClient = interaction.client.voiceClients.get(interaction.guildId);

    if (!voiceClient) {
      voiceClient = new VoiceClient(interaction.client);
      interaction.client.voiceClients.set(interaction.guildId, voiceClient);
    }

    try {
      await voiceClient.connectToChannel(voiceChannel);
      voiceClient.startListeningToUser(interaction.user.id);
    } catch (error) {
      console.warn(error);
      return interaction.followUp("Failed to join voice channel within 20 seconds, please try again later.");
    }

    const voiceValue = interaction.options.getString("voice");

    if (voiceValue) {
      voiceClient.tiktok.setVoice(voiceValue);
    }

    await interaction.editReply({
      content: bold(`✅ Joined ${channelMention(voiceChannel.id)}`),
      embeds: [constructEmbed(voiceClient.listening)],
      components: constructComponents(),
    });

    const collectorFilter = i => i.customId === "record";
    const collector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter });

    collector.on("collect", async i => {
      if (voiceClient.listening.has(i.user.id)) {
        voiceClient.stopListeningToUser(i.user.id);
        i.reply({ content: "Stopped listening.", ephemeral: true });
      } else {
        voiceClient.startListeningToUser(i.user.id);
        i.reply({ content: "Started listening.", ephemeral: true });
      }

      interaction.editReply({ embeds: [constructEmbed(voiceClient.listening)] });
    });
  },
};
