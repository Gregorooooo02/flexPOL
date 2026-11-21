/** Paths of a scenario's pages. */
export const scenarioPath = (scenarioId: number) => `/scenarios/${scenarioId}`;
export const scenarioPlayPath = (scenarioId: number) => `/scenarios/${scenarioId}/play`;

/** Route ids are positive integers; anything else is treated as not found without a request. */
export function parseScenarioId(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
