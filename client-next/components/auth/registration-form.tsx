"use client";

import type React from "react";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Percent as Person,
  ShoppingBag,
  Store,
} from "lucide-react";

export default function RegistrationForm() {
  const [userRole, setUserRole] = useState<"buyer" | "seller">("buyer");
  const [formData, setFormData] = useState({
    fullName: "",
    emailOrPhone: "",
    verificationCode: "",
    password: "",
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "password") {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = () => {
    const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    return labels[passwordStrength] || "Very Weak";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      userRole,
      ...formData,
    });
  };

  const handleSendCode = () => {
    console.log("Send verification code to:", formData.emailOrPhone);
  };

  return (
    <div className="w-full max-w-160 bg-white dark:bg-[#1a2632] shadow-xl rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] overflow-hidden">
      <div className="flex flex-col gap-2 p-8 border-b border-[#f0f2f4] dark:border-[#2c3e50]">
        <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
          Create Your Account
        </h1>
        <p className="text-[#617589] dark:text-gray-400 text-base font-normal">
          Join the leading marketplace to start buying and selling today.
        </p>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <p className="text-[#111418] dark:text-white text-sm font-bold uppercase tracking-wider mb-3">
            Register as
          </p>
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#f6f7f8] dark:bg-background-dark p-1">
            <label
              className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-[#617589] dark:text-gray-400 text-sm font-bold transition-all hover:text-[#111418] dark:hover:text-white"
              style={
                userRole === "buyer"
                  ? {
                      backgroundColor: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      color: "#137fec",
                    }
                  : {}
              }
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} />
                Buyer
              </span>
              <input
                type="radio"
                name="user_role"
                value="buyer"
                checked={userRole === "buyer"}
                onChange={(e) => setUserRole("buyer")}
                className="invisible w-0"
              />
            </label>
            <label
              className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-[#617589] dark:text-gray-400 text-sm font-bold transition-all hover:text-[#111418] dark:hover:text-white"
              style={
                userRole === "seller"
                  ? {
                      backgroundColor: "#2c3e50",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      color: "#137fec",
                    }
                  : {}
              }
            >
              <span className="flex items-center gap-2">
                <Store size={18} />
                Seller
              </span>
              <input
                type="radio"
                name="user_role"
                value="seller"
                checked={userRole === "seller"}
                onChange={(e) => setUserRole("seller")}
                className="invisible w-0"
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#111418] dark:text-gray-200 text-sm font-semibold">
              Full Name
            </label>
            <div className="relative">
              <Person
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-500"
                size={20}
              />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-12 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-semibold">
                Email or Phone Number
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-500"
                  size={20}
                />
                <input
                  type="text"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleInputChange}
                  placeholder="johndoe@example.com"
                  className="w-full rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-12 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-semibold">
                Verification Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  placeholder="123456"
                  className="flex-1 rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-4 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60 tracking-widest font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="whitespace-nowrap rounded-xl bg-[#137fec]/10 text-[#137fec] px-4 text-xs font-bold hover:bg-[#137fec]/20 transition-all border border-[#137fec]/20"
                >
                  Send Code
                </button>
              </div>
            </div>
          </div>

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
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-[#dbe0e6] dark:border-[#2c3e50] bg-white dark:bg-background-dark px-12 py-3.5 text-sm focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 dark:text-white placeholder:text-[#617589]/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-500 hover:text-[#111418] dark:hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

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
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      index < passwordStrength
                        ? "bg-[#137fec]"
                        : "bg-[#dbe0e6] dark:bg-[#3d5166]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="h-5 w-5 rounded border-[#dbe0e6] dark:border-[#2c3e50] text-[#137fec] focus:ring-[#137fec] cursor-pointer mt-0.5"
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

          <button
            type="submit"
            className="w-full h-14 bg-[#137fec] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Complete Registration
          </button>
        </form>

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
