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
}

export interface Quiz {
  id: number;
  quizType: QuizType;
  title: string;
  chapterId: number;
  /** Set for control quizzes, null for final quizzes. */
  subchapterId: number | null;
  /** Minimum number of correct answers to pass, if the quiz has one. */
  passMark: number | null;
  questions: Question[];
}
