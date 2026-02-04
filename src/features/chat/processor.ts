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

  logger.debug(`Processing prompt: ${prompt}`);

  const { data: prompts, error } = await tryCatch(fetchDataBasePrompts())
  if (error) {
    logger.error(`Error fetching prompts: ${error}`);
    return
  } else if (prompts.length === 0) {
    logger.debug(`No prompts found`);
    return
  }

  const calculatedPrompts = prompts.map(savedPrompt => {
    const similarity = getSimilarity(prompt, savedPrompt.prompt);
    return {
      id: savedPrompt.id,
      similarity: similarity,
    };
  });

  logger.debug(`Sorting prompts`);
  const sortedPrompts = calculatedPrompts.sort((a, b) => b.similarity - a.similarity);

  if (sortedPrompts.length === 0) {
    return
  }

  const topPrompt = sortedPrompts[0];
  if (topPrompt && topPrompt.similarity < 0.75) {
    logger.debug(`No similar prompt found`);
    return
  }

  const topResponse = await fetchDataBasePrompt(topPrompt!.id);

  logger.debug(`Found similar prompt: ${topPrompt!.id} with similarity: ${topPrompt!.similarity}`);
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
  logger.debug(`Fetching all prompts`);
  if (cachedPromptResponsePair.length > 0) {
    return cachedPromptResponsePair;
  }

  const chats = await prisma.chat.findMany({
    select: {
      id: true,
      prompt: true,
    }
  });

  return chats;
}

async function fetchDataBasePrompt(id: string) {
  logger.debug(`Fetching prompt with id: ${id}`);
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
  logger.debug(`Adding new prompt: ${prompt}`);
  const newPair = await prisma.chat.create({
    data: {
      prompt,
      response,
    }
  });

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