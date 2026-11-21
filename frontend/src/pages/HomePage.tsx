import { useEffect, useMemo, useState } from 'react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router';
import { cn } from 'cn';
import { getChapters, getScenarios } from '@/api';
import { useAuth } from '@/auth/authContext';
import { hedgieImage } from '@/components/coach/hedgie';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/config/axios';
import { buildLearningPath } from '@/demo/learningPath';
import {
  getLearningProgressStorageKey,
  readStoredLearningProgress,
} from '@/demo/learningProgress';
import {
  getScenarioProgressStorageKey,
  readStoredScenarioProgress,
} from '@/scenarios/scenarioProgress';
import type { Chapter, Scenario } from '@/model';
import { STARTING_BUDGET_CENTS } from '@/playground/config';
import { formatMoney } from '@/workspace/portfolio/money';

type CourseState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; chapters: Chapter[] };

type ScenarioCatalogueState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; scenarios: Scenario[] };

const FEATURES = [
  {
    step: '01',
    label: 'Learning',
    title: 'Get the foundations right.',
    description: 'Learn the essentials, from setting goals to understanding risk, with short lessons and quizzes.',
    action: 'Explore lessons',
    to: '/learning',
  },
  {
    step: '02',
    label: 'Scenarios',
    title: 'Real goals. Practice decisions.',
    description: 'Explore fictional people, their money goals and the trade-offs behind each situation.',
    action: 'Browse scenarios',
    to: '/scenarios',
  },
  {
    step: '03',
    label: 'Playground',
    title: 'Try it. Without the risk.',
    description: 'Build a virtual portfolio and see how your decisions play out in a simulated market.',
    action: 'Open playground',
    to: '/playground',
  },
] as const;

const eyebrow = 'font-heading text-xs font-semibold tracking-[0.14em] uppercase';

function getLearningLevelName(level: number): string {
  if (level === 100) return 'HedgeFlex Scholar';
  if (level >= 80) return 'Resilient Thinker';
  if (level >= 60) return 'Goal Planner';
  if (level >= 40) return 'Steady Learner';
  if (level >= 20) return 'Concept Builder';
  return 'Curious Explorer';
}

export function HomePage() {
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseState>({ status: 'loading' });
  const [scenarioCatalogue, setScenarioCatalogue] = useState<ScenarioCatalogueState>({
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();
    getChapters(controller.signal)
      .then((chapters) => setCourse({ status: 'ready', chapters }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCourse({
          status: 'error',
          message: error instanceof ApiError ? error.message : 'Unknown error.',
        });
      });
    getScenarios(controller.signal)
      .then((scenarios) => setScenarioCatalogue({ status: 'ready', scenarios }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setScenarioCatalogue({
            status: 'error',
            message: error instanceof ApiError ? error.message : 'Unknown error.',
          });
        }
      });
    return () => controller.abort();
  }, []);

  const chapters = course.status === 'ready' ? course.chapters : [];
  const firstChapter = chapters.find((chapter) => chapter.subchapters.length > 0);
  const firstLesson = firstChapter?.subchapters[0];
  const lessonCount = chapters.reduce((total, chapter) => total + chapter.subchapters.length, 0);
  const learningPath = useMemo(
    () => (course.status === 'ready' ? buildLearningPath(course.chapters) : null),
    [course],
  );
  const userEmail = user?.email;
  const savedProgress = useMemo(
    () =>
      userEmail && learningPath
        ? readStoredLearningProgress(
            getLearningProgressStorageKey(userEmail),
            learningPath.flatNodes.map(({ node }) => node.id),
          )
        : { completedNodeIds: [], warningMessage: null },
    [learningPath, userEmail],
  );
  const savedScenarioProgress = useMemo(
    () =>
      userEmail && scenarioCatalogue.status === 'ready'
        ? readStoredScenarioProgress(
            getScenarioProgressStorageKey(userEmail),
            scenarioCatalogue.scenarios.map(({ id }) => id),
          )
        : { completedScenarioIds: [], warningMessage: null },
    [scenarioCatalogue, userEmail],
  );
  const completedIds = useMemo(() => new Set(savedProgress.completedNodeIds), [savedProgress]);
  const completedScenarioCount = savedScenarioProgress.completedScenarioIds.length;
  const completedLessonCount =
    learningPath?.flatNodes.filter(
      ({ node }) => node.kind === 'lesson' && completedIds.has(node.id),
    ).length ?? 0;
  const quizCount =
    learningPath?.flatNodes.filter(({ node }) => node.kind === 'checkpoint').length ?? 0;
  const completedQuizCount =
    learningPath?.flatNodes.filter(
      ({ node }) => node.kind === 'checkpoint' && completedIds.has(node.id),
    ).length ?? 0;
  const nextNode = learningPath?.flatNodes.find(({ node }) => !completedIds.has(node.id))?.node;
  const scenarioCount =
    scenarioCatalogue.status === 'ready' ? scenarioCatalogue.scenarios.length : 0;
  const completedLevelActivities =
    completedLessonCount + completedQuizCount + completedScenarioCount;
  const totalLevelActivities = lessonCount + quizCount + scenarioCount;
  const learningLevel =
    totalLevelActivities > 0
      ? Math.round((completedLevelActivities / totalLevelActivities) * 100)
      : 0;
  const learningLevelName =
    totalLevelActivities > 0 ? getLearningLevelName(learningLevel) : 'Ready to begin';
  const learningLevelLoading =
    course.status === 'loading' || scenarioCatalogue.status === 'loading';
  const learningLevelWarning =
    savedProgress.warningMessage ??
    savedScenarioProgress.warningMessage ??
    (course.status === 'error'
      ? `${course.message} Visit Learning to retry.`
      : scenarioCatalogue.status === 'error'
        ? `${scenarioCatalogue.message} Visit Scenarios to retry.`
        : null);
  const learningLevelAvailable =
    user !== null && !learningLevelLoading && learningLevelWarning === null;
  const learningLevelMessage = !user
    ? 'Sign in to see and save your personal learning level.'
    : learningLevelLoading
      ? 'Loading your progress…'
      : learningLevelWarning ?? 'Progress data is unavailable.';
  const completedNodeCount = savedProgress.completedNodeIds.length;
  const totalNodeCount = learningPath?.flatNodes.length ?? 0;
  const learningPathComplete = totalNodeCount > 0 && completedNodeCount >= totalNodeCount;
  const learningAction =
    completedNodeCount === 0
      ? 'Start learning'
      : learningPathComplete
        ? 'Review learning'
        : 'Continue learning';

  return (
    <div
      className="@container flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [scrollbar-width:none] [--primary:#f8d860] [--ring:var(--topic-1-pipe)]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 96% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 46%), radial-gradient(ellipse at 4% 58%, color-mix(in srgb, var(--topic-2-accent) 8%, transparent), transparent 42%)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-14 px-6 py-10 @2xl:px-10 @3xl:gap-16 @3xl:px-14 @3xl:py-14">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className={`${eyebrow} text-accent-foreground`}>Your next chapter</p>
            <h1 className="font-heading text-5xl font-semibold tracking-tight [overflow-wrap:anywhere] @3xl:text-7xl">
              {user ? `Welcome back, ${user.username}.` : 'Welcome to HedgeFlex.'}
            </h1>
            <p className="text-lg text-muted-foreground">
              Build your confidence, one smart decision at a time.
            </p>
          </div>
          <p className={`${eyebrow} hidden text-muted-foreground @3xl:block`}>
            Learn. Practice. Grow.
          </p>
        </header>

        <section
          aria-label="Learning progress and next steps"
          className="grid gap-6 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] @3xl:gap-7 @5xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]"
        >
          <Card className="min-w-0 gap-0 border border-border border-l-2 border-l-primary bg-primary/10 py-0">
            <CardHeader className="gap-6 px-8 pt-8 @3xl:px-10 @3xl:pt-10">
              <p className={`${eyebrow} text-accent-foreground`}>Start with the basics</p>
              <CardTitle className="normal-case tracking-tight">
                <h2 className="max-w-2xl text-balance font-heading text-5xl leading-tight font-semibold @3xl:max-w-3xl @3xl:text-6xl @5xl:max-w-none">
                  Make your first investment{' '}
                  <span className="@3xl:whitespace-nowrap">in yourself.</span>
                </h2>
              </CardTitle>
              <CardDescription className="max-w-md text-base">
                A little knowledge goes a long way. Discover why investing matters and take the
                first step toward your goals.
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto flex flex-wrap items-center gap-5 px-8 pt-10 pb-8 @3xl:px-10 @3xl:pb-10">
              <Link
                to="/learning"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'transition-all duration-200 ease-out motion-reduce:transition-none hover:scale-[1.02] hover:brightness-105 hover:shadow-md active:scale-[0.97]',
                )}
              >
                {learningAction}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                  className="transition-[translate] duration-200 ease-out group-hover/button:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
              {nextNode ? (
                <p className="min-w-0 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {nextNode.code} · {nextNode.title}
                </p>
              ) : firstLesson ? (
                <p className="min-w-0 text-sm text-muted-foreground">All learning steps complete</p>
              ) : null}
            </CardFooter>
          </Card>

          <Card className="min-w-0 gap-0 border border-border py-0">
            <CardHeader className="gap-2 px-7 pt-7 @5xl:px-8 @5xl:pt-8">
              <p className={`${eyebrow} text-muted-foreground`}>Your investor learning level</p>
              <CardTitle className="normal-case tracking-tight">
                <h2 className="font-heading text-2xl font-semibold [overflow-wrap:anywhere]">
                  {learningLevelAvailable ? learningLevelName : 'Learning progress'}
                </h2>
              </CardTitle>
              <CardDescription>
                Complete lessons, quizzes, and scenarios to grow your level.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 px-7 pt-5 pb-7 @5xl:px-8 @5xl:pt-6 @5xl:pb-8">
              <div className="flex flex-wrap items-center justify-center gap-5 @5xl:flex-col @5xl:flex-nowrap @5xl:gap-6">
                {learningLevelAvailable ? (
                  <div
                    role="progressbar"
                    aria-label="Investor learning level"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={learningLevel}
                    aria-valuetext={`${learningLevel} out of 100 — ${learningLevelName}`}
                    className="relative grid size-36 shrink-0 place-items-center rounded-full @5xl:size-44"
                    style={{
                      background: `conic-gradient(var(--primary) 0% ${learningLevel}%, var(--secondary) ${learningLevel}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-2 rounded-full border border-border bg-card @5xl:inset-2.5" />
                    <div className="relative flex flex-col items-center">
                      <span className="font-heading text-5xl font-semibold tabular-nums">
                        {learningLevel}
                      </span>
                      <span className={`${eyebrow} text-muted-foreground`}>out of 100</span>
                    </div>
                  </div>
                ) : learningLevelLoading ? (
                  <Skeleton className="size-36 rounded-full @5xl:size-44" aria-label="Loading learning level" />
                ) : (
                  <div
                    role="img"
                    aria-label="Learning level unavailable"
                    className="grid size-36 shrink-0 place-items-center rounded-full bg-secondary text-3xl font-semibold text-muted-foreground @5xl:size-44"
                  >
                    —
                  </div>
                )}
                {learningLevelAvailable ? (
                  <dl className="flex min-w-[11rem] flex-1 flex-col gap-3 text-sm @5xl:grid @5xl:w-full @5xl:min-w-0 @5xl:grid-cols-3">
                    <div className="flex justify-between gap-3 @5xl:flex-col @5xl:items-start @5xl:gap-2 @5xl:rounded-lg @5xl:bg-secondary @5xl:px-3 @5xl:py-3">
                      <dt className="text-muted-foreground">Lessons</dt>
                      <dd className="font-semibold tabular-nums @5xl:text-2xl">
                        {completedLessonCount} / {lessonCount}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 @5xl:flex-col @5xl:items-start @5xl:gap-2 @5xl:rounded-lg @5xl:bg-secondary @5xl:px-3 @5xl:py-3">
                      <dt className="text-muted-foreground">Final quizzes</dt>
                      <dd className="font-semibold tabular-nums @5xl:text-2xl">
                        {completedQuizCount} / {quizCount}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 @5xl:flex-col @5xl:items-start @5xl:gap-2 @5xl:rounded-lg @5xl:bg-secondary @5xl:px-3 @5xl:py-3">
                      <dt className="text-muted-foreground">Scenarios</dt>
                      <dd className="font-semibold tabular-nums @5xl:text-2xl">
                        {completedScenarioCount} / {scenarioCount}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p
                    role={!user || learningLevelLoading ? 'status' : 'alert'}
                    className="min-w-[11rem] flex-1 text-sm text-muted-foreground @5xl:w-full @5xl:max-w-md @5xl:flex-none @5xl:text-center"
                  >
                    {learningLevelMessage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="home-features" className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h2 id="home-features" className="font-heading text-4xl font-semibold tracking-tight @3xl:text-5xl">
              Find your next step
            </h2>
            <p className="text-sm text-muted-foreground">
              From your first lesson to your first virtual portfolio.
            </p>
          </header>

          <div className="grid gap-6 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.step} className="group/feature min-w-0 gap-0 border border-border py-0">
                <CardHeader className="gap-5 px-7 pt-7 @3xl:px-8 @3xl:pt-8">
                  <p className={`${eyebrow} flex items-center gap-4 text-muted-foreground`}>
                    <span className="text-accent-foreground">{feature.step}</span>
                    {feature.label}
                  </p>
                  <CardTitle className="normal-case tracking-tight">
                    <h3 className="font-heading text-3xl font-semibold">{feature.title}</h3>
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto px-7 pt-7 @3xl:px-8">
                  <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 bg-secondary px-3 py-2 text-sm">
                    {feature.step === '01' && (
                      <>
                        <span className="font-semibold">
                          {course.status === 'ready'
                            ? `${completedLessonCount} / ${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`
                            : 'Lessons & quizzes'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {learningPathComplete
                            ? 'Completed'
                            : completedLessonCount > 0
                              ? 'In progress'
                              : 'At your own pace'}
                        </span>
                      </>
                    )}
                    {feature.step === '02' && (
                      <>
                        <span className="font-semibold">
                          {scenarioCatalogue.status === 'ready'
                            ? `${completedScenarioCount} / ${scenarioCatalogue.scenarios.length} ${
                                scenarioCatalogue.scenarios.length === 1 ? 'scenario' : 'scenarios'
                              }`
                            : 'Fictional scenarios'}
                        </span>
                        <span
                          className="text-xs text-muted-foreground"
                          title={
                            scenarioCatalogue.status === 'error'
                              ? scenarioCatalogue.message
                              : undefined
                          }
                        >
                          {savedScenarioProgress.warningMessage
                            ? 'Progress unavailable'
                            : scenarioCatalogue.status === 'loading'
                              ? 'Loading…'
                              : scenarioCatalogue.status === 'error'
                                ? 'Visit Scenarios to retry'
                                : scenarioCatalogue.scenarios.length === 0
                                  ? 'Coming soon'
                                  : completedScenarioCount >= scenarioCatalogue.scenarios.length
                                    ? 'Completed'
                                    : completedScenarioCount > 0
                                      ? 'In progress'
                                      : 'Ready to try'}
                        </span>
                      </>
                    )}
                    {feature.step === '03' && (
                      <>
                        <span className="font-heading text-lg font-semibold tabular-nums">{formatMoney(STARTING_BUDGET_CENTS)}</span>
                        <span className="text-xs text-muted-foreground">Virtual money</span>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="px-7 pt-6 pb-7 @3xl:px-8 @3xl:pb-8">
                  <div className="flex w-full flex-col gap-5">
                    <Separator />
                    <Link
                      to={feature.to}
                      className="flex items-center justify-between gap-3 font-heading text-xs font-semibold tracking-wide text-accent-foreground uppercase outline-none transition-[translate,scale] duration-200 ease-out hover:translate-x-0.5 hover:underline active:scale-[0.98] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {feature.action}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className="size-4 shrink-0 transition-[translate] duration-200 ease-out group-hover/feature:translate-x-1 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="home-coach" className="flex min-w-0 items-center justify-between gap-6 border border-border bg-primary/5 p-8 @3xl:gap-8 @3xl:px-10 @3xl:py-9">
          <div className="flex min-w-0 flex-col gap-4">
            <p className={`${eyebrow} text-accent-foreground`}>A little HedgeFlex wisdom</p>
            <h2 id="home-coach" className="font-heading text-3xl font-semibold tracking-tight @3xl:text-4xl">
              You don’t need to know everything to begin.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Start small and stay curious. Ask Hedgie for a hint or help thinking through a choice
              using the chat button. Hedgie is a learning coach, not a financial adviser.
            </p>
          </div>
          <img src={hedgieImage('joy')} alt="" className="hidden size-28 shrink-0 object-contain @md:block @3xl:size-36" />
        </section>

        <section aria-label="Quest Arena" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span className="font-heading font-semibold text-foreground">Quest Arena</span>
          <Badge variant="secondary">Coming soon</Badge>
          <span>Future quests will reward thoughtful decisions, not just luck.</span>
        </section>

        <footer className="flex flex-col gap-6">
          <Separator />
          <div className="flex flex-col justify-between gap-4 @3xl:flex-row">
            <div className="flex flex-col gap-1">
              <p className="font-heading text-lg font-semibold">HedgeFlex</p>
              <p className="text-xs text-muted-foreground">Learn with confidence. Invest with understanding.</p>
            </div>
            <div className="flex max-w-xl flex-col gap-1 text-xs text-muted-foreground @3xl:text-right">
              <p className="font-heading font-semibold uppercase">Fictional people · simulated markets · virtual money</p>
              <p>For education only. Simulated outcomes are not forecasts or personal financial advice.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
