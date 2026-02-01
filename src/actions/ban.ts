import type { GuildMember } from "discord.js";
import type { JSONResponse } from "../types";

export default async function ban(member: GuildMember, entry: JSONResponse[number]): Promise<boolean> {
  if (member.bannable) {
    await member.ban({
      reason: entry.cause,
    });
    return true
  } else {
    return false
  }
}
