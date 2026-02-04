import { banPromptMaker } from "./prompts";
import type { MessageContext } from "../../types";
import Logger from "../../utils/logger";
import ollama from '../../utils/ollama'
import tryCatch from "../../utils/try-catch";
import { requireModerator } from "../../utils/permissions";

type BanUserProps = {
  user: string;
  message: string;
};

const logger = new Logger(import.meta.url);

export default async function ban(messageContext: MessageContext, history: string[] = []) {
  logger.info(`Ban command invoked by ${messageContext.author.username} in guild: ${messageContext.guild?.name}`);

  const permissionCheck = requireModerator(messageContext);
  if (!permissionCheck.allowed) {
    logger.warn(`Permission denied: ${messageContext.author.username} attempted to ban without moderator permissions`);
    await messageContext.channel.send(permissionCheck.message!);
    return;
  }

  const guild = messageContext.guild!;
  logger.debug(`Requesting ban instructions from AI model`);

  const { data: response, error: sendingRequestError } = await tryCatch(ollama.chat({
    model: "gpt-oss:120b",
    messages: [
      {
        role: "user",
        content: banPromptMaker(messageContext.content, history),
      },
    ],
  })
  )

  if (sendingRequestError) {
    logger.error(`Failed to get AI response for ban command: ${sendingRequestError}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return;
  }

  const returnedData = JSON.parse(response.message.content) as BanUserProps[];
  logger.debug(`AI returned ${returnedData.length} ban request(s)`);

  for (const entry of returnedData) {
    logger.debug(`Processing ban request for user ID: ${entry.user}`);
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))

    if (error || !member) {
      logger.warn(`Failed to fetch user ${entry.user}: user not found in guild ${guild.name}`);
      await messageContext.channel.send("User not found in guild");
      continue;
    }

    if (!member.bannable || member.user.bot) {
      logger.warn(`Cannot ban user ${entry.user}: ${member.user.bot ? 'user is a bot' : 'insufficient permissions'}`);
      await messageContext.channel.send("You can't ban this user");
      continue;
    }

    logger.debug(`Executing ban on user ${entry.user} (${member.user.username})`);
    const { error: banError } = await tryCatch(member.ban())
    if (banError) {
      logger.error(`Failed to ban user ${entry.user} (${member.user.username}): ${banError}`);
      await messageContext.channel.send("Error when banning user, please try again later");
      continue;
    }

    logger.info(`Successfully banned user ${entry.user} (${member.user.username})`);
    await messageContext.channel.send(entry.message);
  }
}