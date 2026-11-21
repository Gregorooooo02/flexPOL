import { Link, useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { PRACTICAL_CONNECTIONS } from '@/journey/connections.generated';
import { lessonPath } from '@/journey/learningLinks';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import { TOOL_DEFINITIONS } from './toolDefinitions';
import type { ToolId } from './types';

export function ToolPageShell({ tool }: { readonly tool: ToolId }) {
  const definition = TOOL_DEFINITIONS[tool];
  const [search] = useSearchParams();
  const source = readJourneySource(search);
  const connections = PRACTICAL_CONNECTIONS.filter((connection) => connection.destination.kind === 'tool' && connection.destination.id === tool);
  const lessons = [...new Set(connections.flatMap((connection) => [...connection.lessonCodes]))];
  return (
    <JourneyPage title={definition.title} description={definition.description}>
      <Alert role="note">
        <AlertTitle>Calculator not available yet</AlertTitle>
        <AlertDescription>This preview explains the planned inputs and results. It does not collect figures, run calculations, or save a plan.</AlertDescription>
      </Alert>
      <div className="grid gap-5 @2xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><h2>What you will enter</h2></CardTitle></CardHeader>
          <CardContent><ul className="flex list-disc flex-col gap-2 pl-5">{definition.inputs.map((input) => <li key={input}>{input}</li>)}</ul></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><h2>What it will explain</h2></CardTitle></CardHeader>
          <CardContent><ul className="flex list-disc flex-col gap-2 pl-5">{definition.outputs.map((output) => <li key={output}>{output}</li>)}</ul></CardContent>
        </Card>
      </div>
      <Alert role="note"><AlertTitle>Keep the assumptions in view</AlertTitle><AlertDescription>{definition.limitation}</AlertDescription></Alert>
      <section aria-labelledby="related-learning" className="flex flex-col gap-3">
        <h2 id="related-learning" className="font-heading text-xl font-semibold">Explore the ideas first</h2>
        <p className="text-sm text-muted-foreground">Lessons follow the course order. A locked lesson will show the next available step.</p>
        <div className="flex flex-wrap gap-2">
          {lessons.map((code) => <Link key={code} to={lessonPath(code)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Lesson {code}</Link>)}
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link to={withJourneySource('/tools', source)} className={buttonVariants({ variant: 'outline' })}>All tools</Link>
        <Link to={withJourneySource('/roadmap', source)} className={buttonVariants({ variant: 'ghost' })}>My Roadmap</Link>
      </div>
    </JourneyPage>
  );
}
