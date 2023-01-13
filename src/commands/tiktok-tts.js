const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const TikTokTTS = require("../TikTokTTS");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tiktok-tts")
    .setDescription("Uses TikTok's TTS to speak a message.")
    .addStringOption(option => option.setName("message").setDescription("The message to speak.").setRequired(true))
    .addStringOption(option =>
      option
        .setName("voice")
        .setDescription("The voice to use.")
        .setRequired(true)
        .addChoices(...TikTokTTS.voiceStringOptionChoices),
    )
    .addBooleanOption(option =>
      option.setName("ephemeral").setDescription("Whether the response should be ephemeral.").setRequired(false),
    ),
  async execute(interaction) {
    const message = interaction.options.getString("message");
    const voice = interaction.options.getString("voice");
    const ephemeral = interaction.options.getBoolean("ephemeral") ?? false;

    const base64 = await TikTokTTS.getTTSBase64(voice, message);
    const buffer = Buffer.from(base64, "base64");

    const attachment = new AttachmentBuilder(buffer, { name: "tts.mp3" });

    await interaction.reply({ files: [attachment], ephemeral });
  },
};
