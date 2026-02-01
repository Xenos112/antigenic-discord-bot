import type { ColorResolvable, Guild, GuildMember } from "discord.js";
import type { JSONResponse } from "../types";
import generateRandomHexColor from "../utils/random-hexcolor";

type AddRoleProps = {
  member: GuildMember,
  guild: Guild,
  entry: JSONResponse[number]
}

export default async function addRole({ member, guild, entry }: AddRoleProps) {
  const roleExists = guild.roles.cache.find(role => role.name === entry.role);
  if (!roleExists) {
    guild.roles.create({
      name: entry.role,
      colors: {
        primaryColor: generateRandomHexColor() as ColorResolvable
      },
    })
  }

  await member.roles.add(roleExists!);
  return true
}
