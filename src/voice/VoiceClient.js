const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);
const fs = require("node:fs");
const {
  createAudioPlayer,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
} = require("@discordjs/voice");
const createListeningStream = require("./createListeningStream");
const GPTClient = require("./GPTClient");

class VoiceClient {
  constructor(client) {
    this.client = client;
    this.connection;
    this.receiver;
    this.audioPlayer = createAudioPlayer();
    this.gpt = new GPTClient();
  }

  async connectToChannel(channel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      selfDeaf: false,
      selfMute: false,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 20e3);
      this.receiver = this.connection.receiver;
      this.connection.subscribe(this.audioPlayer);
      this.listen();
      return this.connection;
    } catch (error) {
      this.connection.destroy();
      console.warn(error);
    }
  }

  async speakingStart(userId, user) {
    const displayName = user.username;
    let fileName;
    try {
      fileName = await createListeningStream(this.receiver, userId);

      const transcribeNow = Date.now();
      const transcription = await this.transcribe(fileName);
      const transcribeTime = Date.now() - transcribeNow;

      if (transcription.length === 0) {
        return;
      }

      console.log(`🗣 ${displayName}: ${transcription} (${transcribeTime}ms)`);

      const queryNow = Date.now();
      const response = await this.gpt.query(displayName, transcription);
      const queryTime = Date.now() - queryNow;

      const ttsNow = Date.now();
      await this.textToSpeech(response, `${fileName}.aiff`);
      const ttsTime = Date.now() - ttsNow;

      console.log(`🤖 ${this.gpt.aiName}: ${response} (query: ${queryTime}ms, tts: ${ttsTime}ms)`);
      await this.playSound(fileName);
    } catch (error) {
      console.warn(error);
    } finally {
      this.deleteFiles(fileName);
    }
  }

  tryDelete(fileName) {
    fs.unlink(fileName, () => {
      // Ignore error
    });
  }

  deleteFiles(fileName) {
    this.tryDelete(fileName);
    this.tryDelete(`${fileName}.aiff`);
  }

  async playSound(fileName) {
    const resource = createAudioResource(`${fileName}.aiff`, {
      inputType: StreamType.Arbitrary,
    });

    this.audioPlayer.play(resource);

    return entersState(this.audioPlayer, AudioPlayerStatus.Playing, 5000);
  }

  listen() {
    this.receiver.speaking.on("start", userId => {
      const user = this.client.users.cache.get(userId);
      this.speakingStart(userId, user);
    });
  }

  async transcribe(fileName) {
    try {
      const { stdout } = await exec(`./bin/whisper -m ./bin/model-base.en.bin -f ${fileName} -nt`);
      return stdout.trim();
    } catch (error) {
      console.warn(error);
    }
  }

  async textToSpeech(message, fileName) {
    try {
      await exec(`say "${message}" -o ${fileName}`);
    } catch (error) {
      console.warn(error);
    }
  }
}

module.exports = VoiceClient;
