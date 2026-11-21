import type { ProfileSection } from '@/roadmap/types';
import type { ToolId } from '@/tools/types';

export type JourneySource =
  | { readonly kind: 'home' | 'roadmap' | 'tools' }
  | { readonly kind: 'lesson'; readonly code: string }
  | { readonly kind: 'chapter'; readonly number: number }
  | { readonly kind: 'scenario'; readonly slug: string };

export interface LearningCompletion {
  readonly nodeId: string;
  readonly provenance: 'practice' | 'final-quiz' | 'demo';
}

export interface LearningSessionState {
  readonly completions: Readonly<Record<string, LearningCompletion>>;
  readonly resumeNodeId: string | null;
}

export interface PracticalConnection {
  readonly id: string;
  readonly concept: string;
  readonly title: string;
  readonly description: string;
  readonly relevance: string;
  readonly lessonCodes: readonly string[];
  readonly chapterNumbers: readonly number[];
  readonly scenarioSlugs: readonly string[];
  readonly destination:
    | { readonly kind: 'tool'; readonly id: ToolId }
    | { readonly kind: 'profile'; readonly id: ProfileSection };
}
