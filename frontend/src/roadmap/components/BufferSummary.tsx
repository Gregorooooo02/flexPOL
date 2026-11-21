import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { withJourneySource } from '@/journey/routes';
import { EmergencyBufferResult } from '@/tools/components/EmergencyBufferResult';
import type { BufferPlan } from '../types';

export function BufferSummary({ plan }: { readonly plan: BufferPlan | null }) {
  return (
    <section aria-labelledby="saved-buffer" className="flex flex-col gap-3">
      <h2 id="saved-buffer" className="font-heading text-xl font-semibold">My buffer check</h2>
      {plan ? <>
        <EmergencyBufferResult input={plan.input} />
        <Alert role="note"><AlertTitle>{plan.separationNeedsReview ? 'Money separation needs review' : 'Money separation: self-reported'}</AlertTitle><AlertDescription>{plan.separationNeedsReview ? 'Your recorded goal savings changed after the separation check. Load the saved buffer inputs, recalculate, and confirm whether the money is still separate. This reminder stays until you check again.' : 'You confirmed that buffer money is not also counted for the goal. The app has not verified bank balances or assessed whether the target is appropriate.'}</AlertDescription></Alert>
        <div><Link to={withJourneySource('/tools/emergency-buffer', plan.source)} className={buttonVariants({ variant: 'outline' })}>Review/edit buffer check</Link></div>
        <p className="text-sm text-muted-foreground">In the tool, choose Load saved buffer check. Any exploratory draft will only be replaced after confirmation.</p>
      </> : <>
        <p>No buffer check added. This is different from a zero-sized buffer.</p>
        <div><Link to={withJourneySource('/tools/emergency-buffer', { kind: 'roadmap' })} className={buttonVariants({ variant: 'outline' })}>Open emergency buffer</Link></div>
      </>}
    </section>
  );
}
