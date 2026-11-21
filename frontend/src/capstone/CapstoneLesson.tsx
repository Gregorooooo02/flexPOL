import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { usePublishCoachFocus } from '@/components/coach/coachFocus';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { buildPlan, content, isAnswered, questions } from './plan';
import type { Answers, Question, ResearchPlan } from './plan';

interface CapstoneLessonProps {
  readonly isCompleted: boolean;
  readonly onComplete: () => void;
  readonly onBack: () => void;
}

function QuestionField({ question, index, value, invalid, onChange }: {
  readonly question: Question;
  readonly index: number;
  readonly value: string | undefined;
  readonly invalid: boolean;
  readonly onChange: (value: string | undefined) => void;
}) {
  const id = `capstone-${question.id}`;
  return (
    <Field data-invalid={invalid} className="min-w-0">
      <FieldLabel id={`${id}-label`}>{index + 1}. {question.label}</FieldLabel>
      <FieldDescription id={`${id}-help`}>{question.help}</FieldDescription>
      <ToggleGroup
        value={value ? [value] : []}
        onValueChange={(values) => onChange(values[0])}
        orientation="vertical"
        variant="outline"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`}
        aria-invalid={invalid}
        className="w-full"
      >
        {question.options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="h-auto min-h-11 justify-start py-3 text-left whitespace-normal">
            {value === option.value && <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />}
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {invalid && <FieldError id={`${id}-error`}>Choose one answer.</FieldError>}
    </Field>
  );
}

/** Six closed questions, one proposed category, and four visual next steps. */
export function CapstoneLesson({ isCompleted, onComplete, onBack }: CapstoneLessonProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [showErrors, setShowErrors] = useState(false);
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Only the screen label is shared, never the answers or the derived personal result.
  usePublishCoachFocus({ scopeId: 'capstone', label: `Final lesson · ${plan ? 'Starting point' : 'Six quick questions'} (answers not shared)` });

  useLayoutEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: 'start' });
  }, [plan]);

  return (
    <div className="@container mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
          Learning path
        </Button>
        <Badge variant="secondary">Final lesson · {isCompleted ? 'Completed' : 'About 2 minutes'}</Badge>
      </div>

      <header className="flex flex-col gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="scroll-mt-6 font-heading text-3xl font-semibold tracking-tight outline-none sm:text-4xl">
          {plan ? 'Your starting point' : content.title}
        </h1>
        <p className="text-muted-foreground">{plan ? 'One approach to explore, and how to take the next step.' : content.objective}</p>
      </header>

      {!plan ? (
        <Card>
          <CardHeader>
            <CardTitle>A quick check-in</CardTitle>
            <CardDescription>{content.intro}</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} id="capstone-form" noValidate onSubmit={(event) => {
              event.preventDefault();
              const missing = questions.find((question) => !isAnswered(question, answers));
              if (missing) {
                setShowErrors(true);
                formRef.current?.querySelector<HTMLElement>(`[aria-labelledby="capstone-${missing.id}-label"] button`)?.focus();
                return;
              }
              setPlan(buildPlan(answers));
            }}>
              <FieldGroup className="grid items-start gap-8 @2xl:grid-cols-2">
                {questions.map((question, index) => (
                  <QuestionField
                    key={question.id}
                    question={question}
                    index={index}
                    value={answers[question.id]}
                    invalid={showErrors && !isAnswered(question, answers)}
                    onChange={(value) => setAnswers((previous) => ({ ...previous, [question.id]: value }))}
                  />
                ))}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <Button type="submit" form="capstone-form">See my starting point <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" /></Button>
            <p className="text-sm text-muted-foreground">Answers stay on this screen, are not saved or sent to the server or AI coach, and clear when you leave.</p>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="mb-2 max-w-full whitespace-normal">An approach to explore</Badge>
              <CardTitle>{plan.profile.title}</CardTitle>
              <CardDescription>{plan.profile.summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p><strong>Why:</strong> {plan.reasons.join(' ')}</p>
              <p className="text-muted-foreground"><strong>The trade-off:</strong> {plan.profile.tradeoff}</p>
              {plan.note && <p className="text-muted-foreground">{plan.note}</p>}
            </CardContent>
          </Card>

          <section aria-labelledby="capstone-next-steps" className="flex flex-col gap-4">
            <h2 id="capstone-next-steps" className="font-heading text-xl font-semibold">How could you proceed?</h2>
            <ol className="grid grid-cols-1 items-stretch gap-3 @3xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
              {plan.profile.steps.map((step, index) => (
                <Fragment key={step.title}>
                  {index > 0 && (
                    <li aria-hidden="true" className="flex items-center justify-center self-center text-muted-foreground">
                      <HugeiconsIcon icon={ArrowRight01Icon} className="hidden size-6 @3xl:block" />
                      <HugeiconsIcon icon={ArrowDown01Icon} className="size-6 @3xl:hidden" />
                    </li>
                  )}
                  <li className="flex min-w-0">
                    <Card size="sm" className="w-full">
                      <CardHeader>
                        <Badge variant="secondary">{String(index + 1).padStart(2, '0')}</Badge>
                        <CardTitle>{step.title}</CardTitle>
                        <CardDescription>{step.body}</CardDescription>
                      </CardHeader>
                    </Card>
                  </li>
                </Fragment>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">
              {content.providerCheck}{' '}
              <a href={content.resource.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{content.resource.label} (new tab)</a>
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            {isCompleted ? <p role="status" className="font-semibold">Lesson completed.</p> : <Button type="button" onClick={onComplete}>Finish lesson</Button>}
            <Button type="button" variant="outline" onClick={() => { setShowErrors(false); setPlan(null); }}>Change answers</Button>
            <Link to="/playground" className={buttonVariants({ variant: 'outline' })}>Practise first</Link>
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">{content.disclaimer}</p>
    </div>
  );
}
