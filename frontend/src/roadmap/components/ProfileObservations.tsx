import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROADMAP_GUIDANCE } from '../guidance.generated';
import type { ProfileObservation } from '../profileObservations';

export function ProfileObservations({ observations }: { readonly observations: readonly ProfileObservation[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Separate observations, not an investor type, suitability assessment, or readiness score.</p>
      {observations.length === 0 && <p>No specific questions were flagged by these limited rules. That is not confirmation that a financial decision is safe or suitable.</p>}
      {observations.map(({ id }) => <Alert key={id} role="note"><AlertTitle>{ROADMAP_GUIDANCE[id].title}</AlertTitle><AlertDescription>{ROADMAP_GUIDANCE[id].description}</AlertDescription></Alert>)}
    </div>
  );
}
