import { Client, GatewayIntentBits, Events } from "discord.js";
import { getJson } from "./prompts";
import mute from "./actions/mute";
import ban from "./actions/ban";
import kick from "./actions/kick";
import addRole from "./actions/add-role";

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
        try {
          const target = await message.guild!.members.fetch(entry.user);
          const muted = await mute(target, entry);
          if (muted) {
            await message.channel.send(entry.message);
          } else {
            await message.channel.send("You cannot mute this user.");
          }
        } catch (error) {
          await message.channel.send("Error occurred while trying to mute this user.");
        }
      }

      if (entry.action == "ban") {
        try {
          const target = await message.guild!.members.fetch(entry.user);
          const banned = await ban(target, entry);
          if (banned) {
            await message.channel.send(entry.message);
          } else {
            await message.channel.send("You cannot ban this user.");
          }
        } catch (error) {
          await message.channel.send("Error occurred while trying to ban this user.");
        }
      }

      if (entry.action == "kick") {
        try {
          const target = await message.guild!.members.fetch(entry.user);
          const kicked = await kick(target, entry);
          if (kicked) {
            await message.channel.send(entry.message);
          } else {
            await message.channel.send("You cannot kick this user.");
          }
        } catch (error) {
          await message.channel.send("Error occurred while trying to kick this user.");
        }
      }

      if (entry.action == "add_role") {
        try {
          const target = await message.guild!.members.fetch(entry.user);
          const roleAdded = await addRole({
            entry, guild: message.guild!,
            member: target
          })
          if (roleAdded) {
            await message.channel.send(entry.message);
          } else {
            await message.channel.send("You cannot add this role.");
          }
        } catch (error) {
          await message.channel.send("Error occurred while trying to add role to this user.");
        }
      }

      if (entry.action == "remove_role") {
        try {
          const target = await message.guild!.members.fetch(entry.user);
          const roleAdded = await addRole({
            entry, guild: message.guild!,
            member: target
          })
          if (roleAdded) {
            await message.channel.send(entry.message);
          } else {
            await message.channel.send("You cannot remove this role.");
          }
        } catch (error) {
          await message.channel.send("Error occurred while trying to remove role to this user.");
        }
      }

      if (entry.action == "none") {
        await message.channel.send(entry.message);
      }
    }
  }
});


client.login(clientToken);
