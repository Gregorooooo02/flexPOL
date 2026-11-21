import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Home01Icon,
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
import { getQuiz, getSubchapter, getSubchapterControlQuiz, startQuizAttempt, submitAnswer } from '@/api';
import { usePublishCoachFocus } from '@/components/coach/coachFocus';
import { ApiError } from '@/config/axios';
import type { AnswerChoice, AnswerOption, AnswerResult, Assignments, Question, Quiz } from '@/model';
import { AssignmentQuestion } from './AssignmentQuestion';
import { NumberQuestion } from './NumberQuestion';
import { PortfolioPrediction } from './PortfolioPrediction';
import { withAlpha } from './learningPath';
import type { LearningNode, TopicDefinition } from './learningPath';
import { LessonMarkdown } from './LessonMarkdown';
import { HedgieCelebration } from './hedgie/HedgieCelebration';
import { HedgieWrongAnswer } from './hedgie/HedgieWrongAnswer';
import { useHedgieScene } from './hedgie/useHedgieScene';

interface LessonPageProps {
  readonly node: LearningNode;
  readonly topic: TopicDefinition;
  readonly isCompleted: boolean;
  readonly nextNodeKind: LearningNode['kind'] | null;
  readonly getNextWrongAnswerIndex: () => number;
  readonly onComplete: (nodeId: string) => void;
  readonly onNext: (() => void) | null;
  readonly onBack: () => void;
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
  readonly choice: AnswerChoice;
  readonly status: 'checking' | 'checked' | 'error';
  readonly result: AnswerResult | null;
  readonly errorMessage: string | null;
  readonly wrongAnswerIndex?: number;
}

type AnswerMap = Readonly<Partial<Record<number, AnswerState>>>;

type OptionLook = 'idle' | 'checking' | 'correct' | 'wrong';

const WORDS_PER_MINUTE = 180;
const EMPTY_ASSIGNMENTS: Assignments = {};

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
  const isSelected = answer.choice.optionId === option.id;
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
  nextNodeKind,
  getNextWrongAnswerIndex,
  onComplete,
  onNext,
  onBack,
}: LessonPageProps) {
  const [contentState, setContentState] = useState<ContentState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [step, setStep] = useState<LessonStep>({ kind: 'theory' });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [placements, setPlacements] = useState<Partial<Record<number, Assignments>>>({});
  const [predictions, setPredictions] = useState<Partial<Record<number, string>>>({});
  const [flashKey, setFlashKey] = useState<{ questionId: number; optionId?: number; seq: number } | null>(null);
  const answerAbortRef = useRef<AbortController | null>(null);
  /** The saved quiz attempt's id once started (null if it couldn't be), or null before the questions. */
  const attemptRef = useRef<Promise<number | null> | null>(null);
  const hasHedgie = node.kind === 'lesson';
  const loadHedgie = useHedgieScene(hasHedgie || step.kind === 'question');

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
  const currentAssignments = (currentQuestion && placements[currentQuestion.id]) || EMPTY_ASSIGNMENTS;
  const currentPrediction = currentQuestion ? predictions[currentQuestion.id] : undefined;
  const currentResult = currentAnswer?.status === 'checked' ? currentAnswer.result : null;
  const canAdvance = currentResult !== null && (isScored || currentResult.correct);
  const isLastQuestion = step.kind === 'question' && step.index + 1 >= questionCount;
  const wrongAnswerIndex = currentAnswer?.wrongAnswerIndex;

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
    setFlashKey(null);
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

  /**
   * Starts a saved attempt for the logged-in learner. Answers wait for it and send its id; if it
   * can't be started they are still checked, just not saved.
   */
  const startAttempt = () => {
    if (!quiz) {
      return;
    }
    attemptRef.current = startQuizAttempt(quiz.id, answerAbortRef.current?.signal)
      .then((attempt) => attempt.id)
      .catch(() => null);
  };

  const handleStartQuestions = () => {
    if (questionCount === 0) {
      finish(true);
      return;
    }
    // Going back to the theory and on again keeps the same attempt
    if (!attemptRef.current) {
      startAttempt();
    }
    goToStep({ kind: 'question', index: 0 });
  };

  const handleSubmitAnswer = (question: Question, choice: AnswerChoice) => {
    if (isAnswerLocked(answers[question.id], isScored)) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { choice, status: 'checking', result: null, errorMessage: null },
    }));
    setFlashKey((prev) => ({ questionId: question.id, optionId: choice.optionId, seq: (prev?.seq ?? 0) + 1 }));

    // Only apply a response if the learner hasn't picked something else (or restarted) meanwhile
    const isStillPending = (prev: AnswerMap) =>
      prev[question.id]?.choice === choice && prev[question.id]?.status === 'checking';

    const signal = answerAbortRef.current?.signal;
    (attemptRef.current ?? Promise.resolve(null))
      .then((attemptId) => submitAnswer(question.id, choice, { attemptId, signal }))
      .then((result) => {
        if (signal?.aborted) {
          return;
        }
        const wrongAnswerIndex = result.correct ? undefined : getNextWrongAnswerIndex();
        setAnswers((prev) =>
          isStillPending(prev)
            ? {
                ...prev,
                [question.id]: {
                  choice,
                  status: 'checked',
                  result,
                  errorMessage: null,
                  wrongAnswerIndex,
                },
              }
            : prev,
        );
      })
      .catch((error: unknown) => {
        if (signal?.aborted) {
          return;
        }
        setAnswers((prev) =>
          isStillPending(prev)
            ? {
                ...prev,
                [question.id]: {
                  choice,
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
    setFlashKey(null);
    setStep(step.index === 0 ? { kind: 'theory' } : { kind: 'question', index: step.index - 1 });
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    setPlacements({});
    setPredictions({});
    startAttempt();
    goToStep({ kind: 'question', index: 0 });
  };

  // Tell the AI coach which lesson and question the learner is on, and their answer once it is checked
  usePublishCoachFocus({
    scopeId: node.id,
    label: `${stepLabel} · ${node.code} ${node.title}`,
    subchapterId: node.kind === 'lesson' ? node.subchapterId : undefined,
    questionId: currentQuestion?.id,
    selectedOptionId: currentResult ? currentAnswer?.choice.optionId : undefined,
    assignments: currentResult ? currentAnswer?.choice.assignments : undefined,
    number: currentResult ? currentAnswer?.choice.number : undefined,
    comparisonPrediction: currentPrediction,
    answerCorrect: currentResult?.correct,
  });

  const correctLabel =
    currentQuestion && currentResult
      ? currentQuestion.options.find((option) => option.id === currentResult.correctOptionId)?.label
      : undefined;
  const isPassedResult = step.kind === 'result' && step.passed;
  const nextLabel = nextNodeKind === 'checkpoint' ? 'Final test' : 'Next lesson';

  return (
    <div
      className={cn(
        'flex flex-1 flex-col justify-between',
        isPassedResult && 'h-full min-h-0 overflow-hidden',
        topic.bandClassName,
      )}
      style={{ backgroundImage: topic.ambientGlow }}
    >
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-4 py-3 lg:max-w-3xl">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 justify-self-start transition-transform active:scale-95"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.2} />
              Path
            </Button>

            <Badge
              className="justify-self-center px-2.5 py-0.5 font-semibold"
              style={
                isPassedResult
                  ? { backgroundColor: topic.accentHex, color: '#07090a' }
                  : {
                      backgroundColor: 'var(--secondary)',
                      color: topic.accentTextHex,
                      borderColor: topic.pipeSecondary,
                    }
              }
            >
              {isPassedResult ? `Module ${node.code} completed` : stepLabel}
            </Badge>

            <div className="justify-self-end">
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
              ) : isPassedResult ? (
                isScored ? (
                  <Badge variant="outline" className="border border-border px-2 py-0.5 tabular-nums">
                    Score: {score}/{questionCount}
                  </Badge>
                ) : null
              ) : (
                <Badge variant="outline" className="border border-border px-2 py-0.5 tabular-nums">
                  {node.code}
                </Badge>
              )}
            </div>
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

      <div
        className={cn(
          'mx-auto flex w-full max-w-md flex-1 flex-col px-4 lg:max-w-3xl',
          isPassedResult ? 'min-h-0 gap-2.5 py-3' : 'gap-4 py-6',
        )}
      >
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
                          backgroundColor: 'var(--secondary)',
                          color: topic.accentTextHex,
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
                    <LessonMarkdown markdown={section.markdown} accentHex={topic.accentTextHex} />
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
                  style={{ backgroundColor: 'var(--secondary)', color: topic.accentTextHex }}
                >
                  Question {step.kind === 'question' ? step.index + 1 : 0} of {questionCount}
                </Badge>
                <CardTitle className="mt-1.5 text-base leading-snug normal-case tracking-normal">
                  {currentQuestion.prompt}
                </CardTitle>
              </CardHeader>
            </Card>

            {currentQuestion.assignment && (
              <AssignmentQuestion
                exercise={currentQuestion.assignment}
                assignments={currentAssignments}
                locked={isAnswerLocked(currentAnswer, isScored)}
                solved={currentResult?.correct ?? false}
                onChange={(assignments) => setPlacements((prev) => ({ ...prev, [currentQuestion.id]: assignments }))}
                onCheck={() => handleSubmitAnswer(currentQuestion, { assignments: currentAssignments })}
              />
            )}

            {currentQuestion.comparison && (
              <PortfolioPrediction
                comparison={currentQuestion.comparison}
                revealedPrediction={currentPrediction}
                onReveal={(prediction) => setPredictions((prev) => ({ ...prev, [currentQuestion.id]: prediction }))}
              />
            )}

            {currentQuestion.numberExercise && (!currentQuestion.comparison || currentPrediction !== undefined) && (
              <NumberQuestion
                exercise={currentQuestion.numberExercise}
                lastValue={currentAnswer?.choice.number}
                locked={isAnswerLocked(currentAnswer, isScored)}
                solved={currentResult?.correct ?? false}
                onCheck={(number) => handleSubmitAnswer(currentQuestion, { number })}
              />
            )}

            {currentQuestion.options.length > 0 && (!currentQuestion.comparison || currentPrediction !== undefined) && (
              <div className="flex flex-col gap-2.5">
                {currentQuestion.options.map((option) => {
                  const look = getOptionLook(option, currentAnswer, isScored);
                  const isSelected = currentAnswer?.choice.optionId === option.id;
                  const isFlashing = flashKey?.optionId === option.id;
                  const isLocked = isAnswerLocked(currentAnswer, isScored);

                  return (
                    <Button
                      key={`${option.id}-${isFlashing ? flashKey.seq : 0}`}
                      type="button"
                      variant="outline"
                      aria-pressed={isSelected}
                      aria-disabled={isLocked ? 'true' : undefined}
                      onClick={() => handleSubmitAnswer(currentQuestion, { optionId: option.id })}
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
                              boxShadow: `0 0 18px -4px ${withAlpha(topic.accentHex, 40)}`,
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
            )}

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
                  Couldn't check your answer ({currentAnswer.errorMessage}). Please try again.
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
                        backgroundColor: withAlpha(topic.pipeColor, 9),
                      }
                    : undefined
                }
                role="status"
              >
                <CardContent className="flex items-start gap-2.5 px-4 text-sm">
                  <HugeiconsIcon
                    icon={currentResult.correct ? CheckmarkCircle02Icon : CancelCircleIcon}
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: currentResult.correct ? topic.accentTextHex : 'var(--topic-2-accent-text)' }}
                    strokeWidth={2}
                  />
                  <div className="flex flex-col gap-1 text-foreground">
                    <p className="font-semibold">
                      {currentResult.correct
                        ? 'Correct!'
                        : isScored
                          ? `Not quite. The correct answer is ${correctLabel ?? '?'}.`
                          : currentResult.hint
                            ? 'Not quite. Try again.'
                            : 'Not quite. Think it over and pick another answer.'}
                    </p>
                    {/* In practice mode the explanation would give the answer away, so it waits for a correct answer */}
                    {(currentResult.correct || isScored) && currentResult.explanation && (
                      <p className="leading-relaxed text-foreground/90">{currentResult.explanation}</p>
                    )}
                    {currentResult.hint && <p className="leading-relaxed text-foreground/90">{currentResult.hint}</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step.kind === 'result' && step.passed && (
          <Card
            className="flex min-h-0 flex-1 flex-col justify-center border py-3 sm:py-4 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              borderColor: topic.accentHex,
              backgroundColor: withAlpha(topic.pipeColor, 8),
              boxShadow: `0 0 32px -10px ${withAlpha(topic.pipeColor, 33)}`,
            }}
          >
            <CardHeader className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
              {hasHedgie ? (
                <HedgieCelebration loadScene={loadHedgie} />
              ) : (
                <div className="flex flex-col items-center gap-3 justify-self-center">
                  <Badge
                    className="size-14 justify-center rounded-full text-[#07090a]"
                    style={{ backgroundColor: topic.accentHex }}
                  >
                    <HugeiconsIcon icon={Tick02Icon} className="size-7!" strokeWidth={2.5} />
                  </Badge>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    Chapter test passed!
                  </p>
                </div>
              )}
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

      {wrongAnswerIndex !== undefined && flashKey?.questionId === currentQuestion?.id && (
        <HedgieWrongAnswer key={wrongAnswerIndex} reactionIndex={wrongAnswerIndex} loadScene={loadHedgie} />
      )}

      <footer data-coach-footer className="@container sticky bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-3 lg:max-w-3xl">
          {step.kind === 'theory' && content && (
            <Button
              type="button"
              size="lg"
              className="relative w-full overflow-hidden text-[#07090a] transition-all duration-200 ease-out motion-reduce:transition-none enabled:hover:scale-[1.02] enabled:hover:brightness-105 enabled:hover:shadow-md active:scale-[0.97] lg:w-fit lg:min-w-56 lg:self-end"
              style={{ backgroundColor: topic.accentHex }}
              onClick={handleStartQuestions}
            >
              {questionCount > 0 ? 'Go to questions' : 'Finish lesson'}
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} className="transition-[translate] duration-200 ease-out group-hover/button:translate-x-1 motion-reduce:transition-none" />
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
            <div className="flex items-center justify-between gap-2">
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
                className="flex-1 text-[#07090a] transition-all duration-200 ease-out motion-reduce:transition-none enabled:hover:scale-[1.02] enabled:hover:brightness-105 enabled:hover:shadow-md active:scale-[0.97] lg:min-w-56 lg:flex-none"
                style={canAdvance ? { backgroundColor: topic.accentHex } : undefined}
                disabled={!canAdvance}
                onClick={handleAdvanceFromQuestion}
              >
                {!isLastQuestion ? 'Next question' : isScored ? 'Finish test' : 'Finish lesson'}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} className="transition-[translate] duration-200 ease-out group-hover/button:translate-x-1 motion-reduce:transition-none" />
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
            onNext ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  aria-label="Back to path"
                  className="flex-1 px-2.5 tracking-wider transition-transform active:scale-[0.97] @[26rem]:px-6 @[26rem]:tracking-widest"
                  onClick={onBack}
                >
                  <HugeiconsIcon icon={Home01Icon} className="size-5 @[21.5rem]:size-4" strokeWidth={2.2} />
                  <span className="hidden @[21.5rem]:inline">Back to path</span>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  aria-label={nextLabel}
                  className="flex-1 px-2.5 tracking-wider text-[#07090a] transition-transform active:scale-[0.97] @[26rem]:px-6 @[26rem]:tracking-widest"
                  style={{ backgroundColor: topic.accentHex }}
                  onClick={onNext}
                >
                  <span className="hidden @[21.5rem]:inline">{nextLabel}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-5 @[21.5rem]:size-4" strokeWidth={2.2} />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="lg"
                aria-label="Back to path"
                className="w-full px-3 tracking-wider transition-transform active:scale-[0.97] @[26rem]:px-8 @[26rem]:tracking-widest"
                style={{ backgroundColor: topic.accentHex, color: '#07090a' }}
                onClick={onBack}
              >
                <HugeiconsIcon icon={Home01Icon} className="size-5 @[15rem]:size-4" strokeWidth={2.2} />
                <span className="hidden @[15rem]:inline">Back to path</span>
              </Button>
            )
          )}
        </div>
      </footer>
    </div>
  );
}
