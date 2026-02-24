import axios, { AxiosInstance, AxiosError } from "axios";
import {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ApiError,
} from "@/types/registration.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

const handleAxiosError = (error: AxiosError<any>): ApiError => {
  const response = error.response?.data;
  return {
    code: response?.code || "REQUEST_FAILED",
    message: response?.message || error.message || "An error occurred",
    status: error.response?.status,
  };
};

export const registrationService = {
  async sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
    try {
      const response = await apiClient.post<SendOTPResponse>(
        "/api/auth/register/send-otp",
        data,
      );
      return response.data;
    } catch (error) {
      throw handleAxiosError(error as AxiosError<any>);
    }
  },

  async verifyOTPAndCreateUser(
    data: VerifyOTPRequest,
  ): Promise<VerifyOTPResponse> {
    try {
      const response = await apiClient.post<VerifyOTPResponse>(
        "/api/auth/register/verify-otp",
        data,
      );
      return response.data;
    } catch (error) {
      throw handleAxiosError(error as AxiosError<any>);
    }
  },
};
