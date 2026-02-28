"use client";

import type React from "react";

import { useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import { useRegisterStore } from "@/stores/useRegisterStore";

export default function RegistrationForm() {
  const store = useRegisterStore();

  // Cleanup error/success messages after 5 seconds
  useEffect(() => {
    if (store.error) {
      const timer = setTimeout(() => store.clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [store.error, store.clearError]);

  useEffect(() => {
    if (store.successMessage) {
      const timer = setTimeout(() => store.clearSuccessMessage(), 5000);
      return () => clearTimeout(timer);
    }
  }, [store.successMessage, store.clearSuccessMessage]);

  const getPasswordStrengthLabel = () => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return labels[store.passwordStrength] || "Very Weak";
  };

  const getPasswordStrengthColor = () => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
    ];
    return colors[store.passwordStrength] || "bg-red-500";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.sendOTP();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.verifyOTPAndCreateUser();
  };

  return (
    <div className="w-full max-w-160 bg-white dark:bg-[#1a2632] shadow-xl rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] overflow-hidden">
      <div className="flex flex-col gap-2 p-8 border-b border-[#f0f2f4] dark:border-[#2c3e50]">
        <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
          {store.currentStep === "email"
            ? "Create Your Account"
            : "Verify Your Email"}
        </h1>
        <p className="text-[#617589] dark:text-gray-400 text-base font-normal">
          {store.currentStep === "email"
            ? "Join the leading marketplace to start buying and selling today."
            : "Enter the verification code sent to your email address."}
        </p>
      </div>

      <div className="p-8">
        {/* Error Message */}
        {store.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
            <AlertCircle
              className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <p className="text-red-800 dark:text-red-200 font-semibold text-sm">
                {store.error.code}
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {store.error.message}
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {store.successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex gap-3">
            <CheckCircle
              className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              size={20}
            />
            <p className="text-green-700 dark:text-green-300 text-sm">
              {store.successMessage}
            </p>
          </div>
        )}

        {/* Step 1: Email Input */}
        {store.currentStep === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-semibold">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-500"
                  size={20}
                />
                <input
                  type="email"
                  value={store.email}
                  onChange={(e) => store.setEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  disabled={store.isLoading}
                  className="w-full rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-12 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={store.isLoading || !store.email}
              className="w-full h-14 bg-[#137fec] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store.isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Sending...
                </>
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP & Password */}
        {store.currentStep === "verify" && (
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-semibold">
                Verification Code
              </label>
              <input
                type="text"
                value={store.otp}
                onChange={(e) => store.setOTP(e.target.value.slice(0, 6))}
                placeholder="000000"
                disabled={store.isLoading}
                maxLength={6}
                className="w-full rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-4 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60 tracking-widest font-mono text-center text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-[#617589] dark:text-gray-400">
                {store.otpExpiration
                  ? `OTP expires in ${Math.max(
                      0,
                      Math.ceil((store.otpExpiration - Date.now()) / 1000),
                    )} seconds`
                  : "Check your email for the code"}
              </p>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-semibold">
                Create Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-500"
                  size={20}
                />
                <input
                  type={store.showPassword ? "text" : "password"}
                  value={store.password}
                  onChange={(e) => store.setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={store.isLoading}
                  className="w-full rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-12 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => store.setShowPassword(!store.showPassword)}
                  disabled={store.isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-500 hover:text-[#111418] dark:hover:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {store.showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#617589]">
                    Password Strength
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#137fec]">
                    {getPasswordStrengthLabel()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#f0f2f4] dark:bg-[#2c3e50] rounded-full overflow-hidden flex gap-1">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        index < store.passwordStrength
                          ? getPasswordStrengthColor()
                          : "bg-[#dbe0e6] dark:bg-[#3d5166]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                checked={store.termsAccepted}
                onChange={(e) => store.setTermsAccepted(e.target.checked)}
                disabled={store.isLoading}
                className="h-5 w-5 rounded border-[#dbe0e6] dark:border-[#2c3e50] text-[#137fec] focus:ring-[#137fec] cursor-pointer mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-sm text-[#617589] dark:text-gray-400 leading-tight">
                By clicking Register, you agree to our{" "}
                <a
                  href="#"
                  className="text-[#137fec] font-semibold hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-[#137fec] font-semibold hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                store.isLoading ||
                !store.otp ||
                !store.password ||
                !store.termsAccepted
              }
              className="w-full h-14 bg-[#137fec] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store.isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                "Complete Registration"
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                store.setCurrentStep("email");
                store.setOTP("");
                store.setPassword("");
              }}
              disabled={store.isLoading}
              className="w-full h-12 border border-[#dbe0e6] dark:border-[#2c3e50] text-[#137fec] rounded-xl font-semibold hover:bg-[#137fec]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Email
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#f0f2f4] dark:border-[#2c3e50] text-center">
          <p className="text-[#617589] dark:text-gray-400 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[#137fec] font-bold hover:underline"
            >
              Log in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
