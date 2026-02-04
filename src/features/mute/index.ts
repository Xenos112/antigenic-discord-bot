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
  const permissionCheck = requireModerator(messageContext);
  if (!permissionCheck.allowed) {
    await messageContext.channel.send(permissionCheck.message!);
    return;
  }

  const guild = messageContext.guild!;

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
    logger.error(`Error: ${sendingRequestError}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return;
  }
  const returnedData = JSON.parse(response.message.content) as MuteUserProps[];

  for (const entry of returnedData) {
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))

    if (error || !member) {
      logger.error(`User ${entry.user} not found in guild ${guild.name}`);
      await messageContext.channel.send("User not found in guild");
      continue;
    }

    if (!member.moderatable || member.user.bot) {
      await messageContext.channel.send("You can't mute this user");
      continue;
    }

    const { error: muteError } = await tryCatch(member.timeout(entry.timeout * 1000))
    if (muteError) {
      logger.error(`Error muting user ${entry.user}: ${muteError}`);
      await messageContext.channel.send("Error when muting user, please try again later");
      continue;
    }

    logger.debug("muted User");
    await messageContext.channel.send(entry.message);
  }
}