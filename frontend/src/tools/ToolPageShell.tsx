import { useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { readJourneySource } from '@/journey/routes';
import { TOOL_DEFINITIONS } from './toolDefinitions';
import type { ToolId } from './types';
import { RelatedLearning } from './components/RelatedLearning';

export function ToolPageShell({ tool }: { readonly tool: ToolId }) {
  const definition = TOOL_DEFINITIONS[tool];
  const [search] = useSearchParams();
  const source = readJourneySource(search);
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
      <RelatedLearning tool={tool} source={source} />
    </JourneyPage>
  );
}
