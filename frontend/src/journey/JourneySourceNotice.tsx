import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { getScenarios } from '@/api/scenarioApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { scenarioPath } from '@/scenarios/routes';
import { connectionPath, connectionsForSource } from './connections';
import { readJourneySource, sourceLabel, sourceReturnPath } from './routes';

function ScenarioReturnLink({ slug }: { readonly slug: string }) {
  const [result, setResult] = useState<{ path: string; missing?: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getScenarios(controller.signal).then((scenarios) => {
      if (controller.signal.aborted) return;
      const scenario = scenarios.find((candidate) => candidate.slug === slug);
      setResult(scenario ? { path: scenarioPath(scenario.id) } : { path: '/scenarios', missing: true });
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [slug, retry]);

  if (failed) return (
    <div className="flex flex-wrap items-center gap-2">
      <span>Couldn&apos;t find the scenario link.</span>
      <Button size="sm" variant="outline" onClick={() => { setFailed(false); setResult(null); setRetry((value) => value + 1); }}>
        Retry link
      </Button>
      <Link to="/scenarios">Browse scenarios</Link>
    </div>
  );
  if (!result) return <p role="status">Finding the current scenario brief…</p>;
  return (
    <div className="flex flex-col items-start gap-2">
      <p>{result.missing ? 'This scenario is no longer available.' : 'This opens the brief, not your previous replay. Runs are not saved.'}</p>
      <Link to={result.path} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        {result.missing ? 'Browse scenarios' : 'Return to scenario brief'}
      </Link>
    </div>
  );
}

export function JourneySourceNotice() {
  const [search] = useSearchParams();
  const { pathname } = useLocation();
  const source = readJourneySource(search);
  if (!source) return null;
  const connections = connectionsForSource(source);
  const relevant = connections.find((connection) => connectionPath(connection).split('?')[0] === pathname);
  return (
    <Alert role="note">
      <AlertTitle>Connected to {sourceLabel(source)}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>{relevant?.relevance ?? 'Bring the concept into your own planning. This connection is not a recommendation or proof of course completion.'}</p>
        {source.kind === 'scenario'
          ? <ScenarioReturnLink key={source.slug} slug={source.slug} />
          : <Link to={sourceReturnPath(source)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Return to {source.kind === 'lesson' ? 'lesson' : source.kind === 'chapter' ? 'chapter' : sourceLabel(source)}</Link>}
      </AlertDescription>
    </Alert>
  );
}
