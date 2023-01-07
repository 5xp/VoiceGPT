const { SlashCommandBuilder, ThreadAutoArchiveDuration, escapeMarkdown } = require("discord.js");
const GPTClient = require("../GPTClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("new-chat")
    .setDescription("Start a new chat with the bot.")
    .setDMPermission(false),
  async execute(interaction) {
    if (interaction.channel.isThread()) {
      return interaction.reply({ content: "You can't start a new chat in a thread!", ephemeral: true });
    }

    const gpt = new GPTClient();

    let thread;

    try {
      thread = await interaction.channel.threads.create({
        name: `New chat with ${gpt.aiName}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      });

      interaction.reply({ content: "Chat started!", ephemeral: true });
    } catch (error) {
      console.warn(error);
      return interaction.reply({ content: "Couldn't create thread!", ephemeral: true });
    }

    try {
      if (thread.joinable) {
        await thread.join();
      }
    } catch (error) {
      console.warn(error);
      return interaction.reply({ content: "Couldn't join thread!", ephemeral: true });
    }

    const collectorFilter = message => message.author.bot === false;
    const messageCollector = await thread.createMessageCollector({
      filter: collectorFilter,
    });

    interaction.client.chatClients.set(thread.id, {
      gpt,
      messageCollector,
      startedBy: interaction.user.id,
    });

    messageCollector.on("collect", async message => {
      if (message.cleanContent.trim().length === 0) {
        return;
      }

      const response = await gpt.query(message.author.username, message.cleanContent);

      const escaped = escapeMarkdown(response, {
        codeBlock: false,
        inlineCode: false,
      });

      message.reply({ content: escaped, allowedMentions: { repliedUser: false } });
    });
  },
};
