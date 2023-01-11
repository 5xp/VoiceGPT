const { Events, escapeMarkdown } = require("discord.js");
const GPTClient = require("../GPTClient");

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot) return;

    if (!message.mentions.has(message.client.user)) {
      return;
    }

    if (message.cleanContent.length === 0) {
      return;
    }

    const gpt = new GPTClient();

    const response = await gpt.query(message.cleanContent);

    const escaped = escapeMarkdown(response, {
      codeBlock: false,
      inlineCode: false,
    });

    message.reply(escaped);
  },
};
