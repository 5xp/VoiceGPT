const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("view-conversation")
    .setDescription("View the ongoing conversation in the channel.")
    .setDMPermission(false),
  async execute(interaction) {
    const voiceClient = interaction.client.voiceClients.get(interaction.guildId);

    if (!voiceClient) {
      return interaction.reply({ content: "I'm not in a voice channel.", ephemeral: true });
    }

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: "You need to be in a voice channel to use this command.", ephemeral: true });
    }

    if (voiceChannel.id !== voiceClient.channelId) {
      return interaction.reply({
        content: "You need to be in the same voice channel as the bot to use this command.",
        ephemeral: true,
      });
    }

    const conversationHistory = voiceClient.gpt.conversationHistory;

    const embed = new EmbedBuilder()
      .setTitle("Conversation Log")
      .setColor("Blurple")
      .setDescription(codeBlock(conversationHistory.join("\n")));

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
