"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MessageCircleMore,
  SendHorizonal,
  Sparkles,
  X,
} from "lucide-react";
import { chatbotService } from "@/services/chatbot.service";
import { useAuthStore } from "@/stores/auth.store";
import type {
  ChatbotMessage,
  ChatbotQuickReply,
  ChatbotSessionPayload,
} from "@/types/chatbot.types";

const SESSION_STORAGE_KEY = "aura-chatbot-session-id";
const GUEST_TOKEN_STORAGE_KEY = "aura-chatbot-guest-token";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80";

function getScopedStorageKey(baseKey: string, ownerKey: string): string {
  return `${baseKey}:${ownerKey}`;
}

function createGuestToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `guest_${crypto.randomUUID()}`;
  }

  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function ensureGuestToken(ownerKey: string): string {
  if (typeof window === "undefined") return "server";

  const storageKey = getScopedStorageKey(GUEST_TOKEN_STORAGE_KEY, ownerKey);
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = createGuestToken();
  window.localStorage.setItem(storageKey, next);
  return next;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeImage(url: string | null) {
  if (!url) return FALLBACK_IMAGE;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,c_fill,w_800,h_1000/",
    );
  }
  return url;
}

function getLastAssistantQuickReplies(
  messages: ChatbotMessage[],
): ChatbotQuickReply[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "ASSISTANT" && message.quickReplies.length > 0) {
      return message.quickReplies;
    }
  }

  return [];
}

export function ChatbotWidget() {
  const userId = useAuthStore((state) => state.user?.id);
  const chatOwnerKey = userId ? `user:${userId}` : "guest";
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatbotSessionPayload | null>(null);
  const [message, setMessage] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsBootstrapping(true);
      setErrorMessage(null);
      setSession(null);

      const sessionStorageKey = getScopedStorageKey(
        SESSION_STORAGE_KEY,
        chatOwnerKey,
      );

      try {
        const storedSessionId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(sessionStorageKey)
            : null;

        const payload = storedSessionId
          ? await chatbotService.getSession(storedSessionId)
          : await chatbotService.startSession(ensureGuestToken(chatOwnerKey));

        if (cancelled) return;

        setSession(payload);
        window.localStorage.setItem(sessionStorageKey, payload.session.id);
      } catch {
        if (cancelled) return;

        try {
          const payload = await chatbotService.startSession(
            ensureGuestToken(chatOwnerKey),
          );
          if (cancelled) return;
          setSession(payload);
          window.localStorage.setItem(sessionStorageKey, payload.session.id);
        } catch {
          if (!cancelled) {
            setErrorMessage(
              "Không thể khởi tạo tư vấn lúc này. Vui lòng thử lại.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [chatOwnerKey]);

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isOpen, session?.messages.length, isSending]);

  const quickReplies = useMemo(
    () => getLastAssistantQuickReplies(session?.messages ?? []),
    [session?.messages],
  );

  async function send(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || !session || isSending) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      const payload = await chatbotService.sendMessage(
        session.session.id,
        trimmed,
      );
      setSession(payload);
      setMessage("");
      window.localStorage.setItem(
        getScopedStorageKey(SESSION_STORAGE_KEY, chatOwnerKey),
        payload.session.id,
      );
    } catch {
      setErrorMessage("Gửi tin nhắn thất bại. Bạn thử lại giúp mình nhé.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-3 rounded-full bg-[#111111] px-5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-0.5"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/12">
          <MessageCircleMore className="size-4" />
        </span>
        <span className="hidden sm:inline">Tư vấn chọn đồ</span>
      </button>

      {isOpen ? (
        <section className="fixed bottom-24 right-5 z-50 flex h-[min(78vh,700px)] w-[min(calc(100vw-2rem),390px)] flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[#fcfaf7] shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#111111_0%,#2b211b_55%,#7a4b30_100%)] px-5 py-4 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,166,77,0.22),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  Aura Sales AI
                </p>
                <h2 className="mt-1 text-lg font-black">Chọn đồ nhanh hơn</h2>
                <p className="mt-1 text-sm text-white/80">
                  Gợi ý theo ngân sách, mục đích mặc và phong cách.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {isBootstrapping ? (
              <div className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-neutral-700 shadow-sm">
                <Loader2 className="size-4 animate-spin" />
                Đang khởi động trợ lý tư vấn...
              </div>
            ) : null}

            {session?.messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${
                  item.role === "USER" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm shadow-sm ${
                    item.role === "USER"
                      ? "bg-[#111111] text-white"
                      : "bg-white text-neutral-800"
                  }`}
                >
                  {item.role !== "USER" ? (
                    <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b5a3c]">
                      <Sparkles className="size-3.5" />
                      Aura gợi ý
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>

                  {item.suggestedProducts.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {item.suggestedProducts.map((product) => (
                        <a
                          key={product.id}
                          href={product.href}
                          className="flex gap-3 rounded-2xl border border-[#ece7df] bg-[#faf7f2] p-2.5 transition-colors hover:border-[#c89d7a]"
                        >
                          <div className="relative h-22 w-18 shrink-0 overflow-hidden rounded-xl bg-[#f1ece5]">
                            <Image
                              src={normalizeImage(product.imageUrl)}
                              alt={product.name}
                              fill
                              sizes="72px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
                              {product.name}
                            </p>
                            <p className="mt-2 text-sm font-black text-[#7a4b30]">
                              {formatCurrency(product.minPrice)}
                            </p>
                            <span className="mt-3 inline-flex rounded-full bg-[#111111] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
                              Xem sản phẩm
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-[22px] bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tìm sản phẩm phù hợp...
                  </div>
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
          </div>

          {quickReplies.length > 0 ? (
            <div className="border-t border-black/6 px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickReplies.map((reply) => (
                  <button
                    key={`${reply.label}-${reply.value}`}
                    type="button"
                    onClick={() => void send(reply.value)}
                    className="shrink-0 rounded-full border border-[#d9c7b9] bg-white px-3 py-2 text-xs font-semibold text-[#6f4a34]"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <form
            className="border-t border-black/6 bg-white px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(message);
            }}
          >
            <div className="flex items-end gap-3">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={1}
                placeholder="Ví dụ: mình cần đồ đi làm dưới 700k"
                className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-[#ddd4ca] bg-[#fbfaf8] px-4 py-3 text-sm outline-none transition-colors focus:border-[#7a4b30]"
              />
              <button
                type="submit"
                disabled={isSending || isBootstrapping || !message.trim()}
                className="inline-flex size-12 items-center justify-center rounded-full bg-[#111111] text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SendHorizonal className="size-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}
