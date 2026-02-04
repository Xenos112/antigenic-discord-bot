import ollama from "../utils/ollama";
import Logger from "../utils/logger";
import { addRolesPromptMaker } from "../prompts";
import tryCatch from "../utils/try-catch";
import type { MessageContext } from "../types";

type RemoveRoleProps = {
  user: string;
  role: string;
  message: string;
};


const logger = new Logger(import.meta.url);

export default async function addRole(messageContext: MessageContext, history: string[] = []): Promise<boolean | undefined> {
  logger.debug("Sending a custom role prompt");

  const { data: response, error } = await tryCatch(
    ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        {
          role: "user",
          content: addRolesPromptMaker(messageContext.content, history),
        },
      ],
    })
  );

  if (error || !response.message.content) {
    logger.error(`Error: ${error}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return;
  }

  const returnedData = JSON.parse(response.message.content) as RemoveRoleProps[];
  const guild = messageContext.guild!;

  for (const entry of returnedData) {
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))
    if (error || !member) {
      logger.error(`User ${entry.user} not found in guild ${guild.name}`);
      continue;
    }

    let role = guild.roles.cache.find((r) => r.name === entry.role);

    if (!role) {
      logger
      logger.debug(`Role Does not exist ${entry.role}`);
      await messageContext.channel.send("Role does not exist");
      continue;
    }

    const { error: addError } = await tryCatch(member.roles.remove(role))
    if (addError) {
      logger.error(`Error removing role ${entry.role} to user ${entry.user}: ${error}`);
      continue;
    }
    logger.debug("removed Role");
    await messageContext.channel.send(entry.message);
  }

  return true;
}
