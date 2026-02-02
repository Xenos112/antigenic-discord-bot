import { Client, GatewayIntentBits, Events } from "discord.js";
import chat from "./actions/chat";
import preProcessPrompt from "./pre_process_prompt";
import { urlParser } from "./parsers";

const clientToken = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});


client.on(Events.ClientReady, (client) => {
  console.log(`Logged in as ${client.user!.tag}!`);
});

client.on(Events.MessageCreate, async (messageContext) => {
  if (messageContext.author.bot) return;

  if (messageContext.content.includes(`<@${client.user!.id}>`) || messageContext.reference?.messageId) {
    messageContext.channel.sendTyping();
    const urls = urlParser(messageContext.content);
    const preProcessedPrompt = await preProcessPrompt(messageContext.content, []);

    for (const type in preProcessedPrompt) {
      switch (type) {
        case "chat":
          chat(messageContext, urls);
          break;
        default:
          chat(messageContext, urls);
          break;
      }
    }
  }
});


client.login(clientToken);
