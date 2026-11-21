import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { withJourneySource } from '@/journey/routes';

export function RoadmapPage() {
  return (
    <JourneyPage title="My Roadmap" description="Learn a concept, practise safely, then choose a practical next step. Your personal planning space is being built.">
      <div className="grid gap-5 @2xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle><h2>Start with your goal</h2></CardTitle>
            <CardDescription>The upcoming worksheet will help you clarify one goal, when you need the money, and what you still need to understand. It will not recommend a portfolio.</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto"><Link to={withJourneySource('/roadmap/setup', { kind: 'roadmap' })} className={buttonVariants({ variant: 'outline' })}>Preview goal and profile setup</Link></CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><h2>Understand the numbers</h2></CardTitle>
            <CardDescription>Explore the planned goal, emergency buffer, and fee tools. Each will lead to an action you can choose—not a prompt to buy or trade.</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto"><Link to={withJourneySource('/tools', { kind: 'roadmap' })} className={buttonVariants({ variant: 'outline' })}>Explore tool previews</Link></CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><h2>Learn and practise</h2></CardTitle>
            <CardDescription>Lessons and fictional scenarios are available now. Moving here and back keeps your learning progress for this session.</CardDescription>
          </CardHeader>
          <CardFooter className="flex-wrap gap-2"><Link to="/learning" className={buttonVariants({ variant: 'outline' })}>Learning path</Link><Link to="/scenarios" className={buttonVariants({ variant: 'ghost' })}>Scenarios</Link></CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><h2>Take a practical step</h2></CardTitle>
            <CardDescription>A personal checklist and reflections will arrive in the next milestone. For now, you can learn what to look for without submitting financial information.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </JourneyPage>
  );
}
