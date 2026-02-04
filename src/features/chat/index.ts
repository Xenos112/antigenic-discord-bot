import { addNewChatResponse, processPrompt } from "./processor";
import { customChatPromptMaker } from "./prompts";
import type { MessageContext } from "../../types";
import Logger from "../../utils/logger";
import ollama from "../../utils/ollama";

const logger = new Logger(import.meta.url)

export default async function chat(messageContext: MessageContext, history: string[]) {
  logger.debug(`Processing chat request from ${messageContext.author.username}`);

  const response = await processPrompt(messageContext.content);

  if (response) {
    logger.debug("Using cached response from database");
    messageContext.channel.send(response);
    return;
  } else {
    logger.debug("No cached response found, generating new AI response");
    const aiResponse = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{
        role: "user",
        content: customChatPromptMaker(messageContext.content, history),
      }],
      stream: false,
    });

    logger.debug("Saving new AI response to database");
    const newChatResponse = await addNewChatResponse(messageContext.content, aiResponse.message.content);
    messageContext.channel.send(newChatResponse.response);
  }
}

export { customChatPromptMaker, getUserMessageType } from "./prompts";