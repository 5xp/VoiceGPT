const { Configuration, OpenAIApi } = require("openai");
const { openaiApiKey, aiName, aiPersonality } = require("../config.json");

class GPTClient {
  constructor() {
    this.configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    this.openaiApi = new OpenAIApi(this.configuration);
    this.aiName = aiName;
    this.personality = aiPersonality;
    this.promptPrefix = `The following is a conversation between various people and ${this.aiName}.\n\n${this.personality}. Human text is prefixed with "$".\n`;
    this.apiParams = {
      model: "text-davinci-003",
      max_tokens: 600,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0.4,
      presence_penalty: 0.4,
      stop: ["\n$", "\n\n"],
    };
    this.conversationHistory = "";
  }

  addToHistory(content) {
    this.conversationHistory += content;
  }

  constructPrompt(displayName, message) {
    const addendum = `\n$${displayName}: ${message}\n${this.aiName}:`;
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
