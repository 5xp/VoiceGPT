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
  EndBehaviorType,
} = require("@discordjs/voice");
const GPTClient = require("./GPTClient");
const { existsSync, mkdirSync } = require("node:fs");
const prism = require("prism-media");
const spawn = require("node:child_process").spawn;

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
      fileName = await this.createListeningStream(this.receiver, userId);

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

  createListeningStream(receiver, userId) {
    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 200,
      },
    });

    const decoder = new prism.opus.Decoder({
      frameSize: 960,
      channels: 1,
      rate: 48000,
    });

    if (!existsSync("./recordings")) {
      mkdirSync("./recordings");
    }

    const fileName = `./recordings/${Date.now()}-${userId}.wav`;

    const ffmpegCommand = `-f s16le -ar 48000 -ac 1 -i pipe:0 -f wav -ar 16000 ${fileName}`.split(" ");
    const ffmpeg = spawn("ffmpeg", ffmpegCommand);

    opusStream.pipe(decoder).pipe(ffmpeg.stdin);

    return new Promise((resolve, reject) => {
      ffmpeg.on("close", code => {
        if (code === 0) {
          // console.log(`✅ Recorded ${fileName}`);
          resolve(fileName);
        } else {
          // console.warn(`❌ Error recording file ${fileName} - code ${code}`);
          reject(`ffmpeg process closed with code ${code}`);
        }
      });
    });
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
