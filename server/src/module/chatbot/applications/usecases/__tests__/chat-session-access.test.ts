import { describe, expect, it } from '@jest/globals';
import { ForbiddenError } from '@/error-handlling/forbiddenError';
import { assertCanAccessChatSession } from '../chat-session-access';
import type { ChatSessionRecord } from '../../ports/output/chat-session.repository';

function makeSession(overrides: Partial<ChatSessionRecord>): ChatSessionRecord {
  return {
    id: 'session-1',
    userId: null,
    status: 'OPEN',
    guestToken: null,
    leadName: null,
    leadPhone: null,
    leadEmail: null,
    budgetMin: null,
    budgetMax: null,
    shopperProfile: null,
    lastIntent: null,
    lastSummary: null,
    lastSuggestedProductIds: [],
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
    ...overrides,
  };
}

describe('chat session access', () => {
  it('rejects a logged-in user accessing another user session', () => {
    const session = makeSession({ userId: 'user-1' });

    expect(() =>
      assertCanAccessChatSession(session, { userId: 'user-2' }),
    ).toThrow(ForbiddenError);
  });

  it('allows guest access only when the guest token matches', () => {
    const session = makeSession({ guestToken: 'guest-token-1' });

    expect(() =>
      assertCanAccessChatSession(session, { guestToken: 'guest-token-1' }),
    ).not.toThrow();
    expect(() =>
      assertCanAccessChatSession(session, { guestToken: 'guest-token-2' }),
    ).toThrow(ForbiddenError);
  });

  it('allows a logged-in request to continue an existing guest session with the matching guest token', () => {
    const session = makeSession({ userId: null, guestToken: 'guest-token-1' });

    expect(() =>
      assertCanAccessChatSession(session, {
        userId: 'user-1',
        guestToken: 'guest-token-1',
      }),
    ).not.toThrow();
  });
});
