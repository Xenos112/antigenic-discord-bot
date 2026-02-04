import { mutePromptMaker } from "./prompts";
import type { MessageContext } from "../../types";
import Logger from "../../utils/logger";
import ollama from '../../utils/ollama'
import tryCatch from "../../utils/try-catch";
import { requireModerator } from "../../utils/permissions";

type MuteUserProps = {
  user: string;
  message: string;
  timeout: number;
};

const logger = new Logger(import.meta.url);

export default async function mute(messageContext: MessageContext, history: string[] = []) {
  logger.info(`Mute command invoked by ${messageContext.author.username} in guild: ${messageContext.guild?.name}`);

  const permissionCheck = requireModerator(messageContext);
  if (!permissionCheck.allowed) {
    logger.warn(`Permission denied: ${messageContext.author.username} attempted to mute without moderator permissions`);
    await messageContext.channel.send(permissionCheck.message!);
    return;
  }

  const guild = messageContext.guild!;
  logger.debug(`Requesting mute instructions from AI model`);

  const { data: response, error: sendingRequestError } = await tryCatch(ollama.chat({
    model: "gpt-oss:120b",
    messages: [
      {
        role: "user",
        content: mutePromptMaker(messageContext.content, history),
      },
    ],
  })
  )

  if (sendingRequestError) {
    logger.error(`Failed to get AI response for mute command: ${sendingRequestError}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return;
  }

  const returnedData = JSON.parse(response.message.content) as MuteUserProps[];
  logger.debug(`AI returned ${returnedData.length} mute request(s)`);

  for (const entry of returnedData) {
    logger.debug(`Processing mute request for user ID: ${entry.user} (duration: ${entry.timeout}s)`);
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))

    if (error || !member) {
      logger.warn(`Failed to fetch user ${entry.user}: user not found in guild ${guild.name}`);
      await messageContext.channel.send("User not found in guild");
      continue;
    }

    if (!member.moderatable || member.user.bot) {
      logger.warn(`Cannot mute user ${entry.user}: ${member.user.bot ? 'user is a bot' : 'insufficient permissions'}`);
      await messageContext.channel.send("You can't mute this user");
      continue;
    }

    logger.debug(`Executing timeout on user ${entry.user} (${member.user.username}) for ${entry.timeout}s`);
    const { error: muteError } = await tryCatch(member.timeout(entry.timeout * 1000))
    if (muteError) {
      logger.error(`Failed to mute user ${entry.user} (${member.user.username}): ${muteError}`);
      await messageContext.channel.send("Error when muting user, please try again later");
      continue;
    }

    logger.info(`Successfully muted user ${entry.user} (${member.user.username}) for ${entry.timeout}s`);
    await messageContext.channel.send(entry.message);
  }
}