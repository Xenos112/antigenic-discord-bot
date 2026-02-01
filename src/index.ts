import { Client, GatewayIntentBits, Events, PermissionsBitField } from "discord.js";
import { getJson } from "./prompts";

//const clientID = process.env.DISCORD_CLIENT_ID;
// const clientSecret = process.env.DISCORD_SECRET;
const clientToken = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Required for the bot to function in servers
    GatewayIntentBits.GuildMessages,    // Required to receive messages in servers
    GatewayIntentBits.MessageContent    // Required to read the content of messages
  ]
});


client.on(Events.ClientReady, (client) => {
  console.log(`Logged in as ${client.user!.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  if (
    message.content.includes(`<@${client.user!.id}>`) ||
    (message.reference && message.reference.messageId)
  ) {
    message.channel.sendTyping();

    const response = await getJson(message.content);
    for (const entry of response) {
      if (entry.action == "mute") {
        const target = await message.guild!.members.fetch(entry.user);
        if (target.manageable) {
          target.permissions.remove([PermissionsBitField.Flags.SendMessages]); // TODO: need testing
        } else {
          await message.channel.send("You cannot mute this user.");
        }
      }

      if (entry.action == "ban") {
        const target = await message.guild!.members.fetch(entry.user);
        if (target.bannable) {
          await target.ban({
            reason: entry.cause,
          });
          await message.channel.send(entry.message);
        } else {
          await message.channel.send("You cannot ban this user.");
        }
      }

      if (entry.action == "kick") {
        const target = await message.guild!.members.fetch(entry.user);
        if (target.kickable) {
          target.kick(entry.cause)
          await message.channel.send(entry.message);
        } else {
          await message.channel.send("You cannot kick this user.");
        }
      }

      if (entry.action == "add_role") {
        await message.channel.send(entry.message);
      }

      if (entry.action == "remove_role") {
        await message.channel.send(entry.message);
      }

      if (entry.action == "none") {
        await message.channel.send(entry.message);
      }
    }
  }
});


client.login(clientToken);
