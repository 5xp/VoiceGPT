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
const TikTokTTS = require("./TikTokTTS");
const { existsSync, mkdirSync } = require("node:fs");
const prism = require("prism-media");
const spawn = require("node:child_process").spawn;
const { pathToWhisperExecutable, pathToWhisperModel, useSiriTTS } = require("../config/bot-config.json");

class VoiceClient {
  constructor(client) {
    this.client = client;
    this.connection;
    this.receiver;
    this.readyLock = false;
    this.audioPlayer = createAudioPlayer();
    this.gpt = new GPTClient();
    this.usingSiriTTS = useSiriTTS || false;
    this.listening = new Set();
    this.speaking = new Set();

    if (!this.usingSiriTTS) {
      this.tiktok = new TikTokTTS();
    }
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
    if (this.speaking.has(userId)) {
      return;
    }

    this.speaking.add(userId);

    const displayName = user.username;
    let fileName;

    try {
      fileName = await this.createListeningStream(this.receiver, userId);

      this.speaking.delete(userId);

      const transcription = await this.transcribe(fileName);

      if (transcription.length === 0) {
        return;
      }

      // Prevent multiple queries from running at the same time.
      // Prioritize the most recent non-empty transcription.
      if (this.readyLock) {
        return;
      }

      this.readyLock = true;

      const response = await this.gpt.query(displayName, transcription);

      if (this.usingSiriTTS) {
        await this.textToSpeech(response, `${fileName}.aiff`);
        await this.playSoundFromFile(`${fileName}.aiff`);
      } else {
        await this.tiktok.getTTS(response, `${fileName}.mp3`);
        await this.playSoundFromFile(`${fileName}.mp3`);
      }

      // Wait for the player to finish speech before processing more queries.
      this.unlockReadyLock();
    } catch (error) {
      console.warn(error);
    } finally {
      this.deleteFiles(fileName);
    }
  }

  async unlockReadyLock() {
    await entersState(this.audioPlayer, AudioPlayerStatus.Idle);
    this.readyLock = false;
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

    const ttsExtension = this.usingSiriTTS ? "aiff" : "mp3";
    this.tryDelete(`${fileName}.${ttsExtension}`);
  }

  async playSoundFromFile(fileName) {
    const resource = createAudioResource(fileName, {
      inputType: StreamType.Arbitrary,
    });

    this.audioPlayer.play(resource);

    return entersState(this.audioPlayer, AudioPlayerStatus.Playing, 5000);
  }

  listen() {
    this.receiver.speaking.on("start", userId => {
      const user = this.client.users.cache.get(userId);

      if (!this.listening.has(userId)) {
        return;
      }

      this.speakingStart(userId, user);
    });
  }

  startListeningToUser(userId) {
    this.listening.add(userId);
  }

  stopListeningToUser(userId) {
    this.listening.delete(userId);
  }

  async transcribe(fileName) {
    try {
      const { stdout } = await exec(`${pathToWhisperExecutable} -m ${pathToWhisperModel} -f ${fileName} -nt`);
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
