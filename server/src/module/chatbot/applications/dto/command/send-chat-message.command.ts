export interface SendChatMessageCommand {
  sessionId: string;
  content: string;
  userId?: string | null;
  guestToken?: string | null;
}
