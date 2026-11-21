import type { ToolId } from './types';

export const TOOL_IDS = ['goal-planner', 'emergency-buffer', 'fee-impact'] as const satisfies readonly ToolId[];

export function toolPath(id: ToolId): string {
  return `/tools/${id}`;
}
