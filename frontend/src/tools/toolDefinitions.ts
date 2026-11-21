import type { ToolId } from './types';

export const TOOL_DEFINITIONS = {
  'goal-planner': {
    title: 'Goal planner',
    description: 'Explore how an amount, a date, and regular contributions fit together.',
    inputs: ['Target amount and date', 'Money already set aside for this goal', 'Planned monthly contribution'],
    outputs: ['A contributions-only projection', 'The gap to your target', 'A comparison of contribution and timeline alternatives'],
    limitation: 'Optional return and inflation illustrations will use explicit assumptions, not forecasts. This will not recommend investments or tell you to take more risk.',
  },
  'emergency-buffer': {
    title: 'Emergency buffer',
    description: 'Understand how accessible savings relate to essential expenses.',
    inputs: ['Essential monthly expenses', 'Accessible savings and separately earmarked expenses', 'Your chosen target in months'],
    outputs: ['Money available after earmarked expenses', 'Months of expenses covered', 'Your target and any gap or expense shortfall'],
    limitation: 'There is no universal target. Money needed for another goal must not be counted twice. This is not a pension adequacy or sustainable retirement withdrawal calculator.',
  },
  'fee-impact': {
    title: 'Fee impact',
    description: 'Compare how two annual percentage fees change an illustrative long-term outcome.',
    inputs: ['Starting amount and monthly contribution', 'Years and one shared assumed gross return', 'Annual percentage fees for options A and B'],
    outputs: ['Illustrative ending values', 'Modeled fees deducted', 'The difference in ending value, including forgone growth'],
    limitation: 'The first model will exclude transaction fees, spreads, fixed charges, entry/exit fees, and taxes. Lower fees alone do not make a product better or suitable.',
  },
} as const satisfies Record<ToolId, { title: string; description: string; inputs: readonly string[]; outputs: readonly string[]; limitation: string }>;
