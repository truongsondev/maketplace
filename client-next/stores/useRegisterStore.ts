import { create } from "zustand";
import { registrationService } from "@/services/registration.service";
import {
  RegistrationStep,
  UserRole,
  OTPError,
  User,
} from "@/types/registration.types";

interface RegistrationState {
  // Form State
  email: string;
  otp: string;
  password: string;
  fullName: string;
  termsAccepted: boolean;
  userRole: UserRole;

  // UI State
  currentStep: RegistrationStep;
  showPassword: boolean;
  passwordStrength: number;
  isLoading: boolean;
  error: OTPError | null;
  successMessage: string | null;

  // Timer State
  otpExpiration: number | null;
  otpAttempts: number;

  // Auth State
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;

  // Actions
  setEmail: (email: string) => void;
  setOTP: (otp: string) => void;
  setPassword: (password: string) => void;
  setFullName: (fullName: string) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setShowPassword: (show: boolean) => void;
  setCurrentStep: (step: RegistrationStep) => void;
  calculatePasswordStrength: (password: string) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;

  // API Actions
  sendOTP: () => Promise<void>;
  verifyOTPAndCreateUser: () => Promise<void>;
  resetForm: () => void;
}

const initialState = {
  email: "",
  otp: "",
  password: "",
  fullName: "",
  termsAccepted: false,
  userRole: "buyer" as UserRole,
  currentStep: "email" as RegistrationStep,
  showPassword: false,
  passwordStrength: 0,
  isLoading: false,
  error: null,
  successMessage: null,
  otpExpiration: null,
  otpAttempts: 0,
  accessToken: null,
  refreshToken: null,
  user: null,
};

export const useRegisterStore = create<RegistrationState>((set, get) => ({
  ...initialState,

  setEmail: (email: string) => set({ email }),
  setOTP: (otp: string) => set({ otp }),
  setPassword: (password: string) => {
    set({ password });
    get().calculatePasswordStrength(password);
  },
  setFullName: (fullName: string) => set({ fullName }),
  setTermsAccepted: (accepted: boolean) => set({ termsAccepted: accepted }),
  setUserRole: (role: UserRole) => set({ userRole: role }),
  setShowPassword: (show: boolean) => set({ showPassword: show }),
  setCurrentStep: (step: RegistrationStep) => set({ currentStep: step }),

  calculatePasswordStrength: (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    set({ passwordStrength: strength });
  },

  clearError: () => set({ error: null }),
  clearSuccessMessage: () => set({ successMessage: null }),

  sendOTP: async () => {
    const state = get();
    const { email } = state;

    // Validation
    if (!email || !email.includes("@")) {
      set({
        error: {
          code: "INVALID_EMAIL",
          message: "Vui lòng nhập email hợp lệ",
        },
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Call API to send OTP
      await registrationService.sendOTP({ email });

      set({
        successMessage: "Mã OTP đã được gửi đến email của bạn",
        currentStep: "verify",
        otpExpiration: Date.now() + 10 * 60 * 1000, // 10 minutes
        otpAttempts: 0,
      });
    } catch (err: any) {
      set({
        error: {
          code: err.code || "ERROR",
          message: err.message || "Có lỗi xảy ra. Vui lòng thử lại.",
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOTPAndCreateUser: async () => {
    const state = get();
    const { email, otp, password, userRole } = state;

    // Validation
    if (!otp || otp.length !== 6) {
      set({
        error: {
          code: "INVALID_OTP",
          message: "Vui lòng nhập mã OTP hợp lệ (6 chữ số)",
        },
      });
      return;
    }

    if (!password || password.length < 8) {
      set({
        error: {
          code: "WEAK_PASSWORD",
          message: "Mật khẩu phải có ít nhất 8 ký tự",
        },
      });
      return;
    }

    if (!state.termsAccepted) {
      set({
        error: {
          code: "TERMS_NOT_ACCEPTED",
          message: "Vui lòng chấp nhận điều khoản dịch vụ",
        },
      });
      return;
    }

    // Check OTP expiration
    if (state.otpExpiration && Date.now() > state.otpExpiration) {
      set({
        error: {
          code: "OTP_EXPIRED",
          message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
        },
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await registrationService.verifyOTPAndCreateUser({
        email,
        otp,
        password,
        userRole,
      });

      set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        successMessage: "Đăng ký tài khoản thành công!",
        currentStep: "verify", // Stays on verify, but success message shows completion
      });

      // Store tokens in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
      }
    } catch (err: any) {
      // Increment attempts on failed attempt
      set({
        otpAttempts: state.otpAttempts + 1,
      });

      set({
        error: {
          code: err.code || "ERROR",
          message: err.message || "Có lỗi xảy ra. Vui lòng thử lại.",
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  resetForm: () => set(initialState),
}));
