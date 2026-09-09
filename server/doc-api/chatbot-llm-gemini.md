# Chatbot Gemini LLM Tool Calling

## Overview

Public chatbot API stays compatible with the existing frontend:

- `POST /api/chatbot/sessions`
- `GET /api/chatbot/sessions/:sessionId`
- `POST /api/chatbot/sessions/:sessionId/messages`

When `CHATBOT_LLM_ENABLED=true` and `CHATBOT_LLM_PROVIDER=gemini`, message handling uses Gemini with the internal `searchProducts` tool. If Gemini fails, times out, or quota is exhausted, the use case falls back to the existing deterministic sales assistant unless `CHATBOT_LLM_FALLBACK_TO_RULE_BASED=false`.

Older `gemini-2.0-flash*` model ids are deprecated and may already be unavailable. The chatbot module upgrades those legacy values to `gemini-2.5-flash` automatically at runtime.

## Environment

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_BASE_URL=https://api.shopaikey.com/v1beta
GEMINI_MODEL=gemini-2.5-flash
CHATBOT_LLM_PROVIDER=gemini
CHATBOT_LLM_ENABLED=true
CHATBOT_LLM_MAX_TOOL_CALLS=3
CHATBOT_LLM_TIMEOUT_MS=15000
CHATBOT_LLM_FALLBACK_TO_RULE_BASED=true
```

## Tool

`searchProducts` accepts:

```ts
type SearchProductsToolInput = {
  search?: string;
  category?: string;
  color?: string;
  size?: string;
  usageOccasion?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
};
```

The backend normalizes the input, caps `limit` at `4`, queries the real product catalog, and returns only real products:

```ts
type SearchProductsToolResult = {
  items: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    minPrice: number;
    href: string;
    categorySlugs?: string[];
    usageOccasions?: string[];
  }>;
  total: number;
};
```

## Response Contract

The API response remains `ChatSessionResult`. Assistant messages may include:

- `suggestedProducts`: cards rendered by the current frontend widget.
- `quickReplies`: same shape as the previous chatbot.
- session summary fields: `status`, `leadPhone`, `leadEmail`, `lastIntent`.

No frontend contract change is required for Phase 1.
