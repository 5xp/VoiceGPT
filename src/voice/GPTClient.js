const { Configuration, OpenAIApi } = require("openai");
const { openaiApiKey, gptModel, aiName, aiPersonality } = require("../config.json");

class GPTClient {
  constructor() {
    this.configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    this.openaiApi = new OpenAIApi(this.configuration);
    this.aiName = aiName;
    this.personality = aiPersonality;
    this.promptPrefix = `The following is the start of a conversation between various people and ${this.aiName}.\n\n${this.personality}\n`;
    this.apiParams = {
      model: gptModel,
      max_tokens: 600,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      stop: ["{I}", "{O}"],
    };
    this.conversationHistory = "";
  }

  addToHistory(content) {
    this.conversationHistory += content;
  }

  constructPrompt(displayName, message) {
    const addendum = `\n{I}${displayName}: ${message}\n{O}${this.aiName}:`;
    this.addToHistory(addendum);
    return this.promptPrefix + this.conversationHistory;
  }

  async query(displayName, message) {
    const prompt = this.constructPrompt(displayName, message);

    const completion = await this.createCompletion(prompt);
    this.addToHistory(completion);
    return completion;
  }

  async createCompletion(prompt) {
    try {
      const completion = await this.openaiApi.createCompletion({
        ...this.apiParams,
        prompt,
      });
      return completion.data.choices[0].text.trim();
    } catch (error) {
      console.warn(error);
    }
  }
}

module.exports = GPTClient;
