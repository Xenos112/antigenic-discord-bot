import type { OmitPartialGroupDMChannel, Message } from "discord.js";

export type Type = "mute" | "ban" | "kick" | "add_role" | "remove_role" | "none"

export type JSONResponse = Array<{
  action: Type,
  make_action: boolean,
  cause: string,
  time: number,
  message: string,
  user: string,
  role: string
}>


export type MessageContext = OmitPartialGroupDMChannel<Message<boolean>>;
