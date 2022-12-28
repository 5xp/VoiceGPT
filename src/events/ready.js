const { Events } = require("discord.js");

module.exports = client => {
  client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });
};
