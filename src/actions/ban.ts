import { banPromptMaker } from "../prompts";
import type { MessageContext } from "../types";
import Logger from "../utils/logger";
import ollama from '../utils/ollama'
import tryCatch from "../utils/try-catch";
import { requireModerator } from "../utils/permissions";

type BanUserProps = {
  user: string;
  message: string;
};

const logger = new Logger(import.meta.url);

export default async function ban(messageContext: MessageContext, history: string[] = []) {
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
        content: banPromptMaker(messageContext.content, history),
      },
    ],
  })
  )


  if (sendingRequestError) {
    logger.error(`Error: ${sendingRequestError}`);
    await messageContext.channel.send("Something went wrong, please try again later");
    return;
  }
  const returnedData = JSON.parse(response.message.content) as BanUserProps[];


  for (const entry of returnedData) {
    const { data: member, error } = await tryCatch(guild.members.fetch(entry.user))

    if (error || !member) {
      logger.error(`User ${entry.user} not found in guild ${guild.name}`);
      await messageContext.channel.send("User not found in guild");
      continue;
    }

    if (!member.bannable || member.user.bot) {
      await messageContext.channel.send("You can't ban this user");
      continue;
    }

    const { error: banError } = await tryCatch(member.ban())
    if (banError) {
      logger.error(`Error banning user ${entry.user}: ${banError}`);
      await messageContext.channel.send("Error when banning user, please try again later");
      continue;
    }

    logger.debug("Banned User");
    await messageContext.channel.send(entry.message);
  }
}
