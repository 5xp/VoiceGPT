const { Configuration, OpenAIApi } = require("openai");
const { openaiToken } = require("../../config/secrets.json");
const {
  model,
  name,
  personality,
  max_tokens_before_truncation,
  max_completion_tokens,
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
    this.model = model;
    this.aiName = name;
    this.personality = personality;
    this.temperature = temperature;
    this.topP = top_p;
    this.frequencyPenalty = frequency_penalty;
    this.presencePenalty = presence_penalty;
    this.promptPrefix = `The following is the start of a conversation between various people and ${this.aiName}.\n\n${this.personality}\n\n`;
    this.conversationHistory = [];

    // The hard limit of number of tokens before we start truncating conversation history
    this.maxTokensBeforeTruncation = max_tokens_before_truncation;

    // The max number of tokens reserved for completion
    this.maxCompletionTokens = max_completion_tokens;

    // The entire number of tokens per request (prompt + completion)
    // Always the previous prompt token count + reserved completion tokens
    this.maxTokensPerRequest;

    // Insert at the beginning of each message so GPT can pick up on this pattern
    // Then we can prevent GPT from writing on behalf of others
    this.stopSequence = ["{I}", "{O}"];

    // Approximately 1 token per 4 characters
    this.approximateTokenRatio = 1 / 4;
  }

  getApiParams() {
    return {
      model: this.model,
      max_tokens: this.getMaxTokens(),
      temperature: this.temperature,
      top_p: this.topP,
      frequency_penalty: this.frequencyPenalty,
      presence_penalty: this.presencePenalty,
      stop: this.stopSequence,
    };
  }

  addToHistory() {
    for (const argument of arguments) {
      this.conversationHistory.push(argument);
    }
  }

  addResponseToHistory(content) {
    // The last item in the history already has the "Bot:" part
    this.conversationHistory[this.conversationHistory.length - 1] += " " + content;
  }

  getPrompt() {
    let prompt = this.promptPrefix;

    let sender;

    // If the number of messages is odd, it has been truncated
    if (this.conversationHistory.length % 2 === 0) {
      sender = "I";
    } else {
      sender = "O";
    }

    for (const message of this.conversationHistory) {
      prompt += `{${sender}}${message}\n`;

      if (sender === "O") {
        sender = "I";
      } else {
        sender = "O";
      }
    }

    return prompt;
  }

  getMaxTokens() {
    return this.maxTokensPerRequest;
  }

  getApproximateTokenCount(string) {
    return Math.ceil(string.length * this.approximateTokenRatio);
  }

  constructPrompt(displayName, message) {
    this.addToHistory(`${displayName}: ${message}`, `${this.aiName}:`);
    return this.getPrompt();
  }

  adjustMaxTokens(tokenCount) {
    this.maxTokensPerRequest = tokenCount + this.maxCompletionTokens;

    // Remove the oldest messages until prompt is under max token threshold.
    while (
      this.getApproximateTokenCount(this.getPrompt()) >
      this.maxTokensBeforeTruncation - this.maxCompletionTokens
    ) {
      this.conversationHistory.shift();
    }
  }

  async query(displayName, message) {
    const prompt = this.constructPrompt(displayName, message);

    const tokenCount = this.getApproximateTokenCount(prompt);
    this.adjustMaxTokens(tokenCount);

    const completion = await this.createCompletion(prompt);
    this.addResponseToHistory(completion);

    return completion;
  }

  async createCompletion(prompt) {
    try {
      const completion = await this.openaiApi.createCompletion({
        ...this.getApiParams(),
        prompt,
      });
      return completion.data.choices[0].text.trim();
    } catch (error) {
      console.warn(error);
    }
  }
}

module.exports = GPTClient;
