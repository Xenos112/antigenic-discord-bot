import { addNewChatResponse, processPrompt } from "../../process_prompt";
import { customChatPromptMaker } from "../../prompts";
import type { MessageContext } from "../../types";
import Logger from "../../utils/logger";
import ollama from "../../utils/ollama";

const logger = new Logger(import.meta.url)

export default async function chat(messageContext: MessageContext, history: string[]) {
  const response = await processPrompt(messageContext.content);

  if (response) {
    logger.debug("Used registered prompt");
    messageContext.channel.send(response);
    return;
  } else {
    logger.debug("Register new Prompt");
    const aiResponse = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{
        role: "user",
        content: customChatPromptMaker(messageContext.content, history),
      }],
      stream: false,
    });

    const newChatResponse = await addNewChatResponse(messageContext.content, aiResponse.message.content);
    messageContext.channel.send(newChatResponse.response);
  }
}

