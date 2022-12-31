const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

async function oggToWav(filename) {
  return exec(`ffmpeg -i ${filename} -acodec pcm_s16le -ac 1 -ar 16000 ${filename}.wav`);
}

async function transcribe(filename) {
  try {
    await oggToWav(filename);
    const { stdout } = await exec(`./bin/whisper -m ./bin/model-base.en.bin -f ${filename}.wav -nt`);
    return stdout.trim();
  } catch (error) {
    console.warn(error);
  }
}

module.exports = transcribe;
