import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { PRACTICAL_CONNECTIONS } from '@/journey/connections.generated';
import { lessonPath } from '@/journey/learningLinks';
import { withJourneySource } from '@/journey/routes';
import type { JourneySource } from '@/journey/types';
import type { ToolId } from '../types';
import { TOOL_DEFINITIONS } from '../toolDefinitions';

export function RelatedLearning({ tool, source }: { readonly tool: ToolId; readonly source: JourneySource | null }) {
  const lessons = [...new Set(PRACTICAL_CONNECTIONS.filter((connection) => connection.destination.kind === 'tool' && connection.destination.id === tool).flatMap((connection) => [...connection.lessonCodes]))];
  return (
    <section aria-labelledby="related-learning" className="flex flex-col gap-3">
      <h2 id="related-learning" className="font-heading text-xl font-semibold">Explore the ideas</h2>
      <p className="text-sm text-muted-foreground">Lessons follow the course order. A locked lesson will show the next available step.{TOOL_DEFINITIONS[tool].available ? ' Calculator inputs stay in this session when you leave; recalculate on return.' : ' This calculator is a preview; no calculation is available yet.'}</p>
      <div className="flex flex-wrap gap-2">{lessons.map((code) => <Link key={code} to={lessonPath(code)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Lesson {code}</Link>)}</div>
      <div className="flex flex-wrap gap-2"><Link to={withJourneySource('/tools', source)} className={buttonVariants({ variant: 'outline' })}>All tools</Link><Link to={withJourneySource('/roadmap', source)} className={buttonVariants({ variant: 'ghost' })}>My Roadmap</Link></div>
    </section>
  );
}
