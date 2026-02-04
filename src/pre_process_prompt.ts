import ollama from "./utils/ollama";
import { getUserMessageType } from "./prompts";
import Logger from "./utils/logger";

const logger = new Logger(import.meta.url)

type PreProcessPromptResponse = "chat" | "mute" | "kick" | "ban" | "add_role" | "remove_role";

async function preProcessPrompt(message: string, history: string[] = []): Promise<PreProcessPromptResponse[]> {
  logger.debug(`Pre-processing prompt`);

  const response = await ollama.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: getUserMessageType(message, history) }],
  })

  const types = JSON.parse(response.message.content) as PreProcessPromptResponse[]
  logger.debug(`Response: ${response.message.content}`);
  logger.debug(`Type: ${types}`);
  return types
}

export default preProcessPrompt
