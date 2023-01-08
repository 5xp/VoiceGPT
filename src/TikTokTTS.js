/* eslint-disable no-inline-comments */
const { tiktokSessionId } = require("../config/secrets.json");
const fetch = require("node-fetch");
const { writeFile } = require("node:fs");

const userAgent =
  "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)";
const cookie = `sessionid=${tiktokSessionId};`;

// All available voices
const voices = [
  // Disney voices
  "en_us_ghostface", // Ghost Face
  "en_us_chewbacca", // Chewbacca
  "en_us_c3po", // C3PO
  "en_us_stitch", // Stitch
  "en_us_stormtrooper", // Stormtrooper
  "en_us_rocket", // Rocket

  // English voices
  "en_au_001", // English AU - Female
  "en_au_002", // English AU - Male
  "en_uk_001", // English UK - Male 1
  "en_uk_003", // English UK - Male 2
  "en_us_001", // English US - Female (Int. 1)
  "en_us_002", // English US - Female (Int. 2)
  "en_us_006", // English US - Male 1
  "en_us_007", // English US - Male 2
  "en_us_009", // English US - Male 3
  "en_us_010", // English US - Male 4

  // Europe voices
  "fr_001", // French - Male 1
  "fr_002", // French - Male 2
  "de_001", // German - Female
  "de_002", // German - Male
  "es_002", // Spanish - Male

  // America voices
  "es_mx_002", // Spanish MX - Male
  "br_001", // Portuguese BR - Female 1
  "br_003", // Portuguese BR - Female 2
  "br_004", // Portuguese BR - Female 3
  "br_005", // Portuguese BR - Male

  // Asia voices
  "id_001", // Indonesian - Female
  "jp_001", // Japanese - Female 1
  "jp_003", // Japanese - Female 2
  "jp_005", // Japanese - Female 3
  "jp_006", // Japanese - Male
  "kr_002", // Korean - Male 1
  "kr_003", // Korean - Female
  "kr_004", // Korean - Male 2

  // Singing voices
  "en_female_f08_salut_damour", // Alto
  "en_male_m03_lobby", // Tenor
  "en_female_f08_warmy_breeze", // Warmy Breeze
  "en_male_m03_sunshine_soon", // Sunshine Soon

  // Other
  "en_male_narration", // narrator
  "en_male_funny", // wacky
  "en_female_emotional", // peaceful
];

// Limited to 25 voices because only 25 choices are allowed in Discord
const voicesObject = {
  "Ghost Face": "en_us_ghostface",
  Chewbacca: "en_us_chewbacca",
  C3PO: "en_us_c3po",
  Stitch: "en_us_stitch",
  Stormtrooper: "en_us_stormtrooper",
  Rocket: "en_us_rocket",
  Alto: "en_female_f08_salut_damour",
  Tenor: "en_male_m03_lobby",
  "Warmy Breeze": "en_female_f08_warmy_breeze",
  "Sunshine Soon": "en_male_m03_sunshine_soon",
  Narrator: "en_male_narration",
  Wacky: "en_male_funny",
  Peaceful: "en_female_emotional",
  "English AU - Female": "en_au_001",
  "English AU - Male": "en_au_002",
  "English UK - Male 1": "en_uk_001",
  "English UK - Male 2": "en_uk_003",
  "English US - Female (Int. 1)": "en_us_001",
  "English US - Female (Int. 2)": "en_us_002",
  "English US - Male 1": "en_us_006",
  "English US - Male 2": "en_us_007",
  "English US - Male 3": "en_us_009",
  "English US - Male 4": "en_us_010",
  "French - Male 1": "fr_001",
  "French - Male 2": "fr_002",
};

const voiceStringOptionChoices = Object.entries(voicesObject).map(([name, value]) => ({ name, value }));

function getVoiceNameFromValue(value) {
  for (const [name, voice] of Object.entries(voicesObject)) {
    if (voice === value) {
      return name;
    }
  }
}

function base64ToFile(base64, fileName) {
  const buffer = Buffer.from(base64, "base64");

  writeFile(fileName, buffer, err => {
    if (err) {
      console.error(err);
    }
  });
}

function getRequestUrl(voice, text) {
  const encodedText = encodeURIComponent(text);
  return `https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/invoke/?text_speaker=${voice}&req_text=${encodedText}&speaker_map_type=0&aid=1233`;
}

function postRequest(voice, text) {
  const headers = {
    "User-Agent": userAgent,
    Cookie: cookie,
  };

  const url = getRequestUrl(voice, text);

  return fetch(url, {
    method: "POST",
    headers,
  });
}

function splitString(inputString, maxLength) {
  const chunks = [];

  const sentences = inputString.split(". ");

  let currentChunk = "";

  // Split string into sentences, where each sentence is less than maxLength
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += sentence + ". ";
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + ". ";
    }
  }

  chunks.push(currentChunk.trim());

  // Fall back to splitting by words if the last chunk is still too long
  if (chunks[chunks.length - 1].length > maxLength) {
    const lastChunkWords = chunks[chunks.length - 1].split(" ");

    currentChunk = "";

    for (const word of lastChunkWords) {
      if (currentChunk.length + word.length <= maxLength) {
        currentChunk += word + " ";
      } else {
        chunks[chunks.length - 1] = currentChunk.trim();
        currentChunk = word + " ";
        chunks.push(currentChunk.trim());
      }
    }
  }

  return chunks;
}

async function getTTS(voice, text, fileName) {
  if (!voices.includes(voice)) {
    throw new Error("Voice not available.");
  }

  let base64 = "";

  // TikTok's API only allows 200 characters per TTS request
  const textChunks = splitString(text, 200);

  for (const chunk of textChunks) {
    const response = await postRequest(voice, chunk);
    const json = await response.json();

    if (json.status_code !== 0) {
      throw new Error(json.message);
    }

    base64 += json.data.v_str;
  }

  base64ToFile(base64, fileName);
}

module.exports = {
  voices,
  voicesObject,
  voiceStringOptionChoices,
  getVoiceNameFromValue,
  getTTS,
};
