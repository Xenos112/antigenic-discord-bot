import Logger from "../../utils/logger";
import prisma from "../../utils/prisma";
import tryCatch from "../../utils/try-catch";

type PromptResponsePair = {
  id: string;
  prompt: string;
  response: string;
};

const cachedPromptResponsePair: Array<PromptResponsePair> = [];
const logger = new Logger(import.meta.url)

async function processPrompt(prompt: string) {

  logger.debug(`Searching for similar prompt in database: "${prompt}"`);

  const { data: prompts, error } = await tryCatch(fetchDataBasePrompts())
  if (error) {
    logger.error(`Failed to fetch prompts from database: ${error}`);
    return
  } else if (prompts.length === 0) {
    logger.debug("No prompts found in database cache");
    return
  }

  logger.debug(`Found ${prompts.length} cached prompts, calculating similarities`);

  const calculatedPrompts = prompts.map(savedPrompt => {
    const similarity = getSimilarity(prompt, savedPrompt.prompt);
    return {
      id: savedPrompt.id,
      similarity: similarity,
    };
  });

  const sortedPrompts = calculatedPrompts.sort((a, b) => b.similarity - a.similarity);

  if (sortedPrompts.length === 0) {
    logger.debug("No prompts available for similarity comparison");
    return
  }

  const topPrompt = sortedPrompts[0];
  if (topPrompt && topPrompt.similarity < 0.75) {
    logger.debug(`Best match similarity ${topPrompt.similarity.toFixed(2)} below threshold (0.75), no cached response used`);
    return
  }

  logger.debug(`Fetching response for prompt ID: ${topPrompt!.id} (similarity: ${topPrompt!.similarity.toFixed(2)})`);
  const topResponse = await fetchDataBasePrompt(topPrompt!.id);

  return topResponse!.response;
}

function getSimilarity(userPrompt: string, databasePrompt: string) {
  const userPromptsWords = userPrompt.toLowerCase().split(/\s+/)
  const databasePromptWords = databasePrompt.toLowerCase().split(/\s+/)

  const userPromptsSet = new Set(userPromptsWords)
  const databasePromptSet = new Set(databasePromptWords)

  const intersection = new Set([...userPromptsSet].filter(x => databasePromptSet.has(x)))
  const union = new Set([...userPromptsSet, ...databasePromptSet])
  const similarity = intersection.size / union.size

  return similarity;
}

async function fetchDataBasePrompts() {
  if (cachedPromptResponsePair.length > 0) {
    logger.debug(`Returning ${cachedPromptResponsePair.length} cached prompts from memory`);
    return cachedPromptResponsePair;
  }

  logger.debug("Fetching all prompts from database");
  const chats = await prisma.chat.findMany({
    select: {
      id: true,
      prompt: true,
    }
  });

  logger.debug(`Retrieved ${chats.length} prompts from database`);
  return chats;
}

async function fetchDataBasePrompt(id: string) {
  logger.debug(`Fetching prompt response from database (ID: ${id})`);
  const chat = await prisma.chat.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      response: true,
    }
  });

  return chat;
}

async function addNewChatResponse(prompt: string, response: string) {
  logger.debug(`Saving new prompt-response pair to database`);
  const newPair = await prisma.chat.create({
    data: {
      prompt,
      response,
    }
  });

  logger.debug(`Cached new response (ID: ${newPair.id}) in memory`);
  cachedPromptResponsePair.push({
    id: newPair.id,
    prompt,
    response,
  })

  return newPair
}

export {
  processPrompt,
  getSimilarity,
  fetchDataBasePrompts,
  fetchDataBasePrompt,
  addNewChatResponse
}
