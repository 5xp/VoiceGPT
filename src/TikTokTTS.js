/* eslint-disable no-inline-comments */
const { tiktokSessionId } = require("../config/secrets.json");
const fetch = require("node-fetch");
const { writeFile } = require("node:fs");

class TikTokTTS {
  voice = "en_us_002";

  static sessionId = tiktokSessionId;
  static userAgent =
    "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)";
  static cookie = `sessionid=${this.sessionId};`;

  // All available voices
  static tiktokVoices = [
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
  static tiktokVoicesObject = {
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

  static voiceStringOptionChoices = Object.entries(this.tiktokVoicesObject).map(([name, value]) => ({ name, value }));

  static getVoiceNameFromValue(value) {
    for (const [name, voice] of Object.entries(this.tiktokVoicesObject)) {
      if (voice === value) {
        return name;
      }
    }
  }

  static base64ToFile(base64, fileName) {
    const buffer = Buffer.from(base64, "base64");

    writeFile(fileName, buffer, err => {
      if (err) {
        console.error(err);
      }
    });
  }

  static getRequestUrl(voice, text) {
    const encodedText = encodeURIComponent(text);
    return `https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/invoke/?text_speaker=${voice}&req_text=${encodedText}&speaker_map_type=0&aid=1233`;
  }

  static postRequest(voice, text) {
    const headers = {
      "User-Agent": this.userAgent,
      Cookie: this.cookie,
    };

    const url = this.getRequestUrl(voice, text);

    return fetch(url, {
      method: "POST",
      headers,
    });
  }

  async getTTS(text, fileName) {
    const response = await TikTokTTS.postRequest(this.voice, text);
    const json = await response.json();

    if (json.status_code !== 0) {
      throw new Error(json.message);
    }

    TikTokTTS.base64ToFile(json.data.v_str, fileName);
  }

  setVoice(voice) {
    if (!TikTokTTS.tiktokVoices.includes(voice)) {
      throw new Error("Voice not available");
    }

    this.voice = voice;
  }
}

module.exports = TikTokTTS;
