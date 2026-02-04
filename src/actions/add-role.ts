import type { ColorResolvable, Message, OmitPartialGroupDMChannel } from "discord.js";
import ollama from "../utils/ollama";
import Logger from "../utils/logger";
import generateRandomHexColor from "../utils/random-hexcolor";
import { addRolesPromptMaker } from "../prompts";
import tryCatch from "../utils/try-catch";
import delay from "../utils/delay";
import type { MessageContext } from "../types";

type AddRoleProps = {
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

  logger.debug(`Json response from ollama: ${response.message.content}`);

  const returnedData = JSON.parse(response.message.content) as AddRoleProps[];
  const guild = messageContext.guild!;

  for (const entry of returnedData) {
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))
    if (error || !member) {
      logger.error(`User ${entry.user} not found in guild ${guild.name}`);
      continue;
    }

    let role = guild.roles.cache.find((r) => r.name === entry.role);

    if (!role) {
      logger.debug(`Creating new role ${entry.role}`);

      const { error: createError, data: createdRole } = await tryCatch(
        guild.roles.create({
          name: entry.role,
          colors: { primaryColor: generateRandomHexColor() as ColorResolvable },
        })
      );

      if (createError) {
        logger.error(`Error creating role ${entry.role}: ${createError}`);
        continue;
      }

      logger.debug(`Created new role ${entry.role}`);
      role = createdRole;
      delay(1000)
    }

    const { error: addError } = await tryCatch(member.roles.add(role))
    if (addError) {
      logger.error(`Error adding role ${entry.role} to user ${entry.user}: ${error}`);
      continue;
    }
    logger.debug("Added Role");
    await messageContext.channel.send(entry.message);
  }

  return true;
}
