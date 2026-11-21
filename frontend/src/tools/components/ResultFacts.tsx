export function ResultFacts({ facts }: { readonly facts: readonly (readonly [string, string])[] }) {
  return (
    <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
      {facts.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-heading text-lg font-semibold [overflow-wrap:anywhere]">{value}</dd></div>)}
    </dl>
  );
}
