import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  FlaskConicalIcon,
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
import type { LearningNode, TopicDefinition } from './demoData';

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

type LessonStep = 0 | 1 | 2 | 3;

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
  const [step, setStep] = useState<LessonStep>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flashKey, setFlashKey] = useState<{ optionId: string; seq: number } | null>(null);

  const stepLabel =
    step === 0
      ? 'Teoria'
      : step === 1
        ? 'Pytanie 1/2'
        : step === 2
          ? 'Pytanie 2/2'
          : 'Zaliczone';

  const progressPct = step === 0 ? 25 : step === 1 ? 50 : step === 2 ? 75 : 100;

  const currentQuestion = step === 1 ? node.questions[0] : step === 2 ? node.questions[1] : null;
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] ?? null : null;
  const selectedOption =
    currentQuestion?.options.find((opt) => opt.id === selectedOptionId) ?? null;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setFlashKey((prev) => ({ optionId, seq: (prev?.seq ?? 0) + 1 }));
  };

  const handleAdvanceFromQuestion = () => {
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0 });
      return;
    }
    if (step === 2) {
      onComplete(node.id);
      setStep(3);
      window.scrollTo({ top: 0 });
    }
  };

  const handleSkipDemo = () => {
    onComplete(node.id);
    setStep(3);
    window.scrollTo({ top: 0 });
  };

  return (
    <div
      className={cn(
        'flex min-h-svh flex-col justify-between text-foreground',
        topic.bandClassName,
      )}
      style={{ backgroundImage: topic.ambientGlow }}
    >
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 transition-transform active:scale-95"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.2} />
              Ścieżka
            </Button>

            <Badge
              className="px-2.5 py-0.5 font-semibold"
              style={
                step === 3
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

            {step < 3 && !isCompleted ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleSkipDemo}
                className="transition-transform active:scale-95"
              >
                Zalicz (demo)
              </Button>
            ) : (
              <Badge variant="outline" className="border border-border px-2 py-0.5 tabular-nums">
                {node.code}
              </Badge>
            )}
          </div>

          <Progress
            value={progressPct}
            aria-label={`Postęp lekcji ${node.code}`}
            className="[&_[data-slot=progress-track]]:h-1.5"
            style={
              {
                '--primary': topic.accentHex,
              } as Record<string, string>
            }
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
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
          <Badge variant="secondary" className="px-2 py-0.5">
            {node.durationLabel}
          </Badge>
          {isCompleted && step !== 3 && (
            <Badge
              className="px-2 py-0.5 text-[#07090a]"
              style={{ backgroundColor: topic.accentHex }}
            >
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.4} />
              Zaliczone wcześniej
            </Badge>
          )}
        </div>

        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {node.title}
        </h1>

        <Separator />

        {step === 0 && (
          <div className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            {node.theoryBlocks.map((block, index) => (
              <Card key={block.heading} size="sm" className="border border-border bg-card/90 py-4">
                <CardHeader className="px-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      className="px-2 py-0.5"
                      style={{
                        backgroundColor: '#21292b',
                        color: topic.accentHex,
                      }}
                    >
                      0{index + 1}
                    </Badge>
                    <CardTitle className="text-sm normal-case tracking-normal">
                      {block.heading}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                    {block.body}
                  </CardDescription>
                </CardHeader>
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
                  Pytanie {step} z 2
                </Badge>
                <CardTitle className="mt-1.5 text-base leading-snug normal-case tracking-normal">
                  {currentQuestion.prompt}
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="flex flex-col gap-2.5">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isFlashing = flashKey?.optionId === option.id;

                return (
                  <Button
                    key={`${option.id}-${isFlashing ? flashKey.seq : 0}`}
                    type="button"
                    variant="outline"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                    className={cn(
                      'relative h-auto min-h-13 w-full justify-start gap-3 overflow-hidden px-4 py-3 text-left text-sm font-normal tracking-normal whitespace-normal normal-case transition-transform active:scale-[0.98]',
                      isFlashing && 'fx-option-pop fx-sheen',
                      isSelected &&
                        option.isCorrect &&
                        'bg-[#efb100]/15 text-foreground hover:bg-[#efb100]/20',
                      isSelected &&
                        !option.isCorrect &&
                        'border-[#ba4d00] bg-[#973b00]/25 text-foreground hover:bg-[#973b00]/30',
                    )}
                    style={
                      isSelected && option.isCorrect
                        ? {
                            borderColor: topic.accentHex,
                            boxShadow: `0 0 18px -4px ${topic.accentHex}66`,
                          }
                        : undefined
                    }
                  >
                    <Badge
                      className={cn(
                        'size-6 shrink-0 justify-center border border-border bg-secondary text-foreground',
                        isSelected && !option.isCorrect && 'border-[#ba4d00] bg-[#ba4d00] text-[#fafbfb]',
                      )}
                      style={
                        isSelected && option.isCorrect
                          ? {
                              backgroundColor: topic.accentHex,
                              borderColor: topic.pipeSecondary,
                              color: '#07090a',
                            }
                          : undefined
                      }
                    >
                      {option.id.toUpperCase()}
                    </Badge>
                    <span>{option.text}</span>
                  </Button>
                );
              })}
            </div>

            {selectedOption && (
              <Card
                size="sm"
                className={cn(
                  'border py-3.5 animate-in fade-in-0 zoom-in-95 duration-150',
                  !selectedOption.isCorrect && 'border-[#ba4d00]/80 bg-[#973b00]/20',
                )}
                style={
                  selectedOption.isCorrect
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
                    icon={selectedOption.isCorrect ? CheckmarkCircle02Icon : CancelCircleIcon}
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: selectedOption.isCorrect ? topic.accentHex : '#fe9900' }}
                    strokeWidth={2}
                  />
                  <p className="text-foreground">{selectedOption.feedback}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 3 && (
          <Card
            className="border py-8 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              borderColor: topic.accentHex,
              backgroundColor: `${topic.pipeColor}14`,
              boxShadow: `0 0 32px -10px ${topic.pipeColor}55`,
            }}
          >
            <CardHeader className="items-center px-5 text-center">
              <Badge
                className="mb-3 size-14 justify-center rounded-full text-[#07090a]"
                style={{ backgroundColor: topic.accentHex }}
              >
                <HugeiconsIcon icon={Tick02Icon} className="size-7!" strokeWidth={2.5} />
              </Badge>

              <Badge
                className="px-2.5 py-0.5 text-[#07090a]"
                style={{ backgroundColor: topic.accentHex }}
              >
                Moduł {node.code} zaliczony
              </Badge>
              <CardTitle className="mt-2 text-xl normal-case tracking-normal">
                {node.title}
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/85">
                {isTopicSandboxUnlocked
                  ? `Dział ${topic.title} ukończony. Linia na ścieżce dotarła do Sandboxa „${topic.sandboxShortLabel}”.`
                  : nextNodeSummary
                    ? `Linia zakolorowała się do modułu ${nextNodeSummary}.`
                    : 'Wszystkie moduły na ścieżce zostały zaliczone.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-3">
          {step === 0 && (
            <Button
              type="button"
              size="lg"
              className="relative w-full overflow-hidden text-[#07090a] transition-transform active:scale-[0.97]"
              style={{ backgroundColor: topic.accentHex }}
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0 });
              }}
            >
              Przejdź do pytań
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
            </Button>
          )}

          {(step === 1 || step === 2) && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="transition-transform active:scale-95"
                onClick={() => setStep((step - 1) as LessonStep)}
              >
                Wstecz
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1 text-[#07090a] transition-transform active:scale-[0.97]"
                style={
                  selectedOption?.isCorrect ? { backgroundColor: topic.accentHex } : undefined
                }
                disabled={!selectedOption?.isCorrect}
                onClick={handleAdvanceFromQuestion}
              >
                {step === 1 ? 'Następne pytanie' : 'Zakończ i zalicz'}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
              </Button>
            </div>
          )}

          {step === 3 && (
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
                  Otwórz Sandbox: {topic.sandboxShortLabel}
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
                Wróć na ścieżkę
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
