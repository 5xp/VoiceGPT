const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("end-chat").setDescription("Ends the current chat.").setDMPermission(false),
  async execute(interaction) {
    const chatClient = interaction.client.chatClients.get(interaction.channelId);

    if (!chatClient) {
      return interaction.reply({ content: "There is no chat to end!", ephemeral: true });
    }

    if (chatClient.startedBy !== interaction.user.id) {
      return interaction.reply({ content: "You can't end a chat you didn't start!", ephemeral: true });
    }

    chatClient.messageCollector.stop();
    interaction.client.chatClients.delete(interaction.channelId);

    await interaction.reply("Chat ended!");
    interaction.channel.setArchived(true);
  },
};
