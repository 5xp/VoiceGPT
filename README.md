# VoiceGPT

This bot uses a [C++ implementation of OpenAI's Whisper](https://github.com/ggerganov/whisper.cpp) for transcribing Discord voice channel user audio, OpenAI's GPT-3 API for text completion, and TikTok's TTS API command for text-to-speech.

# Usage

- Clone the repository: `git clone https://github.com/5xp/VoiceGPT.git`
- Install dependencies: `npm install`

## Whisper Setup

The model can be obtained using the download scripts from the [whisper.cpp repository](https://github.com/ggerganov/whisper.cpp) or they can be downloaded from [https://huggingface.co/datasets/ggerganov/whisper.cpp](https://huggingface.co/datasets/ggerganov/whisper.cpp).

### MacOS

Follow the instructions in the [whisper.cpp README](https://github.com/ggerganov/whisper.cpp#quick-start) to obtain the `whisper` binary.

### Windows

Obtain the binary by downloading from the releases page. Make sure to have the `.dll` files in the same folder as the binary.

## TTS Setup

If you're running this bot on MacOS, you can set `"useSiriTTS": true` in `bot-config.json` to use Siri and other voices. The voice can be changed by setting the System voice in `System Preferences`.

Otherwise, to use the TikTok TTS API, you'll need to obtain a TikTok session cookie. You can do this by logging into TikTok on the web and copying the `sessionid` cookie from the browser's developer tools. It should look something like this: `4bb74764247716a951cc3a6082b00663`

## Discord Bot Setup

- Remove `.example` from the files in the `config` folder and fill in the values.

Before running the bot, make sure to enable `Message Content Intent` in the Discord Developer Portal. Without it, the bot won't be able to read or send messages.

- Run `npm run deploy-dev` to deploy slash commands to your test server, or `npm run deploy-global` to deploy slash commands to all servers the bot is in.
