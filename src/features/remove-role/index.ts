import ollama from "../../utils/ollama";
import Logger from "../../utils/logger";
import { removeRolesPromptMaker } from "./prompts";
import tryCatch from "../../utils/try-catch";
import type { MessageContext } from "../../types";
import { requireModerator } from "../../utils/permissions";

type RemoveRoleProps = {
  user: string;
  role: string;
  message: string;
};

const logger = new Logger(import.meta.url);

export default async function removeRole(messageContext: MessageContext, history: string[] = []): Promise<boolean | undefined> {
  logger.info(`Remove role command invoked by ${messageContext.author.username} in guild: ${messageContext.guild?.name}`);

  const permissionCheck = requireModerator(messageContext);
  if (!permissionCheck.allowed) {
    logger.warn(`Permission denied: ${messageContext.author.username} attempted to remove roles without moderator permissions`);
    await messageContext.channel.send(permissionCheck.message!);
    return false;
  }

  logger.debug(`Requesting role removal instructions from AI model`);

  const { data: response, error } = await tryCatch(
    ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        {
          role: "user",
          content: removeRolesPromptMaker(messageContext.content, history),
        },
      ],
    })
  );

  if (error || !response.message.content) {
    logger.error(`Failed to get AI response for remove-role command: ${error}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return false;
  }

  const returnedData = JSON.parse(response.message.content) as RemoveRoleProps[];
  const guild = messageContext.guild!;
  logger.debug(`Processing ${returnedData.length} role removal request(s)`);

  for (const entry of returnedData) {
    logger.debug(`Processing role removal: role "${entry.role}" from user ID: ${entry.user}`);
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))
    if (error || !member) {
      logger.warn(`Failed to fetch user ${entry.user}: user not found in guild ${guild.name}`);
      continue;
    }

    let role = guild.roles.cache.find((r) => r.name === entry.role);

    if (!role) {
      logger.warn(`Role "${entry.role}" does not exist in guild ${guild.name}`);
      await messageContext.channel.send("Role does not exist");
      continue;
    }

    logger.debug(`Removing role "${entry.role}" from user ${entry.user} (${member.user.username})`);
    const { error: removeError } = await tryCatch(member.roles.remove(role))
    if (removeError) {
      logger.error(`Failed to remove role "${entry.role}" from user ${entry.user} (${member.user.username}): ${removeError}`);
      continue;
    }
    logger.info(`Successfully removed role "${entry.role}" from user ${entry.user} (${member.user.username})`);
    await messageContext.channel.send(entry.message);
  }

  return true;
}