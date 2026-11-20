import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  FlaskConicalIcon,
  RefreshIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from 'cn';
import { getQuiz, getSubchapter, getSubchapterControlQuiz, submitAnswer } from '@/api';
import { ApiError } from '@/config/axios';
import type { AnswerOption, AnswerResult, Question, Quiz } from '@/model';
import type { LearningNode, TopicDefinition } from './learningPath';
import { LessonMarkdown } from './LessonMarkdown';
import { HedgieCelebration } from './hedgie/HedgieCelebration';
import { useHedgieScene } from './hedgie/useHedgieScene';

interface LessonPageProps {
  readonly node: LearningNode;
  readonly topic: TopicDefinition;
  readonly isCompleted: boolean;
  readonly isTopicSandboxUnlocked: boolean;
  readonly nextNodeSummary: string | null;
  readonly onComplete: (nodeId: string) => void;
  readonly onBack: () => void;
  readonly onOpenSandbox: () => void;
}

interface TheorySection {
  readonly heading: string | null;
  readonly markdown: string;
}

interface LessonContent {
  readonly sections: readonly TheorySection[];
  readonly readingMinutes: number | null;
  readonly quiz: Quiz | null;
}

type ContentState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly content: LessonContent };

type LessonStep =
  | { readonly kind: 'theory' }
  | { readonly kind: 'question'; readonly index: number }
  | { readonly kind: 'result'; readonly passed: boolean };

interface AnswerState {
  readonly optionId: number;
  readonly status: 'checking' | 'checked' | 'error';
  readonly result: AnswerResult | null;
  readonly errorMessage: string | null;
}

type AnswerMap = Readonly<Partial<Record<number, AnswerState>>>;

type OptionLook = 'idle' | 'checking' | 'correct' | 'wrong';

const WORDS_PER_MINUTE = 180;

/** Splits lesson Markdown into one card per "###" section. */
function splitIntoSections(markdown: string): TheorySection[] {
  const sections: TheorySection[] = [];
  let heading: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    const body = lines.join('\n').trim();
    if (heading !== null || body) {
      sections.push({ heading, markdown: body });
    }
  };
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^###\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = match[1].trim();
      lines = [];
    } else {
      lines.push(line);
    }
  }
  flush();
  return sections;
}

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function formatQuestionCount(count: number): string {
  return count === 1 ? '1 question' : `${count} questions`;
}

function errorMessageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Unknown error.';
}

function sortQuestions(quiz: Quiz): Quiz {
  return { ...quiz, questions: [...quiz.questions].sort((a, b) => a.sortOrder - b.sortOrder) };
}

/** The final quiz has no lesson text, so its intro is built from the chapter and the quiz rules. */
function checkpointSections(topic: TopicDefinition, quiz: Quiz): TheorySection[] {
  const sections: TheorySection[] = [];
  if (topic.objective) {
    sections.push({ heading: 'What this test checks', markdown: topic.objective });
  }
  const count = formatQuestionCount(quiz.questions.length);
  sections.push({
    heading: 'How to pass',
    markdown:
      quiz.passMark !== null
        ? `${count} covering the whole chapter, with one try each. You need at least **${quiz.passMark} correct answers** to pass.`
        : `${count} covering the whole chapter. Answer each one correctly.`,
  });
  sections.push({
    heading: 'What you unlock',
    markdown: `The **${topic.sandboxShortLabel}** sandbox: ${topic.sandboxDescription}`,
  });
  return sections;
}

async function loadLessonContent(
  node: LearningNode,
  topic: TopicDefinition,
  signal: AbortSignal,
): Promise<LessonContent> {
  if (node.kind === 'lesson') {
    const [subchapter, quiz] = await Promise.all([
      getSubchapter(node.subchapterId, signal),
      getSubchapterControlQuiz(node.subchapterId, signal).catch((error: unknown) => {
        if (error instanceof ApiError && error.isNotFound) {
          return null;
        }
        throw error;
      }),
    ]);
    return {
      sections: splitIntoSections(subchapter.lessonMarkdown),
      readingMinutes: estimateReadingMinutes(subchapter.lessonMarkdown),
      quiz: quiz ? sortQuestions(quiz) : null,
    };
  }
  const quiz = sortQuestions(await getQuiz(node.quizId, signal));
  return { sections: checkpointSections(topic, quiz), readingMinutes: null, quiz };
}

/** Scored quizzes allow one answer per question; practice quizzes allow retries until correct. */
function isAnswerLocked(answer: AnswerState | undefined, isScored: boolean): boolean {
  if (!answer) {
    return false;
  }
  if (answer.status === 'checking') {
    return true;
  }
  if (answer.status !== 'checked' || !answer.result) {
    return false;
  }
  return isScored || answer.result.correct;
}

function getOptionLook(option: AnswerOption, answer: AnswerState | undefined, isScored: boolean): OptionLook {
  if (!answer) {
    return 'idle';
  }
  const isSelected = answer.optionId === option.id;
  if (answer.status === 'checking') {
    return isSelected ? 'checking' : 'idle';
  }
  if (answer.status !== 'checked' || !answer.result) {
    return 'idle';
  }
  if (isSelected) {
    return answer.result.correct ? 'correct' : 'wrong';
  }
  // A scored quiz has no retry, so it shows the right answer straight away
  if (isScored && option.id === answer.result.correctOptionId) {
    return 'correct';
  }
  return 'idle';
}

export function LessonPage({
  node,
  topic,
  isCompleted,
  isTopicSandboxUnlocked,
  nextNodeSummary,
  onComplete,
  onBack,
  onOpenSandbox,
}: LessonPageProps) {
  const [contentState, setContentState] = useState<ContentState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [step, setStep] = useState<LessonStep>({ kind: 'theory' });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flashKey, setFlashKey] = useState<{ optionId: number; seq: number } | null>(null);
  const answerAbortRef = useRef<AbortController | null>(null);
  const hasHedgie = node.kind === 'lesson';
  const loadHedgie = useHedgieScene(hasHedgie);

  useEffect(() => {
    const controller = new AbortController();
    loadLessonContent(node, topic, controller.signal)
      .then((content) => {
        setContentState({ status: 'ready', content });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setContentState({ status: 'error', message: errorMessageOf(error) });
        }
      });
    return () => controller.abort();
  }, [node, topic, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    answerAbortRef.current = controller;
    return () => controller.abort();
  }, []);

  const content = contentState.status === 'ready' ? contentState.content : null;
  const quiz = content?.quiz ?? null;
  const questions: readonly Question[] = quiz?.questions ?? [];
  const questionCount = questions.length;
  const isScored = quiz !== null && quiz.passMark !== null;
  const passMark = quiz?.passMark ?? questionCount;
  const score = questions.reduce(
    (acc, question) => (answers[question.id]?.result?.correct ? acc + 1 : acc),
    0,
  );

  const currentQuestion = step.kind === 'question' ? (questions[step.index] ?? null) : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentResult = currentAnswer?.status === 'checked' ? currentAnswer.result : null;
  const canAdvance = currentResult !== null && (isScored || currentResult.correct);
  const isLastQuestion = step.kind === 'question' && step.index + 1 >= questionCount;

  const stepLabel =
    step.kind === 'theory'
      ? 'Theory'
      : step.kind === 'question'
        ? `Question ${step.index + 1}/${questionCount}`
        : step.passed
          ? 'Passed'
          : 'Not passed';

  const progressPct =
    step.kind === 'result'
      ? 100
      : content === null
        ? 0
        : Math.round(((step.kind === 'theory' ? 1 : step.index + 2) / (questionCount + 2)) * 100);

  const goToStep = (nextStep: LessonStep) => {
    setStep(nextStep);
    window.scrollTo({ top: 0 });
  };

  const finish = (passed: boolean) => {
    if (passed) {
      onComplete(node.id);
    }
    goToStep({ kind: 'result', passed });
  };

  const handleRetryLoad = () => {
    setContentState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  };

  const handleStartQuestions = () => {
    if (questionCount === 0) {
      finish(true);
      return;
    }
    goToStep({ kind: 'question', index: 0 });
  };

  const handleSelectOption = (question: Question, option: AnswerOption) => {
    if (isAnswerLocked(answers[question.id], isScored)) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { optionId: option.id, status: 'checking', result: null, errorMessage: null },
    }));
    setFlashKey((prev) => ({ optionId: option.id, seq: (prev?.seq ?? 0) + 1 }));

    // Only apply a response if the learner hasn't picked something else (or restarted) meanwhile
    const isStillPending = (prev: AnswerMap) =>
      prev[question.id]?.optionId === option.id && prev[question.id]?.status === 'checking';

    submitAnswer(question.id, option.id, answerAbortRef.current?.signal)
      .then((result) => {
        setAnswers((prev) =>
          isStillPending(prev)
            ? {
                ...prev,
                [question.id]: { optionId: option.id, status: 'checked', result, errorMessage: null },
              }
            : prev,
        );
      })
      .catch((error: unknown) => {
        if (answerAbortRef.current?.signal.aborted) {
          return;
        }
        setAnswers((prev) =>
          isStillPending(prev)
            ? {
                ...prev,
                [question.id]: {
                  optionId: option.id,
                  status: 'error',
                  result: null,
                  errorMessage: errorMessageOf(error),
                },
              }
            : prev,
        );
      });
  };

  const handleAdvanceFromQuestion = () => {
    if (step.kind !== 'question') {
      return;
    }
    if (!isLastQuestion) {
      goToStep({ kind: 'question', index: step.index + 1 });
      return;
    }
    finish(!isScored || score >= passMark);
  };

  const handleBackFromQuestion = () => {
    if (step.kind !== 'question') {
      return;
    }
    setStep(step.index === 0 ? { kind: 'theory' } : { kind: 'question', index: step.index - 1 });
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    goToStep({ kind: 'question', index: 0 });
  };

  const correctLabel =
    currentQuestion && currentResult
      ? currentQuestion.options.find((option) => option.id === currentResult.correctOptionId)?.label
      : undefined;

  return (
    <div
      className={cn(
        'flex flex-1 flex-col justify-between',
        topic.bandClassName,
      )}
      style={{ backgroundImage: topic.ambientGlow }}
    >
      <header className="sticky top-[var(--app-header-height)] z-20 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-4 py-3 lg:max-w-3xl">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 transition-transform active:scale-95"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.2} />
              Path
            </Button>

            <Badge
              className="px-2.5 py-0.5 font-semibold"
              style={
                step.kind === 'result' && step.passed
                  ? { backgroundColor: topic.accentHex, color: '#07090a' }
                  : {
                      backgroundColor: '#21292b',
                      color: topic.accentHex,
                      borderColor: topic.pipeSecondary,
                    }
              }
            >
              {stepLabel}
            </Badge>

            {step.kind !== 'result' && !isCompleted ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => finish(true)}
                className="transition-transform active:scale-95"
              >
                Complete (demo)
              </Button>
            ) : (
              <Badge variant="outline" className="border border-border px-2 py-0.5 tabular-nums">
                {node.code}
              </Badge>
            )}
          </div>

          <Progress
            value={progressPct}
            aria-label={`Lesson ${node.code} progress`}
            className="[&_[data-slot=progress-track]]:h-1.5"
            style={
              {
                '--primary': topic.accentHex,
              } as Record<string, string>
            }
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6 lg:max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className="px-2 py-0.5 text-[#07090a]"
            style={{ backgroundColor: topic.pipeColor }}
          >
            {topic.title}
          </Badge>
          <Badge variant="outline" className="border border-border px-2 py-0.5 tabular-nums">
            {node.code}
          </Badge>
          {content?.readingMinutes != null && (
            <Badge variant="secondary" className="px-2 py-0.5">
              {content.readingMinutes} min
            </Badge>
          )}
          {questionCount > 0 && (
            <Badge variant="secondary" className="px-2 py-0.5">
              {formatQuestionCount(questionCount)}
            </Badge>
          )}
          {isCompleted && step.kind !== 'result' && (
            <Badge
              className="px-2 py-0.5 text-[#07090a]"
              style={{ backgroundColor: topic.accentHex }}
            >
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.4} />
              Completed before
            </Badge>
          )}
        </div>

        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {node.title}
        </h1>

        <Separator />

        {step.kind !== 'result' && contentState.status === 'loading' && (
          <Card size="sm" className="border border-border bg-card/90 py-4" role="status" aria-live="polite">
            <CardContent className="flex flex-col gap-2.5 px-4">
              <span className="text-sm text-muted-foreground">Loading the lesson…</span>
              <div className="h-3 w-3/4 animate-pulse bg-secondary" />
              <div className="h-3 w-full animate-pulse bg-secondary" />
              <div className="h-3 w-2/3 animate-pulse bg-secondary" />
            </CardContent>
          </Card>
        )}

        {step.kind !== 'result' && contentState.status === 'error' && (
          <Card size="sm" className="border border-[#ba4d00]/80 bg-[#973b00]/20 py-4" role="alert">
            <CardHeader className="px-4">
              <CardTitle className="text-sm normal-case tracking-normal">
                Couldn't load the lesson
              </CardTitle>
              <CardDescription className="text-xs">{contentState.message}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pt-2">
              <Button type="button" size="sm" variant="outline" onClick={handleRetryLoad}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {step.kind === 'theory' && content && (
          <div className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            {content.sections.map((section, index) => (
              <Card
                key={`${index}-${section.heading ?? ''}`}
                size="sm"
                className="border border-border bg-card/90 py-4"
              >
                {section.heading !== null && (
                  <CardHeader className="px-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        className="px-2 py-0.5"
                        style={{
                          backgroundColor: '#21292b',
                          color: topic.accentHex,
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Badge>
                      <CardTitle className="text-sm normal-case tracking-normal">
                        {section.heading}
                      </CardTitle>
                    </div>
                  </CardHeader>
                )}
                {section.markdown && (
                  <CardContent className="px-4">
                    <LessonMarkdown markdown={section.markdown} accentHex={topic.accentHex} />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {currentQuestion && (
          <div
            key={currentQuestion.id}
            className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          >
            <Card size="sm" className="border border-border bg-card/90 py-4">
              <CardHeader className="px-4">
                <Badge
                  className="px-2 py-0.5"
                  style={{ backgroundColor: '#21292b', color: topic.accentHex }}
                >
                  Question {step.kind === 'question' ? step.index + 1 : 0} of {questionCount}
                </Badge>
                <CardTitle className="mt-1.5 text-base leading-snug normal-case tracking-normal">
                  {currentQuestion.prompt}
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="flex flex-col gap-2.5">
              {currentQuestion.options.map((option) => {
                const look = getOptionLook(option, currentAnswer, isScored);
                const isSelected = currentAnswer?.optionId === option.id;
                const isFlashing = flashKey?.optionId === option.id;
                const isLocked = isAnswerLocked(currentAnswer, isScored);

                return (
                  <Button
                    key={`${option.id}-${isFlashing ? flashKey.seq : 0}`}
                    type="button"
                    variant="outline"
                    aria-pressed={isSelected}
                    aria-disabled={isLocked ? 'true' : undefined}
                    onClick={() => handleSelectOption(currentQuestion, option)}
                    className={cn(
                      'relative h-auto min-h-13 w-full justify-start gap-3 overflow-hidden px-4 py-3 text-left text-sm font-normal tracking-normal whitespace-normal normal-case transition-transform active:scale-[0.98]',
                      isFlashing && 'fx-option-pop fx-sheen',
                      isLocked && 'cursor-default',
                      look === 'checking' && 'animate-pulse',
                      look === 'correct' &&
                        'bg-[#efb100]/15 text-foreground hover:bg-[#efb100]/20',
                      look === 'wrong' &&
                        'border-[#ba4d00] bg-[#973b00]/25 text-foreground hover:bg-[#973b00]/30',
                    )}
                    style={
                      look === 'correct'
                        ? {
                            borderColor: topic.accentHex,
                            boxShadow: `0 0 18px -4px ${topic.accentHex}66`,
                          }
                        : look === 'checking'
                          ? { borderColor: topic.pipeSecondary }
                          : undefined
                    }
                  >
                    <Badge
                      className={cn(
                        'size-6 shrink-0 justify-center border border-border bg-secondary text-foreground',
                        look === 'wrong' && 'border-[#ba4d00] bg-[#ba4d00] text-[#fafbfb]',
                      )}
                      style={
                        look === 'correct'
                          ? {
                              backgroundColor: topic.accentHex,
                              borderColor: topic.pipeSecondary,
                              color: '#07090a',
                            }
                          : undefined
                      }
                    >
                      {option.label}
                    </Badge>
                    <span>{option.text}</span>
                  </Button>
                );
              })}
            </div>

            {currentAnswer?.status === 'checking' && (
              <Card size="sm" className="border border-border bg-card/90 py-3.5" role="status">
                <CardContent className="px-4 text-sm text-muted-foreground">
                  Checking your answer…
                </CardContent>
              </Card>
            )}

            {currentAnswer?.status === 'error' && (
              <Card size="sm" className="border border-[#ba4d00]/80 bg-[#973b00]/20 py-3.5" role="alert">
                <CardContent className="px-4 text-sm text-foreground">
                  Couldn't check your answer ({currentAnswer.errorMessage}). Pick it again.
                </CardContent>
              </Card>
            )}

            {currentResult && (
              <Card
                size="sm"
                className={cn(
                  'border py-3.5 animate-in fade-in-0 zoom-in-95 duration-150',
                  !currentResult.correct && 'border-[#ba4d00]/80 bg-[#973b00]/20',
                )}
                style={
                  currentResult.correct
                    ? {
                        borderColor: topic.accentHex,
                        backgroundColor: `${topic.pipeColor}18`,
                      }
                    : undefined
                }
                role="status"
              >
                <CardContent className="flex items-start gap-2.5 px-4 text-sm">
                  <HugeiconsIcon
                    icon={currentResult.correct ? CheckmarkCircle02Icon : CancelCircleIcon}
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: currentResult.correct ? topic.accentHex : '#fe9900' }}
                    strokeWidth={2}
                  />
                  <div className="flex flex-col gap-1 text-foreground">
                    <p className="font-semibold">
                      {currentResult.correct
                        ? 'Correct!'
                        : isScored
                          ? `Not quite. The correct answer is ${correctLabel ?? '?'}.`
                          : 'Not quite. Think it over and pick another answer.'}
                    </p>
                    {/* In practice mode the explanation would give the answer away, so it waits for a correct answer */}
                    {(currentResult.correct || isScored) && currentResult.explanation && (
                      <p className="leading-relaxed text-foreground/90">{currentResult.explanation}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step.kind === 'result' && step.passed && (
          <Card
            className="border py-8 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              borderColor: topic.accentHex,
              backgroundColor: `${topic.pipeColor}14`,
              boxShadow: `0 0 32px -10px ${topic.pipeColor}55`,
            }}
          >
            <CardHeader className="items-center px-5 text-center">
              {hasHedgie ? (
                <HedgieCelebration loadScene={loadHedgie} />
              ) : (
                <Badge
                  className="mb-3 size-14 justify-center rounded-full text-[#07090a]"
                  style={{ backgroundColor: topic.accentHex }}
                >
                  <HugeiconsIcon icon={Tick02Icon} className="size-7!" strokeWidth={2.5} />
                </Badge>
              )}

              <Badge
                className="px-2.5 py-0.5 text-[#07090a]"
                style={{ backgroundColor: topic.accentHex }}
              >
                Module {node.code} completed
              </Badge>
              {isScored && (
                <Badge variant="outline" className="mt-1.5 border border-border px-2 py-0.5 tabular-nums">
                  Score: {score}/{questionCount}
                </Badge>
              )}
              <CardTitle className="mt-2 text-xl normal-case tracking-normal">
                {node.title}
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/85">
                {isTopicSandboxUnlocked
                  ? `Chapter ${topic.title} completed. The path has reached the “${topic.sandboxShortLabel}” sandbox.`
                  : nextNodeSummary
                    ? `The path now leads to module ${nextNodeSummary}.`
                    : 'Every module on the path is completed.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {step.kind === 'result' && !step.passed && (
          <Card
            className="border border-[#ba4d00]/80 bg-[#973b00]/20 py-8 animate-in fade-in-0 zoom-in-95 duration-200"
            role="status"
          >
            <CardHeader className="items-center px-5 text-center">
              <Badge className="mb-3 size-14 justify-center rounded-full bg-[#ba4d00] text-[#fafbfb]">
                <HugeiconsIcon icon={CancelCircleIcon} className="size-7!" strokeWidth={2.2} />
              </Badge>
              <Badge variant="outline" className="border border-border px-2 py-0.5 tabular-nums">
                Score: {score}/{questionCount}
              </Badge>
              <CardTitle className="mt-2 text-xl normal-case tracking-normal">
                Not this time
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/85">
                You need {passMark} correct answers to pass. Review this chapter's lessons and try again.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-3 lg:max-w-3xl">
          {step.kind === 'theory' && content && (
            <Button
              type="button"
              size="lg"
              className="relative w-full overflow-hidden text-[#07090a] transition-transform active:scale-[0.97]"
              style={{ backgroundColor: topic.accentHex }}
              onClick={handleStartQuestions}
            >
              {questionCount > 0 ? 'Go to questions' : 'Finish lesson'}
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
            </Button>
          )}

          {step.kind !== 'result' && content === null && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full transition-transform active:scale-[0.97]"
              onClick={onBack}
            >
              Back to the path
            </Button>
          )}

          {step.kind === 'question' && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="transition-transform active:scale-95"
                onClick={handleBackFromQuestion}
              >
                Back
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1 text-[#07090a] transition-transform active:scale-[0.97]"
                style={canAdvance ? { backgroundColor: topic.accentHex } : undefined}
                disabled={!canAdvance}
                onClick={handleAdvanceFromQuestion}
              >
                {!isLastQuestion ? 'Next question' : isScored ? 'Finish test' : 'Finish lesson'}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
              </Button>
            </div>
          )}

          {step.kind === 'result' && !step.passed && (
            <>
              <Button
                type="button"
                size="lg"
                className="w-full text-[#07090a] transition-transform active:scale-[0.97]"
                style={{ backgroundColor: topic.accentHex }}
                onClick={handleRetryQuiz}
              >
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2.2} />
                Try again
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full transition-transform active:scale-[0.97]"
                onClick={onBack}
              >
                Back to the path
              </Button>
            </>
          )}

          {step.kind === 'result' && step.passed && (
            <>
              {isTopicSandboxUnlocked && (
                <Button
                  type="button"
                  size="lg"
                  className="w-full text-[#07090a] transition-transform active:scale-[0.97]"
                  style={{ backgroundColor: topic.accentHex }}
                  onClick={onOpenSandbox}
                >
                  <HugeiconsIcon icon={FlaskConicalIcon} strokeWidth={2.2} />
                  Open sandbox: {topic.sandboxShortLabel}
                </Button>
              )}
              <Button
                type="button"
                size="lg"
                variant={isTopicSandboxUnlocked ? 'outline' : 'default'}
                className="w-full transition-transform active:scale-[0.97]"
                style={
                  !isTopicSandboxUnlocked
                    ? { backgroundColor: topic.accentHex, color: '#07090a' }
                    : undefined
                }
                onClick={onBack}
              >
                Back to the path
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
