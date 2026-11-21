import { Link, useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import type { ProfileSection } from './types';

const SECTIONS: Record<ProfileSection, { title: string; description: string }> = {
  goal: { title: 'One goal', description: 'What is the money for, how much might you need, and when?' },
  liquidity: { title: 'Time and access', description: 'Could you need part of the money earlier? Which access conditions need checking?' },
  risk: { title: 'Capacity and comfort', description: 'What would a loss mean for this goal? Keep that separate from how you feel about price swings.' },
  knowledge: { title: 'What you understand', description: 'Identify concepts you know and questions to research. Self-reported experience is not quiz evidence.' },
  review: { title: 'Questions to revisit', description: 'Which assumptions would change after a new responsibility, goal date, or change in circumstances?' },
};

export function RoadmapSetupPage() {
  const [search] = useSearchParams();
  const sections = search.getAll('section');
  const selected = sections.length === 1 && Object.hasOwn(SECTIONS, sections[0]) ? sections[0] as ProfileSection : null;
  const source = readJourneySource(search);
  return (
    <JourneyPage title="Your goal and risk worksheet" description="A preview of the upcoming setup. Separate your goal, constraints, and questions—without being assigned a permanent investor type.">
      <Alert role="note"><AlertTitle>Profile forms are not available yet</AlertTitle><AlertDescription>There is nothing to fill in or save in this preview. You will be able to skip nonessential questions and answer “Not sure”.</AlertDescription></Alert>
      {selected && <Alert role="note"><AlertTitle>Focus: {SECTIONS[selected].title}</AlertTitle><AlertDescription>{SECTIONS[selected].description}</AlertDescription></Alert>}
      <div className="grid gap-5 @2xl:grid-cols-2">
        {Object.entries(SECTIONS).map(([id, section]) => <Card key={id}><CardHeader><CardTitle><h2>{section.title}</h2></CardTitle><CardDescription>{section.description}</CardDescription></CardHeader></Card>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={withJourneySource('/roadmap', source)} className={buttonVariants({ variant: 'outline' })}>My Roadmap</Link>
        <Link to={withJourneySource('/tools', source)} className={buttonVariants({ variant: 'ghost' })}>Tool previews</Link>
      </div>
    </JourneyPage>
  );
}
