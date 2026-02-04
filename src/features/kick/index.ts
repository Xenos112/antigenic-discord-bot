import { kickPromptMaker } from "./prompts";
import type { MessageContext } from "../../types";
import Logger from "../../utils/logger";
import ollama from '../../utils/ollama'
import tryCatch from "../../utils/try-catch";
import { requireModerator } from "../../utils/permissions";

type KickUserProps = {
  user: string;
  message: string;
};

const logger = new Logger(import.meta.url);

export default async function kick(messageContext: MessageContext, history: string[] = []) {
  logger.info(`Kick command invoked by ${messageContext.author.username} in guild: ${messageContext.guild?.name}`);

  const permissionCheck = requireModerator(messageContext);
  if (!permissionCheck.allowed) {
    logger.warn(`Permission denied: ${messageContext.author.username} attempted to kick without moderator permissions`);
    await messageContext.channel.send(permissionCheck.message!);
    return;
  }

  const guild = messageContext.guild!;
  logger.debug(`Requesting kick instructions from AI model`);

  const { data: response, error: sendingRequestError } = await tryCatch(ollama.chat({
    model: "gpt-oss:120b",
    messages: [
      {
        role: "user",
        content: kickPromptMaker(messageContext.content, history),
      },
    ],
  })
  )

  if (sendingRequestError) {
    logger.error(`Failed to get AI response for kick command: ${sendingRequestError}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return;
  }

  const returnedData = JSON.parse(response.message.content) as KickUserProps[];
  logger.debug(`AI returned ${returnedData.length} kick request(s)`);

  for (const entry of returnedData) {
    logger.debug(`Processing kick request for user ID: ${entry.user}`);
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))

    if (error || !member) {
      logger.warn(`Failed to fetch user ${entry.user}: user not found in guild ${guild.name}`);
      await messageContext.channel.send("User not found in guild");
      continue;
    }

    if (!member.kickable || member.user.bot) {
      logger.warn(`Cannot kick user ${entry.user}: ${member.user.bot ? 'user is a bot' : 'insufficient permissions'}`);
      await messageContext.channel.send("You can't kick this user");
      continue;
    }

    logger.debug(`Executing kick on user ${entry.user} (${member.user.username})`);
    const { error: kickError } = await tryCatch(member.kick())
    if (kickError) {
      logger.error(`Failed to kick user ${entry.user} (${member.user.username}): ${kickError}`);
      await messageContext.channel.send("Error when kicking user, please try again later");
      continue;
    }

    logger.info(`Successfully kicked user ${entry.user} (${member.user.username})`);
    await messageContext.channel.send(entry.message);
  }
}