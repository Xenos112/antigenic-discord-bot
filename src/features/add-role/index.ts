import type { ColorResolvable } from "discord.js";
import ollama from "../../utils/ollama";
import Logger from "../../utils/logger";
import generateRandomHexColor from "../../utils/random-hexcolor";
import { addRolesPromptMaker } from "./prompts";
import tryCatch from "../../utils/try-catch";
import delay from "../../utils/delay";
import type { MessageContext } from "../../types";
import { requireModerator } from "../../utils/permissions";

type AddRoleProps = {
  user: string;
  role: string;
  message: string;
};

const logger = new Logger(import.meta.url);

export default async function addRole(messageContext: MessageContext, history: string[] = []): Promise<boolean | undefined> {
  logger.info(`Add role command invoked by ${messageContext.author.username} in guild: ${messageContext.guild?.name}`);

  const permissionCheck = requireModerator(messageContext);
  if (!permissionCheck.allowed) {
    logger.warn(`Permission denied: ${messageContext.author.username} attempted to add roles without moderator permissions`);
    await messageContext.channel.send(permissionCheck.message!);
    return false;
  }

  logger.debug(`Requesting role assignment instructions from AI model`);

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
    logger.error(`Failed to get AI response for add-role command: ${error}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return false;
  }

  logger.debug(`AI returned role assignment data: ${response.message.content}`);

  const returnedData = JSON.parse(response.message.content) as AddRoleProps[];
  const guild = messageContext.guild!;
  logger.debug(`Processing ${returnedData.length} role assignment request(s)`);

  for (const entry of returnedData) {
    logger.debug(`Processing role assignment: role "${entry.role}" to user ID: ${entry.user}`);
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))
    if (error || !member) {
      logger.warn(`Failed to fetch user ${entry.user}: user not found in guild ${guild.name}`);
      continue;
    }

    let role = guild.roles.cache.find((r) => r.name === entry.role);

    if (!role) {
      logger.debug(`Role "${entry.role}" not found, creating new role`);
      logger.debug(`Assigning random color to role "${entry.role}"`);

      const { error: createError, data: createdRole } = await tryCatch(
        guild.roles.create({
          name: entry.role,
          color: generateRandomHexColor() as ColorResolvable,
        })
      );

      if (createError) {
        logger.error(`Failed to create role "${entry.role}": ${createError}`);
        continue;
      }

      logger.info(`Successfully created new role: ${entry.role}`);
      role = createdRole;
      delay(1000)
    }

    logger.debug(`Assigning role "${entry.role}" to user ${entry.user} (${member.user.username})`);
    const { error: addError } = await tryCatch(member.roles.add(role))
    if (addError) {
      logger.error(`Failed to add role "${entry.role}" to user ${entry.user} (${member.user.username}): ${addError}`);
      continue;
    }
    logger.info(`Successfully added role "${entry.role}" to user ${entry.user} (${member.user.username})`);
    await messageContext.channel.send(entry.message);
  }

  return true;
}