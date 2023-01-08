const { SlashCommandBuilder, bold, inlineCode } = require("discord.js");
const TikTokTTS = require("../TikTokTTS");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("change-voice")
    .setDescription("Change the voice of the bot in voice channel.")
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName("voice")
        .setDescription("The voice to use.")
        .setRequired(true)
        .addChoices(...TikTokTTS.voiceStringOptionChoices),
    ),
  async execute(interaction) {
    const voiceValue = interaction.options.getString("voice");
    const voiceClient = interaction.client.voiceClients.get(interaction.guildId);

    if (!voiceClient) {
      return interaction.reply({
        content: "I'm not in a voice channel.",
        ephemeral: true,
      });
    }

    if (voiceClient.usingSiriTTS) {
      return interaction.reply({
        content: "Voices are not supported when using Siri TTS!",
        ephemeral: true,
      });
    }

    voiceClient.tiktok.setVoice(voiceValue);

    const voiceName = TikTokTTS.getVoiceNameFromValue(voiceValue);
    interaction.reply(bold(`✅ Changed voice to ${inlineCode(voiceName)}`));
  },
};
