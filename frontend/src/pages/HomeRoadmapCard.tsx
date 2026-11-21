import { useContext } from 'react';
import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { JourneySessionContext } from '@/journey/journeySessionContext';
import { PRACTICAL_CONNECTIONS } from '@/journey/connections.generated';
import { withJourneySource } from '@/journey/routes';
import { cn } from '@/lib/utils';

export function HomeRoadmapCard() {
  // Home is public: there is deliberately no personal session context while signed out.
  const session = useContext(JourneySessionContext);
  const state = session?.state;
  const unfinished = state?.actions.find((task) => task.goalId === state.goal?.id && task.status !== 'checked');
  const next = unfinished ? PRACTICAL_CONNECTIONS.find((action) => action.id === unfinished.actionId) : null;
  const resume = !!(state?.goal || state?.setupDraft || state?.savedSteps.length);
  return <Card>
    <CardHeader><CardTitle><h2>{resume ? 'Your next real-world step' : 'Put your learning into practice'}</h2></CardTitle><CardDescription>Build one goal, understand your constraints, and choose a practical action—not a product to buy.</CardDescription></CardHeader>
    <CardContent><p>{state?.setupDraft ? 'Your unfinished goal worksheet is kept for this session.' : next ? `An unfinished step: ${next.title}` : state?.savedSteps.length ? `${state.savedSteps.length} next ${state.savedSteps.length === 1 ? 'step saved' : 'steps saved'} from learning and practice.` : state?.goal ? 'Review your roadmap, explore the calculators, or check a practical task.' : 'Use the goal planner, emergency buffer and fee comparison with your own inputs. No lesson or sandbox score is required.'}</p></CardContent>
    <CardFooter className="flex-wrap gap-3"><Link to={withJourneySource(state?.setupDraft ? '/roadmap/setup' : '/roadmap', { kind: 'home' })} className={cn(buttonVariants({ size: 'lg' }), 'h-auto min-h-11 max-w-full whitespace-normal text-center')}>{resume ? 'Continue my roadmap' : 'Plan your next financial step'}</Link><span className="text-xs text-muted-foreground">This session only · refresh or logout clears your plan</span></CardFooter>
  </Card>;
}
