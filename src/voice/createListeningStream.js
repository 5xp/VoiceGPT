const { existsSync, mkdirSync } = require("node:fs");
const { EndBehaviorType } = require("@discordjs/voice");
const prism = require("prism-media");
const spawn = require("node:child_process").spawn;

function createListeningStream(receiver, userId) {
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 100,
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

module.exports = createListeningStream;
