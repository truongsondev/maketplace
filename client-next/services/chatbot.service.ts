import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type { ChatbotSessionPayload } from "@/types/chatbot.types";

// Một lượt chat có thể gồm phân loại intent và sinh câu trả lời tuần tự.
// Timeout mặc định 10 giây của apiClient ngắn hơn tổng thời gian xử lý Gemini.
const CHATBOT_MESSAGE_TIMEOUT_MS = 60_000;

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

  async getSession(sessionId: string, guestToken?: string): Promise<ChatbotSessionPayload> {
    try {
      const response = await apiClient.get<ChatbotSessionPayload>(
        `api/chatbot/sessions/${sessionId}`,
        guestToken
          ? {
              headers: {
                "x-chatbot-guest-token": guestToken,
              },
            }
          : undefined,
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
    guestToken?: string,
  ): Promise<ChatbotSessionPayload> {
    try {
      const response = await apiClient.post<ChatbotSessionPayload>(
        `api/chatbot/sessions/${sessionId}/messages`,
        guestToken ? { content, guestToken } : { content },
        { timeout: CHATBOT_MESSAGE_TIMEOUT_MS },
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
