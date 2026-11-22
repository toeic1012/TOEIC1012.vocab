import * as XLSX from 'xlsx';
import { VOCABULARY_DATA } from '../data/defaultDeck';
import type { FlashcardItem, ImportSummary } from '../types/flashcard';
import { evaluateGuess } from './comparison';

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const COLUMN_ALIASES: Record<keyof FlashcardItem, string[]> = {
  id: ['id', 'stt', 'no', 'number', 'sothutu', 'index'],
  word: ['word', 'vocab', 'vocabulary', 'tuvung', 'tu', 'term'],
  pos: ['pos', 'partofspeech', 'tuloai', 'loaitu', 'type', 'grammar'],
  example: ['example', 'examplesentence', 'sentence', 'cauvidu', 'vidu', 'ex'],
  exampleTranslation: [
    'exampletranslation',
    'translation',
    'dichvidu',
    'dichnghiacauvidu',
    'dichcauvidu',
    'nghiavidu',
  ],
  meaning: ['meaning', 'vietnamesemeaning', 'nghia', 'nghiatiengviet', 'definition', 'dichnghia'],
  collocation: ['collocation', 'collocations', 'phrase', 'phrases', 'cumtu', 'cumtudikem', 'idiom'],
};

function extractField(normalizedRow: Record<string, string>, field: keyof FlashcardItem): string {
  const aliases = COLUMN_ALIASES[field];
  for (const alias of aliases) {
    if (normalizedRow[alias] !== undefined && normalizedRow[alias] !== '') {
      return normalizedRow[alias];
    }
  }
  return '';
}

export async function parseExcelFile(file: File): Promise<ImportSummary> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File Excel không có trang tính (sheet) nào.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  if (!rawRows.length) {
    throw new Error('File Excel đang trống. Vui lòng kiểm tra dữ liệu và thử lại.');
  }

  const cards: FlashcardItem[] = [];
  let skippedRows = 0;

  rawRows.forEach((row, index) => {
    const normalizedRow: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const cleanKey = normalizeKey(k);
      if (cleanKey) {
        normalizedRow[cleanKey] = String(v ?? '').trim();
      }
    }

    const word = extractField(normalizedRow, 'word');
    const meaning = extractField(normalizedRow, 'meaning');
    const example = extractField(normalizedRow, 'example');
    const exampleTranslation = extractField(normalizedRow, 'exampleTranslation');
    const pos = extractField(normalizedRow, 'pos');
    const collocation = extractField(normalizedRow, 'collocation');
    const rawId = extractField(normalizedRow, 'id');

    if (!word && !meaning) {
      skippedRows += 1;
      return;
    }

    const numericId = Number(rawId);
    const id = rawId ? (Number.isFinite(numericId) ? numericId : rawId) : cards.length + 1;

    cards.push({
      id,
      word: word || `Từ #${index + 1}`,
      pos,
      example,
      exampleTranslation: exampleTranslation || undefined,
      meaning: meaning || 'Chưa có nghĩa tiếng Việt',
      collocation,
    });
  });

  if (!cards.length) {
    throw new Error(
      'Không tìm thấy cột dữ liệu hợp lệ. Hãy đảm bảo file Excel có tiêu đề cột: id, word, pos, example, meaning, collocation.',
    );
  }

  return {
    cards,
    fileName: file.name,
    skippedRows,
  };
}

export function downloadSampleExcel(): void {
  const worksheetData = VOCABULARY_DATA.map((card) => ({
    id: card.id,
    word: card.word,
    pos: card.pos,
    example: card.example,
    exampleTranslation: card.exampleTranslation ?? '',
    meaning: card.meaning,
    collocation: card.collocation,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 12 },
    { wch: 56 },
    { wch: 56 },
    { wch: 40 },
    { wch: 50 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TOEIC_Reading');
  XLSX.writeFile(workbook, 'TOEIC_Reading_Flashcards_Mau.xlsx');
}

function sanitizeFileSlug(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'TOEIC_Deck';
}

export function exportGuessComparisonExcel(
  deckName: string,
  cards: FlashcardItem[],
  guesses: Record<string, string>,
): void {
  let matchCount = 0;
  let partialCount = 0;
  let mismatchCount = 0;
  let unansweredCount = 0;

  const detailRows = cards.map((card) => {
    const guess = (guesses[String(card.id)] ?? '').trim();
    const evaluation = evaluateGuess(guess, card.meaning);

    if (evaluation.status === 'match') matchCount += 1;
    else if (evaluation.status === 'partial') partialCount += 1;
    else if (evaluation.status === 'mismatch') mismatchCount += 1;
    else unansweredCount += 1;

    return {
      STT: card.id,
      'Từ vựng': card.word,
      'Từ loại': card.pos,
      'Nghĩa học viên đoán': guess || '(Chưa điền)',
      'Đáp án chuẩn': card.meaning,
      'Kết quả đối chiếu': evaluation.label,
      Collocations: card.collocation,
      'Câu ví dụ': card.example,
      'Dịch câu ví dụ': card.exampleTranslation ?? '',
    };
  });

  const answeredCount = cards.length - unansweredCount;
  const accuracyPct =
    answeredCount > 0 ? `${Math.round((matchCount / answeredCount) * 100)}%` : '0%';

  const summaryRows = [
    { 'Hạng mục': 'Bộ thẻ', 'Giá trị': deckName },
    { 'Hạng mục': 'Tổng số từ vựng', 'Giá trị': cards.length },
    { 'Hạng mục': 'Số từ đã đoán nghĩa', 'Giá trị': answeredCount },
    { 'Hạng mục': 'Khớp nghĩa', 'Giá trị': matchCount },
    { 'Hạng mục': 'Gần đúng (cần đối chiếu)', 'Giá trị': partialCount },
    { 'Hạng mục': 'Chưa khớp (cần ôn lại)', 'Giá trị': mismatchCount },
    { 'Hạng mục': 'Chưa điền', 'Giá trị': unansweredCount },
    { 'Hạng mục': 'Tỉ lệ khớp trên số câu đã điền', 'Giá trị': accuracyPct },
  ];

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  detailSheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 12 },
    { wch: 34 },
    { wch: 40 },
    { wch: 26 },
    { wch: 42 },
    { wch: 52 },
    { wch: 52 },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 36 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Doi_Chieu_Loi');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong_Ket');

  const safeSlug = sanitizeFileSlug(deckName);
  XLSX.writeFile(workbook, `So_Sanh_Loi_${safeSlug}.xlsx`);
}

export function exportGuessComparisonCsv(
  deckName: string,
  cards: FlashcardItem[],
  guesses: Record<string, string>,
): void {
  const headers = [
    'STT',
    'Từ vựng',
    'Từ loại',
    'Nghĩa học viên đoán',
    'Đáp án chuẩn',
    'Kết quả đối chiếu',
    'Collocations',
    'Câu ví dụ',
  ];

  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '');
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.map(escapeCsv).join(','),
    ...cards.map((card) => {
      const guess = (guesses[String(card.id)] ?? '').trim();
      const evaluation = evaluateGuess(guess, card.meaning);
      return [
        card.id,
        card.word,
        card.pos,
        guess || '(Chưa điền)',
        card.meaning,
        evaluation.label,
        card.collocation,
        card.example,
      ]
        .map(escapeCsv)
        .join(',');
    }),
  ];

  // UTF-8 BOM so Microsoft Excel displays Vietnamese characters cleanly
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `So_Sanh_Loi_${sanitizeFileSlug(deckName)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
