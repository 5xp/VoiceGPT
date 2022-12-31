const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

async function textToSpeech(message, filename) {
  try {
    await exec(`say "${message}" -o ${filename}`);
  } catch (error) {
    console.warn(error);
  }
}

module.exports = textToSpeech;
