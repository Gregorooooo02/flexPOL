// Mirrors backend DTOs: SubchapterSummaryResponse, SubchapterResponse.

/** Fictional sandbox instrument a lesson introduces. */
export type SandboxInstrument = 'ACCESSIBLE_CASH' | 'MARKET_BASKET' | 'VOLATILE_ASSET' | 'LOCKED_TERM';

/** A subchapter as listed in the learning path, without the lesson body. */
export interface SubchapterSummary {
  id: number;
  /** Display code such as "1.3". */
  code: string;
  sortOrder: number;
  title: string;
  sandboxInstrument: SandboxInstrument | null;
}

/** A full subchapter, including the lesson body as Markdown. */
export interface Subchapter {
  id: number;
  chapterId: number;
  code: string;
  sortOrder: number;
  title: string;
  goal: string | null;
  sandboxInstrument: SandboxInstrument | null;
  lessonMarkdown: string;
  controlQuizId: number | null;
}
