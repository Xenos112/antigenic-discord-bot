import { Client, GatewayIntentBits, Events } from "discord.js";
import chat from "./actions/chat";
import preProcessPrompt from "./pre_process_prompt";
import Logger from "./utils/logger";
import addRole from "./actions/add-role";
import ban from "./actions/ban";
import kick from "./actions/kick";

const clientToken = process.env.DISCORD_TOKEN;
const logger = new Logger(import.meta.url)
const history: string[] = []

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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
    logger.debug(`Pre-processed prompt: ${preProcessedPrompt}`);

    preProcessedPrompt.forEach(type => {
      if (type === 'chat')
        chat(messageContext, history);
      if (type === 'add_role')
        addRole(messageContext, history);
      if (type === 'ban')
        ban(messageContext, history);
      if (type === 'kick')
        kick(messageContext, history);
    })
  }
});


client.login(clientToken);
