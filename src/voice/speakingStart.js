const createListeningStream = require("../voice/createListeningStream");
const transcribe = require("../voice/transcribe");
const util = require("node:util");
const unlink = util.promisify(require("node:fs").unlink);

function deleteFiles(fileName) {
  try {
    unlink(fileName);
    unlink(`${fileName}.wav`);
  } catch {
    // Ignore error
  }
}

async function speakingStart(receiver, userId, user) {
  const displayName = user.username;
  let fileName;
  try {
    fileName = await createListeningStream(receiver, userId);
    const transcription = await transcribe(fileName);

    if (transcription.length === 0) {
      return;
    }

    console.log(`🗣 ${displayName}: ${transcription}`);
  } catch (error) {
    console.warn(error);
  } finally {
    deleteFiles(fileName);
  }
}

module.exports = speakingStart;
