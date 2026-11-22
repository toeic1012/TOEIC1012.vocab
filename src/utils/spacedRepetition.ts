import type { DeckSpacedRepetition, FlashcardDeck } from '../types/flashcard';

export interface SrsStageDefinition {
  index: number;
  dayNumber: number;
  offsetDays: number;
  title: string;
  note: string;
}

export const SRS_STAGES: SrsStageDefinition[] = [
  { index: 0, dayNumber: 1, offsetDays: 0, title: 'Ngày 1', note: 'Học vòng đầu tiên' },
  { index: 1, dayNumber: 2, offsetDays: 1, title: 'Ngày 2', note: 'Ôn lại sau 1 ngày' },
  { index: 2, dayNumber: 4, offsetDays: 3, title: 'Ngày 4', note: 'Ôn lại sau 3 ngày' },
  { index: 3, dayNumber: 7, offsetDays: 6, title: 'Ngày 7', note: 'Củng cố sau 1 tuần' },
  { index: 4, dayNumber: 15, offsetDays: 14, title: 'Ngày 15', note: 'Nhắc lại sau 2 tuần' },
  { index: 5, dayNumber: 30, offsetDays: 29, title: 'Ngày 30', note: 'Ghi nhớ dài hạn' },
];

export type SrsStatus = 'not_started' | 'overdue' | 'due_today' | 'upcoming' | 'completed';

export interface ComputedSrsMilestone extends SrsStageDefinition {
  dueDate: Date;
  dueLabel: string;
  isCompleted: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  daysDiff: number;
}

export interface DeckSrsSummary {
  status: SrsStatus;
  firstCompletedAt: number | null;
  firstCompletedLabel: string | null;
  milestones: ComputedSrsMilestone[];
  nextStage: ComputedSrsMilestone | null;
  completedCount: number;
  totalStages: number;
}

const MS_PER_DAY = 86_400_000;

function startOfLocalDay(dateInput: number | Date): Date {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

export function formatShortDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export function formatFullDate(dateInput: number | Date): string {
  const d = new Date(dateInput);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function getDeckSrsSummary(
  srs: DeckSpacedRepetition | undefined,
  nowTimestamp: number = Date.now(),
): DeckSrsSummary {
  if (!srs || !srs.firstCompletedAt) {
    return {
      status: 'not_started',
      firstCompletedAt: null,
      firstCompletedLabel: null,
      milestones: [],
      nextStage: null,
      completedCount: 0,
      totalStages: SRS_STAGES.length,
    };
  }

  const day1Start = startOfLocalDay(srs.firstCompletedAt);
  const todayStart = startOfLocalDay(nowTimestamp);
  const completedSet = new Set(srs.completedStages ?? [0]);
  completedSet.add(0); // Day 1 is completed once firstCompletedAt is recorded

  const milestones: ComputedSrsMilestone[] = SRS_STAGES.map((stage) => {
    const dueDate = addDays(day1Start, stage.offsetDays);
    const daysDiff = Math.round((dueDate.getTime() - todayStart.getTime()) / MS_PER_DAY);
    const isCompleted = completedSet.has(stage.index);

    return {
      ...stage,
      dueDate,
      dueLabel: formatShortDate(dueDate),
      isCompleted,
      isDueToday: !isCompleted && daysDiff === 0,
      isOverdue: !isCompleted && daysDiff < 0,
      daysDiff,
    };
  });

  const nextStage = milestones.find((m) => !m.isCompleted) ?? null;
  const completedCount = milestones.filter((m) => m.isCompleted).length;

  let status: SrsStatus = 'completed';
  if (nextStage) {
    if (nextStage.daysDiff < 0) status = 'overdue';
    else if (nextStage.daysDiff === 0) status = 'due_today';
    else status = 'upcoming';
  }

  return {
    status,
    firstCompletedAt: srs.firstCompletedAt,
    firstCompletedLabel: formatFullDate(srs.firstCompletedAt),
    milestones,
    nextStage,
    completedCount,
    totalStages: SRS_STAGES.length,
  };
}

function formatIcsDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadSrsCalendarIcs(deck: FlashcardDeck): boolean {
  const summary = getDeckSrsSummary(deck.srs);
  if (!summary.firstCompletedAt) return false;

  const upcomingMilestones = summary.milestones.filter((m) => m.index > 0 && !m.isCompleted);
  const targets = upcomingMilestones.length > 0 ? upcomingMilestones : summary.milestones.slice(1);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const events = targets.map((m) => {
    const dtStart = formatIcsDate(m.dueDate);
    const dtEnd = formatIcsDate(addDays(m.dueDate, 1));
    const title = `Ôn từ vựng TOEIC 1012: ${deck.name} (${m.title})`;
    const desc = `${m.note} — Bộ thẻ gồm ${deck.cards.length} từ vựng (Ngày 1 bắt đầu: ${summary.firstCompletedLabel}).`;

    return [
      'BEGIN:VEVENT',
      `UID:${deck.id}-srs-${m.index}@toeic1012`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `DESCRIPTION:${escapeIcsText(desc)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT9H',
      `DESCRIPTION:${escapeIcsText(title)}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TOEIC 1012//Spaced Repetition Flashcards//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const safeSlug =
    deck.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'TOEIC_Deck';

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Lich_On_Tap_${safeSlug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
