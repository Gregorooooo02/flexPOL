import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiChat02Icon, ArrowUp02Icon, Delete02Icon, WifiDisconnected01Icon } from '@hugeicons/core-free-icons';
import { cn } from 'cn';
import { askCoach } from '@/api';
import { ApiError } from '@/config/axios';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import { Message, MessageAvatar, MessageContent, MessageHeader } from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { Spinner } from '@/components/ui/spinner';

/** Must match CoachService.MAX_MESSAGE_LENGTH in the backend. */
const MAX_MESSAGE_LENGTH = 2000;

const DEFAULT_SUGGESTIONS = [
  'What is diversification?',
  'Why does my time horizon matter?',
  'What does liquidity mean?',
] as const;

type ChatEntry =
  | { readonly id: number; readonly role: 'learner'; readonly text: string }
  | { readonly id: number; readonly role: 'coach'; readonly text: string; readonly status: 'ok' | 'offline' | 'error' };

export interface CoachPanelProps {
  /** The lesson the learner is on. When set, the coach answers with that lesson as context. */
  readonly subchapterId?: number;
  readonly title?: string;
  readonly description?: string;
  /** Starter questions shown while the conversation is empty. */
  readonly suggestions?: readonly string[];
  /** Layout only, e.g. a height. The panel fills the height it is given. */
  readonly className?: string;
}

/**
 * Chat with the AI coach (Hedgie). Self-contained: it keeps its own conversation and calls
 * POST /api/coach/messages, so it can be dropped into a lesson, a sandbox or a side panel.
 * The backend remembers the conversation: the panel only sends back the `conversationId` from
 * the first reply. Clearing the chat drops the id, so the next message starts a new conversation.
 *
 * To start a fresh conversation when the lesson changes, render it with `key={subchapterId}`.
 */
export function CoachPanel({
  subchapterId,
  title = 'Ask Hedgie',
  description = 'Your learning coach. Ask about any concept; Hedgie explains, but never gives real investment advice.',
  suggestions = DEFAULT_SUGGESTIONS,
  className,
}: CoachPanelProps) {
  const [entries, setEntries] = useState<readonly ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  /** Server-side conversation; undefined until the first reply, and again after clearing. */
  const [conversationId, setConversationId] = useState<string>();
  const nextId = useRef(0);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setEntries((current) => [...current, { id: nextId.current++, role: 'learner', text: message }]);
    setDraft('');
    setPending(true);

    let reply: ChatEntry;
    try {
      const response = await askCoach({ message, subchapterId, conversationId }, controller.signal);
      if (!controller.signal.aborted) {
        setConversationId(response.conversationId);
      }
      reply = {
        id: nextId.current++,
        role: 'coach',
        text: response.reply,
        status: response.aiAvailable ? 'ok' : 'offline',
      };
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const text = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      reply = { id: nextId.current++, role: 'coach', text, status: 'error' };
    }
    if (!controller.signal.aborted) {
      setEntries((current) => [...current, reply]);
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  }

  function clear() {
    request.current?.abort();
    setEntries([]);
    setPending(false);
    setConversationId(undefined);
  }

  const isEmpty = entries.length === 0 && !pending;

  return (
    <Card size="sm" className={cn('min-h-0', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" onClick={clear} disabled={entries.length === 0 && !pending}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            <span className="sr-only">Clear conversation</span>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        {isEmpty ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={AiChat02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No questions yet</EmptyTitle>
              <EmptyDescription>Pick a starter question or type your own.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {suggestions.map((suggestion) => (
                <Button key={suggestion} variant="outline" size="sm" onClick={() => void send(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </EmptyContent>
          </Empty>
        ) : (
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent>
                  {entries.map((entry) => (
                    <MessageScrollerItem key={entry.id} messageId={String(entry.id)} scrollAnchor={entry.role === 'learner'}>
                      {entry.role === 'learner' ? <LearnerMessage text={entry.text} /> : <CoachMessage entry={entry} />}
                    </MessageScrollerItem>
                  ))}
                  {pending && (
                    <MessageScrollerItem messageId="pending">
                      <CoachRow>
                        <Marker>
                          <MarkerIcon>
                            <Spinner />
                          </MarkerIcon>
                          <MarkerContent className="shimmer">Hedgie is thinking…</MarkerContent>
                        </Marker>
                      </CoachRow>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        )}
      </CardContent>

      <CardFooter>
        <form className="w-full" onSubmit={handleSubmit}>
          <InputGroup>
            <InputGroupTextarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Hedgie a question…"
              aria-label="Message to the coach"
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              className="max-h-32"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default" size="icon-sm" disabled={pending || !draft.trim()}>
                {pending ? <Spinner /> : <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />}
                <span className="sr-only">Send</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </CardFooter>
    </Card>
  );
}

function LearnerMessage({ text }: { readonly text: string }) {
  return (
    <Message align="end">
      <MessageContent>
        <Bubble align="end">
          <BubbleContent className="whitespace-pre-wrap">{text}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function CoachMessage({ entry }: { readonly entry: Extract<ChatEntry, { role: 'coach' }> }) {
  return (
    <CoachRow>
      {entry.status === 'offline' && (
        <Marker>
          <MarkerIcon>
            <HugeiconsIcon icon={WifiDisconnected01Icon} strokeWidth={2} />
          </MarkerIcon>
          <MarkerContent>AI coach offline</MarkerContent>
        </Marker>
      )}
      <Bubble variant={entry.status === 'error' ? 'destructive' : entry.status === 'offline' ? 'outline' : 'secondary'}>
        <BubbleContent>
          {entry.status === 'ok' ? <CoachMarkdown markdown={entry.text} /> : entry.text}
        </BubbleContent>
      </Bubble>
    </CoachRow>
  );
}

/** The coach's side of a row: avatar, name, then the given content. */
function CoachRow({ children }: { readonly children: React.ReactNode }) {
  return (
    <Message align="start">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>H</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Hedgie</MessageHeader>
        {children}
      </MessageContent>
    </Message>
  );
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="ml-4 flex list-disc flex-col gap-1">{children}</ul>,
  ol: ({ children }) => <ol className="ml-4 flex list-decimal flex-col gap-1">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
      {children}
    </a>
  ),
};

/** Model replies often use lists and bold text, so they are rendered as Markdown. */
function CoachMarkdown({ markdown }: { readonly markdown: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </Markdown>
    </div>
  );
}
