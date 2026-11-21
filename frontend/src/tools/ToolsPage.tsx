import { Link, useSearchParams } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import { TOOL_DEFINITIONS } from './toolDefinitions';
import { TOOL_IDS, toolPath } from './routes';

export function ToolsPage() {
  const [search] = useSearchParams();
  const source = readJourneySource(search) ?? { kind: 'tools' as const };
  return (
    <JourneyPage status="active" activeLabel="Practical tools" title="Practical tools" description="Use the goal planner, emergency buffer and fee comparison, or build your goal and risk worksheet. Your inputs stay in this session.">
      <div className="grid gap-5 @2xl:grid-cols-2">
        {TOOL_IDS.map((id) => (
          <Card key={id}>
            <CardHeader>
              <Badge variant="outline">{TOOL_DEFINITIONS[id].available ? 'Available for this session' : 'Calculator coming later'}</Badge>
              <CardTitle><h2>{TOOL_DEFINITIONS[id].title}</h2></CardTitle>
              <CardDescription>{TOOL_DEFINITIONS[id].description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Link to={withJourneySource(toolPath(id), source)} className={buttonVariants({ variant: 'outline' })}>{TOOL_DEFINITIONS[id].available ? 'Open' : 'Preview'} {TOOL_DEFINITIONS[id].title.toLowerCase()}</Link>
            </CardFooter>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <Badge variant="outline">Available for this session</Badge>
            <CardTitle><h2>Goal and risk profile</h2></CardTitle>
            <CardDescription>Separate time horizon, access needs, loss capacity, comfort with uncertainty, and knowledge—without assigning an investor label.</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link to={withJourneySource('/roadmap/setup', source)} className={buttonVariants({ variant: 'outline' })}>Open the worksheet</Link>
          </CardFooter>
        </Card>
      </div>
      <div><Link to="/roadmap" className={buttonVariants({ variant: 'ghost' })}>Back to My Roadmap</Link></div>
    </JourneyPage>
  );
}
