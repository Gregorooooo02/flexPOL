// Mirrors backend DTOs: QuizResponse, QuestionResponse, AnswerOptionResponse.
// Correct answers and explanations are not part of these responses on purpose.

/** CONTROL: questions at the end of a subchapter. FINAL: quiz at the end of a chapter. */
export type QuizType = 'CONTROL' | 'FINAL';

export type AnswerLabel = 'A' | 'B' | 'C' | 'D';

export interface AnswerOption {
  id: number;
  label: AnswerLabel;
  text: string;
}

export interface Question {
  id: number;
  sortOrder: number;
  prompt: string;
  options: AnswerOption[];
  assignment?: AssignmentExercise;
  comparison?: PortfolioComparison;
  numberExercise?: NumberExercise;
}

export type NumberExercise = {
  label: string;
  unit: string;
} & (
  | { lab: NumberLab; dial: null }
  | { lab: null; dial: { max: number; step: number } }
);

export type NumberLab = {
  max: number;
  step: number;
  initial: number;
  balance: number;
} & (
  | { kind: 'COMPOUNDING' | 'SHOCK'; rate: number }
  | { kind: 'LOCKBOX'; bill: number }
);

export interface AssignmentExercise {
  mode: 'MATCH' | 'SORT';
  cards: { id: string; text: string; prices: readonly number[] | null }[];
  targets: { id: string; text: string }[];
}

export interface PortfolioComparison {
  company: string;
  startingBalance: number;
  dropPercent: number;
  portfolios: { id: string; name: string; exposurePercent: number; description: string }[];
}

export interface Quiz {
  id: number;
  quizType: QuizType;
  title: string;
  chapterId: number;
  /** Null for final quizzes. */
  subchapterId: number | null;
  /** Minimum number of correct answers to pass, if the quiz has one. */
  passMark: number | null;
  questions: Question[];
}
