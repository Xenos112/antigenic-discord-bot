import type { Guild, GuildMember } from "discord.js";
import type { JSONResponse } from "../types";

type AddRoleProps = {
  member: GuildMember,
  guild: Guild,
  entry: JSONResponse[number]
}

export default async function removeRole({ member, guild, entry }: AddRoleProps) {
  const roleExists = guild.roles.cache.find(role => role.name === entry.role);
  if (!roleExists) {
    return false
  }

  await member.roles.remove(roleExists!);
  return true
}
