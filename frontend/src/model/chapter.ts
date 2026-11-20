// Mirrors backend DTO: ChapterResponse.

import type { SubchapterSummary } from './subchapter';

export interface Chapter {
  id: number;
  sortOrder: number;
  title: string;
  objective: string | null;
  missionTitle: string | null;
  missionDescription: string | null;
  finalQuizId: number | null;
  subchapters: SubchapterSummary[];
}
