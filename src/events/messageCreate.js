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

    const clientMember = message.guild.members.resolve(message.client.user);

    const regex = new RegExp(`@${clientMember.displayName}\\s?`, "g");
    const content = message.cleanContent.replace(regex, "").trim();

    const gpt = new GPTClient();

    const response = await gpt.query(content);

    const escaped = escapeMarkdown(response, {
      codeBlock: false,
      inlineCode: false,
    });

    message.reply({ content: escaped, allowedMentions: { repliedUser: false } });
  },
};
