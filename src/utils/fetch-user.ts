import { GuildMember } from "discord.js";
//const target = await message.guild.members.fetch(userId);

async function fetchUser(userId: string, guild: GuildMember) {
  const target = await guild.moderatable.fetch(userId);
  return target;
}
