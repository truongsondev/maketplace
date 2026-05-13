import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type { ChatbotSessionPayload } from "@/types/chatbot.types";

export const chatbotService = {
  async startSession(guestToken?: string): Promise<ChatbotSessionPayload> {
    const response = await apiClient.post<ChatbotSessionPayload>(
      "api/chatbot/sessions",
      guestToken ? { guestToken } : {},
    );

    if (response.success) {
      return (response as ApiSuccessResponse<ChatbotSessionPayload>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getSession(sessionId: string): Promise<ChatbotSessionPayload> {
    const response = await apiClient.get<ChatbotSessionPayload>(
      `api/chatbot/sessions/${sessionId}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<ChatbotSessionPayload>).data;
    }

    throw response as ApiErrorResponse;
  },

  async sendMessage(
    sessionId: string,
    content: string,
  ): Promise<ChatbotSessionPayload> {
    const response = await apiClient.post<ChatbotSessionPayload>(
      `api/chatbot/sessions/${sessionId}/messages`,
      { content },
    );

    if (response.success) {
      return (response as ApiSuccessResponse<ChatbotSessionPayload>).data;
    }

    throw response as ApiErrorResponse;
  },
};
