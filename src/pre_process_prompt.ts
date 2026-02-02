import ollama from "./utils/ollama";
import { getUserMessageType } from "./prompts";
import Logger from "./utils/logger";

const logger = new Logger(import.meta.url)

type PreProcessPromptResponse = "chat" | "mute" | "kick" | "ban" | "add role" | "remove role";

async function preProcessPrompt(message: string, history: string[] = []): Promise<PreProcessPromptResponse> {
  const response = await ollama.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: getUserMessageType(message, history) }],
  })

  const type = response.message.content as PreProcessPromptResponse;
  logger.debug(`Type: ${type}`);
  return type
}

export default preProcessPrompt
