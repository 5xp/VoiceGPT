const { createWriteStream, existsSync, mkdirSync } = require("node:fs");
const { pipeline } = require("node:stream");
const { EndBehaviorType } = require("@discordjs/voice");
const prism = require("prism-media");

function createListeningStream(receiver, userId) {
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 100,
    },
  });

  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 2,
      sampleRate: 48000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });

  if (!existsSync("./recordings")) {
    mkdirSync("./recordings");
  }

  const filename = `./recordings/${Date.now()}-${userId}.ogg`;

  const out = createWriteStream(filename);

  // console.log(`👂 Started recording ${filename}`);

  return new Promise((resolve, reject) => {
    pipeline(opusStream, oggStream, out, async err => {
      if (err) {
        // console.warn(`❌ Error recording file ${filename} - ${err.message}`);
        reject(err);
      } else {
        // console.log(`✅ Recorded ${filename}`);
        resolve(filename);
      }
    });
  });
}

module.exports = createListeningStream;
