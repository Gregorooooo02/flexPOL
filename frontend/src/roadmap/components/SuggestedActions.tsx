import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import type { RoadmapSuggestion } from '../roadmapSuggestions';

export function SuggestedActions({ suggestions, onAdd }: {
  readonly suggestions: readonly RoadmapSuggestion[];
  readonly onAdd: (actionId: string) => void;
}) {
  return suggestions.length ? (
    <div className="grid gap-4 @2xl:grid-cols-2">
      {suggestions.map(({ action, reason }) => (
        <Card key={action.id}>
          <CardHeader><CardTitle><h3>{action.title}</h3></CardTitle><CardDescription>{reason}</CardDescription></CardHeader>
          <CardContent><p>{action.description}</p></CardContent>
          <CardFooter className="mt-auto"><Button type="button" onClick={() => onAdd(action.id)} className="h-auto min-h-10 whitespace-normal">Add to my next steps</Button></CardFooter>
        </Card>
      ))}
    </div>
  ) : (
    <Empty><EmptyHeader><EmptyTitle>No new suggestions</EmptyTitle><EmptyDescription>Your selected tasks are kept below. Browse the practical actions if you want to explore another topic.</EmptyDescription></EmptyHeader></Empty>
  );
}
