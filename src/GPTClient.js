const { Configuration, OpenAIApi } = require("openai");
const { openaiToken } = require("../config/secrets.json");
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
} = require("../config/gpt-config.json");

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
    this.stopSequences = [">>>"];

    // Approximately 1 token per 4 characters
    this.approximateTokenRatio = 1 / 4;
  }

  getApproximateTokenCount(string) {
    return Math.ceil(string.length * this.approximateTokenRatio);
  }

  getMaxTokens() {
    return this.maxTokensPerRequest;
  }

  getApiParams() {
    return {
      model: this.model,
      max_tokens: this.getMaxTokens(),
      temperature: this.temperature,
      top_p: this.topP,
      frequency_penalty: this.frequencyPenalty,
      presence_penalty: this.presencePenalty,
      stop: this.stopSequences,
    };
  }

  getPrompt(addMessage) {
    let prompt = this.promptPrefix;

    for (const message of this.conversationHistory) {
      prompt += `>>>${message}\n`;
    }

    if (addMessage) {
      prompt += `>>>${addMessage}\n`;
      prompt += `>>>${this.aiName}:`;
    }

    return prompt;
  }

  adjustMaxTokens(addMessage) {
    const tokenCount = this.getApproximateTokenCount(this.getPrompt(addMessage));
    this.maxTokensPerRequest = tokenCount + this.maxCompletionTokens;

    // Remove the oldest messages until prompt is under max token threshold.
    while (
      this.getApproximateTokenCount(this.getPrompt(addMessage)) >
      this.maxTokensBeforeTruncation - this.maxCompletionTokens
    ) {
      this.conversationHistory.shift();
    }
  }

  addToHistory() {
    for (const argument of arguments) {
      this.conversationHistory.push(argument);
    }
  }

  async query(displayName, message) {
    const formattedMessage = `${displayName}: ${message}`;
    const prompt = this.getPrompt(formattedMessage);

    this.adjustMaxTokens(formattedMessage);

    const completion = await this.createCompletion(prompt);

    const formattedResponse = `${this.aiName}: ${completion}`;
    this.addToHistory(formattedMessage, formattedResponse);

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
