import { Button } from '@/components/ui/button';
import { useAskCoach, usePublishCoachFocus } from '@/components/coach/coachFocus';
import type { ToolId } from '../types';

const CONCEPTS: Record<ToolId, { label: string; question: string }> = {
  'goal-planner': { label: 'Goals, monthly contributions and compounding', question: 'Explain how a goal date, regular contributions and compound growth relate. Use a generic fictional example, not my calculator inputs, and explain why an assumed return is not a forecast.' },
  'emergency-buffer': { label: 'Liquidity and emergency buffers', question: 'Explain liquidity, an emergency buffer and keeping money for different purposes separate. Use a generic fictional example, not my personal figures, and do not prescribe a universal buffer target.' },
  'fee-impact': { label: 'Annual fees and compounding', question: 'Explain annual percentage fees and the difference between fees deducted and their effect on compounding. Use a generic fictional example, not my calculator figures. Explain why lower fees alone do not establish suitability.' },
};

export function ToolConceptHelp({ tool }: { readonly tool: ToolId }) {
  const ask = useAskCoach();
  const concept = CONCEPTS[tool];
  // A fresh public-only focus intentionally contains no goal, inputs, outputs or scenario allocation.
  usePublishCoachFocus({ scopeId: `tool-concept-${tool}`, label: `Concept · ${concept.label}` });
  return <div className="flex flex-col items-start gap-2"><Button type="button" variant="outline" className="h-auto min-h-10 max-w-full whitespace-normal" onClick={() => ask(concept.question)}>Ask Hedgie to explain this concept</Button><p className="text-xs text-muted-foreground">Sends this generic concept question only, not your personal figures or calculated result. The calculator works even when Hedgie is offline.</p></div>;
}
