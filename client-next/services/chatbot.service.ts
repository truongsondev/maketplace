import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type { ChatbotSessionPayload } from "@/types/chatbot.types";

function logChatbotError(action: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    console.error(`[chatbot] ${action} failed`, error);
  }
}

export const chatbotService = {
  async startSession(guestToken?: string): Promise<ChatbotSessionPayload> {
    try {
      const response = await apiClient.post<ChatbotSessionPayload>(
        "api/chatbot/sessions",
        guestToken ? { guestToken } : {},
      );

      if (response.success) {
        return (response as ApiSuccessResponse<ChatbotSessionPayload>).data;
      }

      throw response as ApiErrorResponse;
    } catch (error) {
      logChatbotError("startSession", error);
      throw error;
    }
  },

  async getSession(sessionId: string): Promise<ChatbotSessionPayload> {
    try {
      const response = await apiClient.get<ChatbotSessionPayload>(
        `api/chatbot/sessions/${sessionId}`,
      );

      if (response.success) {
        return (response as ApiSuccessResponse<ChatbotSessionPayload>).data;
      }

      throw response as ApiErrorResponse;
    } catch (error) {
      logChatbotError("getSession", error);
      throw error;
    }
  },

  async sendMessage(
    sessionId: string,
    content: string,
  ): Promise<ChatbotSessionPayload> {
    try {
      const response = await apiClient.post<ChatbotSessionPayload>(
        `api/chatbot/sessions/${sessionId}/messages`,
        { content },
      );

      if (response.success) {
        return (response as ApiSuccessResponse<ChatbotSessionPayload>).data;
      }

      throw response as ApiErrorResponse;
    } catch (error) {
      logChatbotError("sendMessage", error);
      throw error;
    }
  },
};
