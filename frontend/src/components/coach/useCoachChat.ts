import { useEffect, useRef, useState } from 'react';
import { askCoach } from '@/api';
import { ApiError } from '@/config/axios';
import type { CoachRequest } from '@/model';
import type { HedgieMood } from './hedgie';

export type ChatEntry =
  | { readonly id: number; readonly role: 'learner'; readonly text: string }
  | {
      readonly id: number;
      readonly role: 'coach';
      readonly text: string;
      readonly status: 'ok' | 'offline' | 'error';
      /** Hedgie's face next to this reply. */
      readonly mood: HedgieMood;
    };

/** Where the learner is when they send a message. The backend turns these ids into prompt context. */
export type CoachMessageContext = Readonly<Pick<CoachRequest, 'subchapterId' | 'questionId' | 'selectedOptionId' | 'assignments' | 'number'>>;

export interface CoachChat {
  readonly entries: readonly ChatEntry[];
  readonly pending: boolean;
  /** `replyMood` is Hedgie's face for the reply; offline and error replies always get encouragement. */
  send(text: string, context: CoachMessageContext, replyMood?: HedgieMood): void;
  /** Empties the chat; the next message starts a new server-side conversation. */
  clear(): void;
}

/**
 * The state of one conversation with the AI coach. The backend remembers the conversation;
 * this hook keeps what is shown and the `conversationId` to send back.
 *
 * Call it in a component that outlives the chat UI (for example outside a dialog) to keep the
 * conversation while the UI is closed. Remount that component (`key`) to start a new conversation.
 */
export function useCoachChat(): CoachChat {
  const [entries, setEntries] = useState<readonly ChatEntry[]>([]);
  const [pending, setPending] = useState(false);
  /** Server-side conversation; undefined until the first reply, and again after clearing. */
  const [conversationId, setConversationId] = useState<string>();
  const nextId = useRef(0);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function sendAsync(text: string, context: CoachMessageContext, replyMood: HedgieMood) {
    const message = text.trim();
    if (!message || pending) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setEntries((current) => [...current, { id: nextId.current++, role: 'learner', text: message }]);
    setPending(true);

    let reply: ChatEntry;
    try {
      const response = await askCoach({ message, ...context, conversationId }, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setConversationId(response.conversationId);
      reply = {
        id: nextId.current++,
        role: 'coach',
        text: response.reply,
        status: response.aiAvailable ? 'ok' : 'offline',
        mood: response.aiAvailable ? replyMood : 'encouragement',
      };
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const errorText = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      reply = { id: nextId.current++, role: 'coach', text: errorText, status: 'error', mood: 'encouragement' };
    }
    setEntries((current) => [...current, reply]);
    setPending(false);
  }

  return {
    entries,
    pending,
    send: (text, context, replyMood = 'greeting') => void sendAsync(text, context, replyMood),
    clear: () => {
      request.current?.abort();
      setEntries([]);
      setPending(false);
      setConversationId(undefined);
    },
  };
}
