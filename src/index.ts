import { Client, GatewayIntentBits, Events } from "discord.js";
import chat from "./actions/chat";
import preProcessPrompt from "./pre_process_prompt";
import { urlParser } from "./parsers";
import Logger from "./utils/logger";

const clientToken = process.env.DISCORD_TOKEN;
const logger = new Logger(import.meta.url)
const history: string[] = []

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});


client.on(Events.ClientReady, (client) => {
  logger.info(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.MessageCreate, async (messageContext) => {
  if (messageContext.author.bot) return;
  const isMentioned = messageContext.content.includes(`<@${client.user!.id}>`);
  const isReplyToBot = messageContext.reference?.messageId

  if (isMentioned || isReplyToBot) {
    messageContext.channel.sendTyping();
    logger.debug(`Saved to history and start pre-processing prompt`);
    history.push(`${messageContext.author.username}: ${messageContext.content}`);

    const preProcessedPrompt = await preProcessPrompt(messageContext.content, history.slice(-5));
    for (const type in preProcessedPrompt) {
      switch (type) {
        case "chat":
          chat(messageContext, history);
          break;
        default:
          chat(messageContext, history);
          break;
      }
    }
  }
});


client.login(clientToken);
