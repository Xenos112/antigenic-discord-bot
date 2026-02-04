import type { MessageContext } from "../types";

export function isModerator(messageContext: MessageContext): boolean {
  if (!messageContext.member) return false;
  
  return messageContext.member.permissions.has("Administrator") || 
         messageContext.member.permissions.has("BanMembers") ||
         messageContext.member.permissions.has("KickMembers") ||
         messageContext.member.permissions.has("ManageRoles");
}

export function requireModerator(messageContext: MessageContext): { allowed: boolean; message?: string } {
  const hasPermission = isModerator(messageContext);
  
  if (!hasPermission) {
    return {
      allowed: false,
      message: "You need moderator permissions to use this command."
    };
  }
  
  return { allowed: true };
}