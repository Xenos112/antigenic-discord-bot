import type { JSONResponse } from "../types";
import type { GuildMember } from "discord.js";

export default async function kick(member: GuildMember, entry: JSONResponse[number]): Promise<boolean> {
  if (member.kickable) {
    member.kick(entry.cause)
    return true
  } else {
    return false
  }
}
