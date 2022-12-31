const createListeningStream = require("../voice/createListeningStream");
const transcribe = require("../voice/transcribe");
const textToSpeech = require("../voice/textToSpeech");
const fs = require("node:fs");
const { createAudioResource, StreamType, entersState, AudioPlayerStatus } = require("@discordjs/voice");

function tryDelete(fileName) {
  fs.unlink(fileName, () => {
    // Ignore error
  });
}

function deleteFiles(fileName) {
  tryDelete(fileName);
  tryDelete(`${fileName}.wav`);
  tryDelete(`${fileName}.aiff`);
}

function playSound(audioPlayer, filename) {
  const resource = createAudioResource(filename, {
    inputType: StreamType.Arbitrary,
  });

  audioPlayer.play(resource);

  return entersState(audioPlayer, AudioPlayerStatus.Playing, 5000);
}

async function speakingStart(receiver, userId, user, gptClient, audioPlayer) {
  const displayName = user.username;
  let fileName;
  try {
    fileName = await createListeningStream(receiver, userId);

    const transcribeNow = Date.now();
    const transcription = await transcribe(fileName);
    const transcribeTime = Date.now() - transcribeNow;

    if (transcription.length === 0) {
      return;
    }

    console.log(`🗣 ${displayName}: ${transcription} (${transcribeTime}ms)`);

    const queryNow = Date.now();
    const response = await gptClient.query(displayName, transcription);
    const queryTime = Date.now() - queryNow;

    const ttsNow = Date.now();
    await textToSpeech(response, `${fileName}.aiff`);
    const ttsTime = Date.now() - ttsNow;

    console.log(`🤖 ${gptClient.aiName}: ${response} (query: ${queryTime}ms, tts: ${ttsTime}ms)`);
    await playSound(audioPlayer, `${fileName}.aiff`);
  } catch (error) {
    console.warn(error);
  } finally {
    deleteFiles(fileName);
  }
}

module.exports = speakingStart;
