import { useMemo, useState, type MouseEvent } from 'react';
import {
  Check,
  Download,
  FileCode2,
  FileSpreadsheet,
  Search,
  Upload,
  Volume2,
} from 'lucide-react';
import type { FlashcardItem } from '../types/flashcard';

interface VocabularySectionProps {
  cards: FlashcardItem[];
  activeCardId: number | string | null;
  masteredIds: Set<string>;
  speechSupported: boolean;
  onSelectWord: (card: FlashcardItem) => void;
  onSpeakWord: (card: FlashcardItem) => void;
  onTriggerExcelImport: () => void;
  onDownloadSampleExcel: () => void;
  onExportSingleHtml: () => void;
}

export function VocabularySection({
  cards,
  activeCardId,
  masteredIds,
  speechSupported,
  onSelectWord,
  onSpeakWord,
  onTriggerExcelImport,
  onDownloadSampleExcel,
  onExportSingleHtml,
}: VocabularySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (item) =>
        item.word.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.collocation.toLowerCase().includes(q) ||
        String(item.id).toLowerCase().includes(q),
    );
  }, [cards, searchQuery]);

  const handleRowSpeakerClick =
    (card: FlashcardItem) => (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onSpeakWord(card);
    };

  return (
    <section
      id="vocabulary-list"
      aria-label="Danh sách tổng hợp từ vựng"
      className="mt-12 bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    >
      {/* Pastel Section Header with 3D #2A154A depth rim */}
      <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[#1A1A1A]">
            Danh sách tổng hợp từ vựng
          </h2>
          <span className="px-3 py-0.5 rounded-full bg-[#5B2CA0] text-[#FFFFFF] text-xs font-mono tabular-nums font-semibold">
            {filteredWords.length} / {cards.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTriggerExcelImport}
            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#2A154A]/20 text-xs font-semibold text-[#1A1A1A] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] hover:border-[#5B2CA0] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Nạp Excel</span>
          </button>

          <button
            type="button"
            onClick={onDownloadSampleExcel}
            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#2A154A]/20 text-xs font-semibold text-[#1A1A1A] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] hover:border-[#5B2CA0] transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Excel mẫu</span>
          </button>

          <button
            type="button"
            onClick={onExportSingleHtml}
            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#5B2CA0] text-xs font-semibold text-[#FFFFFF] hover:bg-[#4A2285] transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Xuất HTML đơn</span>
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search Bar & Vocabulary List */}
      <div className="p-6 sm:p-8">
        <div className="relative max-w-xl mb-6">
          <Search
            className="w-4 h-4 text-[#4A3B69] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh theo từ tiếng Anh, nghĩa tiếng Việt hoặc collocations..."
            aria-label="Tìm kiếm từ vựng"
            className="w-full min-h-[44px] pl-11 pr-4 py-2.5 text-sm bg-[#F9F8FC] border border-[#E9DDF8] rounded-full text-[#1A1A1A] placeholder:text-[#4A3B69]/65 focus:bg-[#FFFFFF] focus:border-[#5B2CA0] focus:outline-none transition-colors"
          />
        </div>

        {filteredWords.length === 0 ? (
          <div className="py-10 text-center bg-[#F9F8FC] rounded-[20px] border border-[#E9DDF8]">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              Không tìm thấy từ vựng phù hợp với &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0E9FA]">
            {filteredWords.map((card) => {
              const isMastered = masteredIds.has(String(card.id));
              const isActive = activeCardId !== null && String(activeCardId) === String(card.id);

              return (
                <div
                  key={String(card.id)}
                  onClick={() => onSelectWord(card)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectWord(card);
                    }
                  }}
                  className={`py-4 px-4 -mx-2 rounded-[18px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#5B2CA0] ${
                    isActive
                      ? 'bg-[#E9DDF8]/70'
                      : 'hover:bg-[#F9F8FC]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span
                      className={`font-mono tabular-nums text-sm font-bold w-8 shrink-0 pt-0.5 ${
                        isActive ? 'text-[#D91E2A]' : 'text-[#5B2CA0]'
                      }`}
                    >
                      {card.id}.
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-extrabold text-[#1A1A1A]">
                          {card.word}
                        </span>
                        {card.pos ? (
                          <span className="text-xs font-semibold text-[#4A3B69]">
                            {card.pos}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm text-[#1A1A1A] mt-0.5">{card.meaning}</p>

                      {card.collocation ? (
                        <p className="text-xs text-[#4A3B69] mt-1 line-clamp-1">
                          Collocations: {card.collocation}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isMastered
                          ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                          : 'bg-[#E9DDF8] text-[#1A1A1A]'
                      }`}
                    >
                      {isMastered ? <Check className="w-3 h-3" aria-hidden="true" /> : null}
                      <span>{isMastered ? 'Đã nhớ' : 'Chưa nhớ'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleRowSpeakerClick(card)}
                      disabled={!speechSupported}
                      aria-label={`Phát âm từ ${card.word}`}
                      title={`Nghe phát âm: ${card.word}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#E9DDF8] bg-[#FFFFFF] text-[#5B2CA0] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] hover:border-[#5B2CA0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
                    >
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
