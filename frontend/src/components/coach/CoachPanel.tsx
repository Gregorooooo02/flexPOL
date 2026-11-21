import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUp02Icon,
  Cancel01Icon,
  Delete02Icon,
  ViewIcon,
  WifiDisconnected01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
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
import type { Assignments } from '@/model';
import { hedgieImage, moodForReply } from './hedgie';
import type { HedgieMood } from './hedgie';
import { HedgieAvatar } from './HedgieAvatar';
import { useCoachChat } from './useCoachChat';
import type { ChatEntry, CoachChat } from './useCoachChat';

/** Must match CoachService.MAX_MESSAGE_LENGTH in the backend. */
const MAX_MESSAGE_LENGTH = 2000;

const DEFAULT_SUGGESTIONS = [
  'What is diversification?',
  'Why does my time horizon matter?',
  'What does liquidity mean?',
] as const;

export interface CoachPanelProps {
  /**
   * The conversation to show, from `useCoachChat()`. Pass it when the panel can unmount while the
   * conversation should live on (e.g. inside a dialog); without it the panel keeps its own.
   */
  readonly chat?: CoachChat;
  /** The lesson the learner is on. When set, the coach answers with that lesson as context. */
  readonly subchapterId?: number;
  /** The quiz question the learner is on, so "help me with this question" works. */
  readonly questionId?: number;
  /** The option the learner picked and had checked for `questionId`. Leave it out before they answer. */
  readonly selectedOptionId?: number;
  readonly assignments?: Assignments;
  /** Whether that checked answer was right. Only picks Hedgie's face (joy or encouragement). */
  readonly answerCorrect?: boolean;
  /** Shown in the header so the learner knows what the coach can see, e.g. "Question 2/4". */
  readonly contextLabel?: string;
  readonly title?: string;
  readonly description?: string;
  /** Starter questions shown while the conversation is empty. */
  readonly suggestions?: readonly string[];
  /** Optional dismiss action for sidebar or dialog layouts. */
  readonly onClose?: () => void;
  /** Layout only, e.g. a height. The panel fills the height it is given. */
  readonly className?: string;
}

/**
 * Chat with the AI coach (Hedgie), calling POST /api/coach/messages, so it can be dropped into a
 * lesson, a sandbox or a side panel. Each message carries the lesson and quiz question passed as
 * props. The backend remembers the conversation (see `useCoachChat`); clearing the chat starts a new one.
 *
 * To start a fresh conversation when the lesson changes, render it (or the owner of `chat`) with
 * `key={subchapterId}`.
 */
export function CoachPanel({
  chat: externalChat,
  subchapterId,
  questionId,
  selectedOptionId,
  assignments,
  answerCorrect,
  contextLabel,
  title = 'Ask Hedgie',
  description = 'Your learning coach. Ask about any concept; Hedgie explains, but never gives real investment advice.',
  suggestions = DEFAULT_SUGGESTIONS,
  onClose,
  className,
}: CoachPanelProps) {
  const ownChat = useCoachChat();
  const { entries, pending, clear } = externalChat ?? ownChat;
  const sendToCoach = (externalChat ?? ownChat).send;
  const [draft, setDraft] = useState('');

  function send(text: string) {
    if (!text.trim() || pending) {
      return;
    }
    sendToCoach(
      text,
      { subchapterId, questionId, selectedOptionId, assignments },
      moodForReply({ questionId, answerCorrect }),
    );
    setDraft('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  }

  const isEmpty = entries.length === 0 && !pending;

  return (
    <Card size="sm" className={cn('min-h-0', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {contextLabel && (
          <Badge variant="secondary" className="max-w-full">
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} data-icon="inline-start" />
            <span className="truncate">Hedgie sees: {contextLabel}</span>
          </Badge>
        )}
        <CardAction className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={clear}
            disabled={entries.length === 0 && !pending}
            title="Clear conversation"
            className="cursor-pointer text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
            <span className="sr-only">Clear conversation</span>
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={onClose}
              title="Close chat"
              className="cursor-pointer border-destructive/40"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        {isEmpty ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia>
                <img src={hedgieImage('greeting')} alt="Hedgie waving hello" className="size-24" />
              </EmptyMedia>
              <EmptyTitle>Hi, I'm Hedgie!</EmptyTitle>
              <EmptyDescription>
                Stuck on something? Pick a starter question or ask me anything about it.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {suggestions.map((suggestion) => (
                <Button key={suggestion} variant="outline" size="sm" onClick={() => send(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </EmptyContent>
          </Empty>
        ) : (
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
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
                      <CoachRow mood="hint">
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
              className="min-h-10 max-h-32 pr-3"
            />
            <InputGroupAddon align="inline-end" className="self-end py-1">
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
    <CoachRow mood={entry.mood}>
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

/** The coach's side of a row: Hedgie's face for this reply, name, then the given content. */
function CoachRow({ mood, children }: { readonly mood: HedgieMood; readonly children: React.ReactNode }) {
  return (
    <Message align="start">
      <MessageAvatar>
        <HedgieAvatar mood={mood} />
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
