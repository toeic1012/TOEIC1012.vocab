export interface FlashcardItem {
  id: number | string;
  word: string;
  pos: string;
  example: string;
  exampleTranslation?: string;
  meaning: string;
  collocation: string;
}

export interface DeckSpacedRepetition {
  firstCompletedAt: number | null;
  completedStages: number[];
  lastReviewedAt?: number | null;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  fileName?: string;
  createdAt: number;
  cards: FlashcardItem[];
  masteredIds: string[];
  guesses?: Record<string, string>;
  srs?: DeckSpacedRepetition;
  isDefault?: boolean;
}

export type ComparisonStatus = 'match' | 'partial' | 'mismatch' | 'unanswered';

export interface GuessEvaluation {
  status: ComparisonStatus;
  label: string;
}

export type SpeechRate = 0.75 | 1 | 1.25;
export type SpeechAccent = 'en-US' | 'en-GB';
export type SpeechMode = 'both' | 'word' | 'example' | 'collocations' | 'meaning' | 'custom';
export type FilterMode = 'all' | 'unmastered' | 'mastered';

export interface ImportSummary {
  cards: FlashcardItem[];
  fileName: string;
  skippedRows: number;
}
