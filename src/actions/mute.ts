import { type GuildMember } from 'discord.js'
import { type JSONResponse } from '../types'

export default async function mute(member: GuildMember, entry: JSONResponse[number]): Promise<boolean> {
  if (member.manageable) {
    const timeMuted = entry.time * 60 * 1000;
    await member.timeout(timeMuted, entry.cause)
    return true
  } else {
    return false
  }
}
