import ollama from "./utils/ollama";
import { getUserMessageType } from "./features/chat";
import Logger from "./utils/logger";

const logger = new Logger(import.meta.url)

type PreProcessPromptResponse = "chat" | "mute" | "kick" | "ban" | "add_role" | "remove_role";

async function preProcessPrompt(message: string, history: string[] = []): Promise<PreProcessPromptResponse[]> {
  logger.debug(`Starting prompt classification for: "${message}"`);
  logger.debug(`Using ${history.length} history entries for context`);

  const response = await ollama.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: getUserMessageType(message, history) }],
  })

  const types = JSON.parse(response.message.content) as PreProcessPromptResponse[]
  logger.debug(`AI classification result: ${JSON.stringify(types)}`);
  return types
}

export default preProcessPrompt
