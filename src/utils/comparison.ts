import type { GuessEvaluation } from '../types/flashcard';

function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateGuess(guessRaw: string, officialMeaning: string): GuessEvaluation {
  const guess = guessRaw.trim();
  if (!guess) {
    return { status: 'unanswered', label: 'Chưa điền' };
  }

  const normGuess = normalizeVietnamese(guess);
  const normMeaning = normalizeVietnamese(officialMeaning);

  if (!normGuess) {
    return { status: 'unanswered', label: 'Chưa điền' };
  }

  const meaningSegments = officialMeaning
    .split(/[,;/()]+/)
    .map((seg) => normalizeVietnamese(seg))
    .filter((seg) => seg.length >= 2);

  // Direct match against any meaning segment or full meaning
  if (
    normGuess === normMeaning ||
    meaningSegments.some(
      (seg) =>
        seg === normGuess ||
        (normGuess.length >= 3 && seg.includes(normGuess)) ||
        (seg.length >= 3 && normGuess.includes(seg)),
    )
  ) {
    return { status: 'match', label: 'Khớp nghĩa' };
  }

  // Word-level overlap check for partial match
  const guessTokens = normGuess.split(' ').filter((w) => w.length >= 2);
  const meaningTokenSet = new Set(normMeaning.split(' ').filter((w) => w.length >= 2));

  if (guessTokens.length > 0) {
    const matchedCount = guessTokens.filter((token) => meaningTokenSet.has(token)).length;
    if (matchedCount / guessTokens.length >= 0.5) {
      return { status: 'partial', label: 'Gần đúng — cần đối chiếu' };
    }
  }

  return { status: 'mismatch', label: 'Chưa khớp — cần ôn lại' };
}
