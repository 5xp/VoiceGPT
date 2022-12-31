const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

async function aiffToWav(filename) {
  return exec(`ffmpeg -i ${filename} -c:a pcm_s16le ${filename}.wav`);
}

async function textToSpeech(message, filename) {
  try {
    await exec(`say "${message}" -o ${filename}`);
    await aiffToWav(filename);
  } catch (error) {
    console.warn(error);
  }
}

module.exports = textToSpeech;
