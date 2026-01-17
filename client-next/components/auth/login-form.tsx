"use client";

import type React from "react";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="flex-1 p-8 lg:p-12">
      {/* Tabs */}
      <div className="pb-8">
        <div className="flex border-b border-[#e6dedb] dark:border-[#3d2a24] gap-8">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
              activeTab === "login"
                ? "border-b-[#f45925] text-[#f45925]"
                : "border-b-transparent text-[#8a6b60] dark:text-[#d1c2bc] hover:text-[#f45925]"
            }`}
          >
            <p className="text-sm font-bold leading-normal tracking-[0.015em]">
              Login
            </p>
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
              activeTab === "register"
                ? "border-b-[#f45925] text-[#f45925]"
                : "border-b-transparent text-[#8a6b60] dark:text-[#d1c2bc] hover:text-[#f45925]"
            }`}
          >
            <p className="text-sm font-bold leading-normal tracking-[0.015em]">
              Register
            </p>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="flex flex-col gap-2">
          <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">
            Email or Phone Number
          </label>
          <input
            type="text"
            placeholder="Enter your email or phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex w-full rounded-lg text-[#181311] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#f45925]/20 border border-[#e6dedb] dark:border-[#3d2a24] bg-white dark:bg-[#1a0e0b] focus:border-[#f45925] h-14 placeholder:text-[#8a6b60] dark:placeholder:text-[#8a6b60] p-4 text-base font-normal transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">
              Password
            </label>
            <a
              className="text-[#f45925] text-xs font-semibold hover:underline"
              href="#"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative flex items-stretch">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex w-full rounded-lg text-[#181311] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#f45925]/20 border border-[#e6dedb] dark:border-[#3d2a24] bg-white dark:bg-[#1a0e0b] focus:border-[#f45925] h-14 placeholder:text-[#8a6b60] dark:placeholder:text-[#8a6b60] p-4 pr-12 text-base font-normal transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a6b60] hover:text-[#f45925] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-14 bg-[#f45925] text-white rounded-lg font-bold text-lg shadow-lg shadow-[#f45925]/20 hover:bg-opacity-95 transform hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          Log In
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-4 items-center">
        <div className="grow border-t border-[#e6dedb] dark:border-[#3d2a24]"></div>
        <span className="shrink mx-4 text-[#8a6b60] text-xs uppercase font-bold tracking-widest">
          Or login with
        </span>
        <div className="grow border-t border-[#e6dedb] dark:border-[#3d2a24]"></div>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-3 gap-4">
        <button className="flex items-center justify-center h-12 border border-[#e6dedb] dark:border-[#3d2a24] rounded-lg bg-white dark:bg-[#1a0e0b] hover:bg-[#f8f6f5] dark:hover:bg-[#221410] transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            ></path>
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            ></path>
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            ></path>
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            ></path>
          </svg>
        </button>
        <button className="flex items-center justify-center h-12 border border-[#e6dedb] dark:border-[#3d2a24] rounded-lg bg-white dark:bg-[#1a0e0b] hover:bg-[#f8f6f5] dark:hover:bg-[#221410] transition-colors">
          <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
          </svg>
        </button>
        <button className="flex items-center justify-center h-12 border border-[#e6dedb] dark:border-[#3d2a24] rounded-lg bg-white dark:bg-[#1a0e0b] hover:bg-[#f8f6f5] dark:hover:bg-[#221410] transition-colors">
          <svg
            className="w-5 h-5 dark:fill-white"
            fill="#000"
            viewBox="0 0 24 24"
          >
            <path d="M17.073 21.316c-1.371 0-3.154-.866-4.484-.866-1.353 0-3.327.882-4.484.882-2.73 0-6.494-4.832-6.494-9.337 0-4.305 2.63-6.606 5.166-6.606 1.353 0 2.568.832 3.804.832 1.253 0 2.378-.832 3.804-.832 1.875 0 3.376.816 4.305 2.193-3.605 1.731-3.027 6.848.562 8.356-.992 2.663-2.31 5.378-4.179 5.378zm-3.064-16.733c-.016-3.414 3.012-6.126 5.955-5.949.193 3.39-2.924 6.174-5.955 5.949z"></path>
          </svg>
        </button>
      </div>

      {/* Switch to Seller */}
      <div className="text-center pt-4">
        <p className="text-sm text-[#8a6b60] dark:text-[#d1c2bc]">
          Are you a seller?
          <a className="text-[#f45925] font-bold hover:underline ml-1" href="#">
            Login to Seller Centre
          </a>
        </p>
      </div>
    </div>
  );
}
