const { Configuration, OpenAIApi } = require("openai");
const { openaiToken } = require("../../config/secrets.json");
const {
  model,
  name,
  personality,
  max_tokens,
  temperature,
  top_p,
  frequency_penalty,
  presence_penalty,
} = require("../../config/gpt-config.json");

class GPTClient {
  constructor() {
    this.configuration = new Configuration({
      apiKey: openaiToken,
    });
    this.openaiApi = new OpenAIApi(this.configuration);
    this.aiName = name;
    this.personality = personality;
    this.promptPrefix = `The following is the start of a conversation between various people and ${this.aiName}.\n\n${this.personality}\n`;
    this.apiParams = {
      model: model,
      max_tokens: max_tokens,
      temperature: temperature,
      top_p: top_p,
      frequency_penalty: frequency_penalty,
      presence_penalty: presence_penalty,
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
