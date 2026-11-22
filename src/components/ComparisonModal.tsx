import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Trash2, X } from 'lucide-react';
import type { ComparisonStatus, FlashcardItem } from '../types/flashcard';
import { evaluateGuess } from '../utils/comparison';

interface ComparisonModalProps {
  isOpen: boolean;
  deckName: string;
  cards: FlashcardItem[];
  guesses: Record<string, string>;
  onClose: () => void;
  onJumpToCard: (card: FlashcardItem) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onClearGuesses: () => void;
}

type ReviewFilter = 'all' | 'errors' | 'match';

export function ComparisonModal({
  isOpen,
  deckName,
  cards,
  guesses,
  onClose,
  onJumpToCard,
  onExportExcel,
  onExportCsv,
  onClearGuesses,
}: ComparisonModalProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const evaluatedRows = useMemo(
    () =>
      cards.map((card) => {
        const guess = (guesses[String(card.id)] ?? '').trim();
        const evaluation = evaluateGuess(guess, card.meaning);
        return { card, guess, evaluation };
      }),
    [cards, guesses],
  );

  const stats = useMemo(() => {
    let match = 0;
    let partial = 0;
    let mismatch = 0;
    let unanswered = 0;

    for (const row of evaluatedRows) {
      if (row.evaluation.status === 'match') match += 1;
      else if (row.evaluation.status === 'partial') partial += 1;
      else if (row.evaluation.status === 'mismatch') mismatch += 1;
      else unanswered += 1;
    }

    return {
      total: evaluatedRows.length,
      answered: evaluatedRows.length - unanswered,
      match,
      partial,
      mismatch,
      unanswered,
      needsAttention: partial + mismatch + unanswered,
    };
  }, [evaluatedRows]);

  const visibleRows = useMemo(() => {
    if (filter === 'match') {
      return evaluatedRows.filter((r) => r.evaluation.status === 'match');
    }
    if (filter === 'errors') {
      return evaluatedRows.filter((r) => r.evaluation.status !== 'match');
    }
    return evaluatedRows;
  }, [evaluatedRows, filter]);

  if (!isOpen) return null;

  const badgeStyle = (status: ComparisonStatus) => {
    if (status === 'match') return 'bg-[#5B2CA0] text-[#FFFFFF]';
    if (status === 'partial') return 'bg-[#D084E4] text-[#FFFFFF]';
    if (status === 'mismatch') return 'bg-[#D91E2A] text-[#FFFFFF]';
    return 'bg-[#E9DDF8] text-[#1A1A1A]';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A154A]/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_18px_52px_rgba(42,21,74,0.28)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pastel Header with #2A154A depth rim */}
        <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="comparison-modal-title"
              className="text-base sm:text-lg font-extrabold text-[#1A1A1A] truncate"
            >
              Bảng đối chiếu nghĩa đã đoán — {deckName}
            </h2>
            <p className="text-xs text-[#4A3B69] mt-0.5">
              Đã điền {stats.answered}/{stats.total} từ · Khớp nghĩa: {stats.match} · Cần xem lại/chưa điền: {stats.needsAttention}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng đối chiếu"
            className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#2A154A]/20 text-[#1A1A1A] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Filter & Export Action Bar */}
        <div className="px-6 py-4 border-b border-[#E9DDF8] bg-[#F9F8FC] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-[#FFFFFF] border border-[#E9DDF8] rounded-full">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                  : 'text-[#4A3B69] hover:text-[#1A1A1A]'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('errors')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'errors'
                  ? 'bg-[#D91E2A] text-[#FFFFFF]'
                  : 'text-[#4A3B69] hover:text-[#1A1A1A]'
              }`}
            >
              Cần xem lại / Chưa điền ({stats.needsAttention})
            </button>
            <button
              type="button"
              onClick={() => setFilter('match')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'match'
                  ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                  : 'text-[#4A3B69] hover:text-[#1A1A1A]'
              }`}
            >
              Khớp nghĩa ({stats.match})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.answered > 0 ? (
              <button
                type="button"
                onClick={onClearGuesses}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full border border-[#4A3B69]/30 bg-[#FFFFFF] text-xs font-semibold text-[#4A3B69] hover:bg-[#D91E2A] hover:border-[#D91E2A] hover:text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Xóa hết câu đoán</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full border border-[#E9DDF8] bg-[#FFFFFF] text-xs font-semibold text-[#1A1A1A] hover:bg-[#E9DDF8] transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-[#5B2CA0]" aria-hidden="true" />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#5B2CA0] text-xs font-semibold text-[#FFFFFF] hover:bg-[#4A2285] transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xuất Excel so sánh (.xlsx)</span>
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Comparison Table */}
        <div className="flex-1 overflow-auto p-6">
          {visibleRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#4A3B69]">
              Không có mục nào trong bộ lọc này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#E9DDF8] text-xs font-bold text-[#4A3B69]">
                    <th className="py-2.5 pr-3 w-12">STT</th>
                    <th className="py-2.5 px-3">Từ vựng</th>
                    <th className="py-2.5 px-3">Nghĩa bạn đoán</th>
                    <th className="py-2.5 px-3">Đáp án chuẩn</th>
                    <th className="py-2.5 pl-3 text-right">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E9FA] text-sm">
                  {visibleRows.map(({ card, guess, evaluation }) => (
                    <tr
                      key={String(card.id)}
                      onClick={() => {
                        onJumpToCard(card);
                        onClose();
                      }}
                      className="hover:bg-[#F9F8FC] transition-colors cursor-pointer"
                    >
                      <td className="py-3 pr-3 font-mono tabular-nums font-bold text-[#5B2CA0] align-top">
                        {card.id}.
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-extrabold text-[#1A1A1A]">{card.word}</div>
                        {card.pos ? (
                          <div className="text-xs text-[#4A3B69]">{card.pos}</div>
                        ) : null}
                      </td>
                      <td className="py-3 px-3 align-top max-w-[240px]">
                        {guess ? (
                          <span className="text-[#1A1A1A] font-medium">{guess}</span>
                        ) : (
                          <span className="text-xs italic text-[#4A3B69]/65">Chưa điền</span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-[#1A1A1A] max-w-[280px]">
                        {card.meaning}
                      </td>
                      <td className="py-3 pl-3 align-top text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${badgeStyle(
                            evaluation.status,
                          )}`}
                        >
                          {evaluation.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
