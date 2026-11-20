import { useId, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, FlaskConicalIcon } from '@hugeicons/core-free-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from 'cn';
import type { TopicDefinition } from './learningPath';

interface SandboxPageProps {
  readonly topic: TopicDefinition;
  readonly onBack: () => void;
}

type EtfStrategyId = 'global' | 'sp500' | 'balanced';

interface EtfStrategy {
  readonly id: EtfStrategyId;
  readonly label: string;
  readonly annualRate: number;
}

const ETF_STRATEGIES: readonly EtfStrategy[] = [
  { id: 'global', label: 'Global 7%', annualRate: 0.07 },
  { id: 'sp500', label: 'S&P 500 8.5%', annualRate: 0.085 },
  { id: 'balanced', label: '60/40 5.5%', annualRate: 0.055 },
];

interface ChartSeriesPoint {
  readonly year: number;
  readonly primary: number;
  readonly secondary: number;
}

function formatPln(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} PLN`;
}

function sliderValue(next: number | readonly number[]): number {
  return typeof next === 'number' ? next : (next[0] ?? 0);
}

function SandboxChart({
  points,
  primaryLabel,
  secondaryLabel,
  ariaLabel,
}: {
  readonly points: readonly ChartSeriesPoint[];
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly ariaLabel: string;
}) {
  const gradId = useId();
  const width = 560;
  const height = 210;
  const padLeft = 16;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.primary, p.secondary)));
  const lastIdx = Math.max(1, points.length - 1);

  const toX = (idx: number) => padLeft + (idx / lastIdx) * plotW;
  const toY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const primaryCoords = points.map((p, i) => `${toX(i).toFixed(1)},${toY(p.primary).toFixed(1)}`);
  const secondaryCoords = points.map(
    (p, i) => `${toX(i).toFixed(1)},${toY(p.secondary).toFixed(1)}`,
  );

  const primaryPath = `M ${primaryCoords.join(' L ')}`;
  const secondaryPath = `M ${secondaryCoords.join(' L ')}`;
  const areaPath = `${primaryPath} L ${toX(lastIdx).toFixed(1)},${(padTop + plotH).toFixed(1)} L ${toX(0).toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  const lastPoint = points[points.length - 1];

  return (
    <Card size="sm" className="border border-border bg-card py-3.5">
      <CardContent className="flex flex-col gap-2 px-3.5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-1 w-3.5 bg-[#ffd22e]" aria-hidden="true" />
            {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1 w-3.5 bg-[#fafbfb]/60" aria-hidden="true" />
            {secondaryLabel}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD22E" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#FE9900" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padTop + plotH * (1 - frac);
            return (
              <line
                key={frac}
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#2D3234"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={secondaryPath}
            fill="none"
            stroke="#FAFBFB"
            strokeOpacity="0.58"
            strokeWidth="2.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
          <path
            d={primaryPath}
            fill="none"
            stroke="#FFD22E"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {lastPoint && (
            <>
              <circle
                cx={toX(lastIdx)}
                cy={toY(lastPoint.secondary)}
                r="4"
                fill="#21292B"
                stroke="#FAFBFB"
                strokeWidth="2"
              />
              <circle
                cx={toX(lastIdx)}
                cy={toY(lastPoint.primary)}
                r="5"
                fill="#FFD22E"
                stroke="#07090A"
                strokeWidth="2"
              />
            </>
          )}

          <text x={padLeft} y={height - 6} fill="#a3acad" fontSize="11">
            Year 0
          </text>
          <text x={width - padRight} y={height - 6} textAnchor="end" fill="#a3acad" fontSize="11">
            Year {lastPoint?.year ?? 0}
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}

function MetricCards({
  items,
  className,
}: {
  readonly items: readonly {
    readonly label: string;
    readonly value: string;
    readonly tone?: 'default' | 'amber' | 'gold';
  }[];
  readonly className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1', className)}>
      {items.map((item) => (
        <Card
          key={item.label}
          size="sm"
          className={
            item.tone === 'gold'
              ? 'border border-[#e17101] bg-[#973b00]/20 py-3'
              : 'border border-border bg-card py-3'
          }
        >
          <CardContent className="flex flex-row items-baseline justify-between gap-2 px-3.5 sm:flex-col">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span
              className={
                item.tone === 'gold'
                  ? 'text-base font-semibold tabular-nums text-[#ffd22e]'
                  : item.tone === 'amber'
                    ? 'text-base font-semibold tabular-nums text-[#fe9900]'
                    : 'text-base font-semibold tabular-nums text-foreground'
              }
            >
              {item.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EtfSandboxView() {
  const [monthly, setMonthly] = useState(1000);
  const [years, setYears] = useState(15);
  const [strategyId, setStrategyId] = useState<EtfStrategyId>('global');

  const strategy = ETF_STRATEGIES.find((s) => s.id === strategyId) ?? ETF_STRATEGIES[0];

  const { points, finalContributed, finalTotal, profit } = useMemo(() => {
    const monthlyRate = strategy.annualRate / 12;
    const series: ChartSeriesPoint[] = [{ year: 0, primary: 0, secondary: 0 }];
    let balance = 0;
    let contributed = 0;
    for (let y = 1; y <= years; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        balance = (balance + monthly) * (1 + monthlyRate);
        contributed += monthly;
      }
      series.push({ year: y, primary: balance, secondary: contributed });
    }
    return {
      points: series,
      finalContributed: contributed,
      finalTotal: balance,
      profit: balance - contributed,
    };
  }, [monthly, years, strategy.annualRate]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)] lg:items-start">
      <Card size="sm" className="border border-border bg-card py-4 lg:col-start-2 lg:row-start-1">
        <CardContent className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Monthly contribution</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">
                {formatPln(monthly)}
              </span>
            </div>
            <Slider
              aria-label="Monthly contribution"
              min={200}
              max={5000}
              step={100}
              value={[monthly]}
              onValueChange={(next) => setMonthly(sliderValue(next))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Horizon</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">{years} years</span>
            </div>
            <Slider
              aria-label="Investment horizon"
              min={5}
              max={30}
              step={1}
              value={[years]}
              onValueChange={(next) => setYears(sliderValue(next))}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ETF_STRATEGIES.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={item.id === strategyId ? 'default' : 'outline'}
                aria-pressed={item.id === strategyId}
                onClick={() => setStrategyId(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <SandboxChart
          points={points}
          primaryLabel="Portfolio value"
          secondaryLabel="Contributions"
          ariaLabel={`ETF portfolio simulation over ${years} years: ${formatPln(finalContributed)} contributed, final value ${formatPln(finalTotal)}.`}
        />
      </div>

      <MetricCards
        className="lg:col-start-2 lg:row-start-2"
        items={[
          { label: 'Contributed', value: formatPln(finalContributed) },
          { label: 'Gain', value: `+${formatPln(profit)}`, tone: 'amber' },
          { label: 'Final value', value: formatPln(finalTotal), tone: 'gold' },
        ]}
      />
    </div>
  );
}

function IkeSandboxView() {
  const [annualDeposit, setAnnualDeposit] = useState(12000);
  const [years, setYears] = useState(20);
  const [ratePct, setRatePct] = useState(7);

  const { points, ikeFinal, regularNet, taxSaved } = useMemo(() => {
    const r = ratePct / 100;
    const series: ChartSeriesPoint[] = [{ year: 0, primary: 0, secondary: 0 }];
    let gross = 0;
    let contributed = 0;
    for (let y = 1; y <= years; y += 1) {
      gross = (gross + annualDeposit) * (1 + r);
      contributed += annualDeposit;
      const netIfClosedNow = contributed + Math.max(0, gross - contributed) * 0.81;
      series.push({ year: y, primary: gross, secondary: netIfClosedNow });
    }
    const finalGross = gross;
    const finalNet = contributed + Math.max(0, finalGross - contributed) * 0.81;
    return {
      points: series,
      ikeFinal: finalGross,
      regularNet: finalNet,
      taxSaved: finalGross - finalNet,
    };
  }, [annualDeposit, years, ratePct]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)] lg:items-start">
      <Card size="sm" className="border border-border bg-card py-4 lg:col-start-2 lg:row-start-1">
        <CardContent className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Yearly contribution</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">
                {formatPln(annualDeposit)}
              </span>
            </div>
            <Slider
              aria-label="Yearly contribution"
              min={2000}
              max={26000}
              step={500}
              value={[annualDeposit]}
              onValueChange={(next) => setAnnualDeposit(sliderValue(next))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Years</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">{years} years</span>
            </div>
            <Slider
              aria-label="Number of years"
              min={5}
              max={30}
              step={1}
              value={[years]}
              onValueChange={(next) => setYears(sliderValue(next))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Rate of return</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">
                {ratePct.toFixed(1)}% / year
              </span>
            </div>
            <Slider
              aria-label="Expected rate of return"
              min={4}
              max={10}
              step={0.5}
              value={[ratePct]}
              onValueChange={(next) => setRatePct(sliderValue(next))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <SandboxChart
          points={points}
          primaryLabel="IKE (0% tax)"
          secondaryLabel="Regular account (−19% tax)"
          ariaLabel={`IKE vs a regular account after ${years} years: IKE ${formatPln(ikeFinal)}, regular account ${formatPln(regularNet)}.`}
        />
      </div>

      <MetricCards
        className="lg:col-start-2 lg:row-start-2"
        items={[
          { label: 'Regular account, net', value: formatPln(regularNet) },
          { label: 'Tax saved', value: `+${formatPln(taxSaved)}`, tone: 'amber' },
          { label: 'IKE, net', value: formatPln(ikeFinal), tone: 'gold' },
        ]}
      />
    </div>
  );
}

function BondsSandboxView() {
  const [capital, setCapital] = useState(30000);
  const [inflationPct, setInflationPct] = useState(4.5);
  const [years, setYears] = useState(10);

  const { points, edoNetFinal, depositNetFinal, advantage } = useMemo(() => {
    const edoSeries: ChartSeriesPoint[] = [{ year: 0, primary: capital, secondary: capital }];
    let edoGross = capital;
    let depositNet = capital;
    const infRate = inflationPct / 100;
    const depositAnnualNetRate = 0.04 * 0.81;

    for (let y = 1; y <= years; y += 1) {
      const yearRate = y === 1 ? 0.065 : infRate + 0.02;
      edoGross *= 1 + yearRate;
      depositNet *= 1 + depositAnnualNetRate;
      const edoNetNow = capital + (edoGross - capital) * 0.81;
      edoSeries.push({ year: y, primary: edoNetNow, secondary: depositNet });
    }

    const finalEdoNet = edoSeries[edoSeries.length - 1].primary;
    return {
      points: edoSeries,
      edoNetFinal: finalEdoNet,
      depositNetFinal: depositNet,
      advantage: finalEdoNet - depositNet,
    };
  }, [capital, inflationPct, years]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)] lg:items-start">
      <Card size="sm" className="border border-border bg-card py-4 lg:col-start-2 lg:row-start-1">
        <CardContent className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Capital</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">
                {formatPln(capital)}
              </span>
            </div>
            <Slider
              aria-label="Starting capital"
              min={5000}
              max={200000}
              step={5000}
              value={[capital]}
              onValueChange={(next) => setCapital(sliderValue(next))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Average inflation</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">
                {inflationPct.toFixed(1)}%
              </span>
            </div>
            <Slider
              aria-label="Average inflation"
              min={2}
              max={8}
              step={0.5}
              value={[inflationPct]}
              onValueChange={(next) => setInflationPct(sliderValue(next))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Period</span>
              <span className="font-semibold tabular-nums text-[#ffd22e]">{years} years</span>
            </div>
            <Slider
              aria-label="Period"
              min={2}
              max={10}
              step={1}
              value={[years]}
              onValueChange={(next) => setYears(sliderValue(next))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <SandboxChart
          points={points}
          primaryLabel="EDO bonds (inflation + 2%)"
          secondaryLabel="Deposit 4% net"
          ariaLabel={`EDO simulation over ${years} years at ${inflationPct}% inflation: EDO ${formatPln(edoNetFinal)}, deposit ${formatPln(depositNetFinal)}.`}
        />
      </div>

      <MetricCards
        className="lg:col-start-2 lg:row-start-2"
        items={[
          { label: 'Deposit 4% net', value: formatPln(depositNetFinal) },
          {
            label: 'EDO advantage',
            value: advantage >= 0 ? `+${formatPln(advantage)}` : formatPln(advantage),
            tone: 'amber',
          },
          { label: 'EDO bonds, net', value: formatPln(edoNetFinal), tone: 'gold' },
        ]}
      />
    </div>
  );
}

export function SandboxPage({ topic, onBack }: SandboxPageProps) {
  return (
    <div
      className={`flex flex-1 flex-col justify-between ${topic.bandClassName}`}
      style={{ backgroundImage: topic.ambientGlow }}
    >
      <header className="sticky top-[var(--app-header-height)] z-20 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-3 lg:max-w-7xl">
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
            className="px-2.5 py-0.5 text-[#07090a]"
            style={{ backgroundColor: topic.accentHex }}
          >
            <HugeiconsIcon icon={FlaskConicalIcon} strokeWidth={2.2} />
            Sandbox · {topic.title}
          </Badge>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6 lg:max-w-7xl lg:gap-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {topic.sandboxTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{topic.sandboxDescription}</p>
        </div>

        <Separator />

        {topic.sandboxType === 'etf' && <EtfSandboxView />}
        {topic.sandboxType === 'ike' && <IkeSandboxView />}
        {topic.sandboxType === 'bonds' && <BondsSandboxView />}
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-md px-4 py-3 lg:max-w-7xl lg:px-8">
          <Button type="button" size="lg" className="w-full" onClick={onBack}>
            Back to the path
          </Button>
        </div>
      </footer>
    </div>
  );
}
