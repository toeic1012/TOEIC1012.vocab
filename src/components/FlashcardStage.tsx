import type { MouseEvent } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  PenLine,
  RotateCw,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { FilterMode, FlashcardItem, SpeechMode } from '../types/flashcard';
import { evaluateGuess } from '../utils/comparison';

interface FlashcardStageProps {
  card: FlashcardItem | null;
  currentIndex: number;
  filteredCount: number;
  totalCount: number;
  masteredCount: number;
  unmasteredCount: number;
  filterMode: FilterMode;
  isFlipped: boolean;
  isShuffled: boolean;
  isCurrentMastered: boolean;
  isSpeaking: boolean;
  activeSpeechMode: SpeechMode | null;
  speechSupported: boolean;
  currentGuess: string;
  answeredCount: number;
  onChangeFilter: (mode: FilterMode) => void;
  onToggleShuffle: () => void;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleMastered: () => void;
  onSpeak: (mode: SpeechMode) => void;
  onSpeakCustom: (text: string) => void;
  onChangeGuess: (value: string) => void;
  onOpenComparison: () => void;
  onExportComparison: () => void;
}

export function FlashcardStage({
  card,
  currentIndex,
  filteredCount,
  totalCount,
  masteredCount,
  unmasteredCount,
  filterMode,
  isFlipped,
  isShuffled,
  isCurrentMastered,
  isSpeaking,
  activeSpeechMode,
  speechSupported,
  currentGuess,
  answeredCount,
  onChangeFilter,
  onToggleShuffle,
  onFlip,
  onPrev,
  onNext,
  onToggleMastered,
  onSpeak,
  onSpeakCustom,
  onChangeGuess,
  onOpenComparison,
  onExportComparison,
}: FlashcardStageProps) {
  const filterTabs: { id: FilterMode; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: totalCount },
    { id: 'unmastered', label: 'Chưa nhớ', count: unmasteredCount },
    { id: 'mastered', label: 'Đã nhớ', count: masteredCount },
  ];

  const handleAudioClick = (mode: SpeechMode) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSpeak(mode);
  };

  const collocationList = card?.collocation
    ? card.collocation
        .split(/,|;/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <section id="flashcard-stage" aria-label="Khu vực học thẻ Flashcard" className="w-full min-w-0">
      {/* Toolbar above flashcard: 3 filter tabs + card counter & shuffle icon */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div
          className="inline-flex items-center gap-1 p-1 bg-[#F9F8FC] border border-[#E9DDF8] rounded-full"
          role="tablist"
          aria-label="Lọc trạng thái ghi nhớ"
        >
          {filterTabs.map((tab) => {
            const isActive = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChangeFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B2CA0] ${
                  isActive
                    ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                    : 'text-[#4A3B69] hover:text-[#1A1A1A] hover:bg-[#E9DDF8]/60'
                }`}
              >
                {tab.label}{' '}
                <span className="font-mono tabular-nums opacity-90">({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <span className="text-sm font-mono tabular-nums font-bold text-[#1A1A1A] whitespace-nowrap">
            Thẻ{' '}
            <span className="text-[#D91E2A]">
              {filteredCount > 0 ? currentIndex + 1 : 0}
            </span>{' '}
            / {filteredCount}
          </span>

          <button
            type="button"
            onClick={onToggleShuffle}
            disabled={filteredCount <= 1}
            aria-pressed={isShuffled}
            title={isShuffled ? 'Tắt xáo trộn (về thứ tự gốc)' : 'Xáo trộn thứ tự thẻ'}
            aria-label={isShuffled ? 'Tắt xáo trộn' : 'Xáo trộn thẻ'}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
              isShuffled
                ? 'bg-[#D084E4] border-[#D084E4] text-[#FFFFFF] hover:bg-[#BE6DD4]'
                : 'bg-[#FFFFFF] border-[#E9DDF8] text-[#5B2CA0] hover:bg-[#E9DDF8]'
            }`}
          >
            <Shuffle className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Empty Filter State — ONLY shown when filtered list is truly empty */}
      {!card ? (
        <div className="bg-[#F9F8FC] border border-[#E9DDF8] rounded-[24px] p-10 min-h-[420px] flex flex-col items-center justify-center text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <p className="text-lg font-bold text-[#1A1A1A]">
            Không có thẻ nào trong nhóm lọc này
          </p>
          <p className="text-sm text-[#4A3B69] mt-2 max-w-[38ch]">
            {filterMode === 'unmastered'
              ? 'Tuyệt vời! Bạn đã ghi nhớ toàn bộ các từ vựng trong danh sách.'
              : 'Bạn chưa đánh dấu ghi nhớ từ nào. Hãy học và bấm "Đánh dấu đã nhớ" để lưu tiến độ.'}
          </p>
          <button
            type="button"
            onClick={() => onChangeFilter('all')}
            className="mt-6 inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full bg-[#5B2CA0] text-[#FFFFFF] text-sm font-semibold hover:bg-[#4A2285] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
          >
            Xem tất cả thẻ
          </button>
        </div>
      ) : (
        <>
          {/* Large 3D Flip Flashcard */}
          <div
            className="flashcard-scene w-full h-[450px] sm:h-[460px] cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5B2CA0] rounded-[24px]"
            onClick={onFlip}
            role="button"
            tabIndex={0}
            aria-pressed={isFlipped}
            aria-label={
              isFlipped
                ? 'Đang xem mặt sau. Nhấn để lật về mặt trước.'
                : 'Đang xem mặt trước. Nhấn để lật xem nghĩa tiếng Việt.'
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onFlip();
              }
            }}
          >
            <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
              {/* FRONT FACE */}
              <div className="flashcard-face bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                {/* Pastel Card Header with 3D #2A154A depth rim */}
                <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 sm:px-7 py-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm font-bold text-[#1A1A1A] truncate">
                    Mặt trước - Từ vựng &amp; Ví dụ
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${
                      isCurrentMastered
                        ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                        : 'bg-[#D084E4] text-[#FFFFFF]'
                    }`}
                  >
                    {isCurrentMastered ? 'Đã nhớ' : 'Chưa nhớ'}
                  </span>
                </div>

                {/* Front Body */}
                <div className="flex-1 flex flex-col justify-center px-6 sm:px-9 py-6 gap-5 overflow-y-auto">
                  <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A] leading-tight [text-wrap:balance]">
                      <span className="font-mono tabular-nums text-[#D91E2A] mr-2">
                        {card.id}.
                      </span>
                      <span>{card.word}</span>
                      {card.pos ? (
                        <span className="font-semibold text-xl sm:text-2xl text-[#4A3B69] ml-2.5 align-baseline">
                          {card.pos}
                        </span>
                      ) : null}
                    </h2>
                  </div>

                  {/* Example Sentence in Soft Background with Deep Purple Left Border */}
                  {card.example ? (
                    <div className="bg-[#F9F8FC] border-l-4 border-[#5B2CA0] rounded-r-[18px] px-5 py-4 text-left">
                      <p className="text-xs font-semibold text-[#4A3B69] mb-1">Câu ví dụ</p>
                      <p className="text-base sm:text-lg italic text-[#1A1A1A] leading-relaxed">
                        &ldquo;{card.example}&rdquo;
                      </p>
                    </div>
                  ) : null}

                  {/* 3 Audio Playback Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAudioClick('both')}
                      disabled={!speechSupported}
                      className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                        isSpeaking && activeSpeechMode === 'both'
                          ? 'bg-[#D91E2A] text-[#FFFFFF]'
                          : 'bg-[#5B2CA0] text-[#FFFFFF] hover:bg-[#4A2285]'
                      }`}
                    >
                      {speechSupported ? (
                        <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isSpeaking && activeSpeechMode === 'both'
                          ? 'Đang phát...'
                          : 'Phát âm từ & ví dụ'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAudioClick('word')}
                      disabled={!speechSupported}
                      className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                        isSpeaking && activeSpeechMode === 'word'
                          ? 'bg-[#D91E2A] border-[#D91E2A] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] border-[#E9DDF8] text-[#1A1A1A] hover:bg-[#E9DDF8]'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Chỉ đọc từ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAudioClick('example')}
                      disabled={!speechSupported || !card.example}
                      className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                        isSpeaking && activeSpeechMode === 'example'
                          ? 'bg-[#D91E2A] border-[#D91E2A] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] border-[#E9DDF8] text-[#1A1A1A] hover:bg-[#E9DDF8]'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Đọc ví dụ</span>
                    </button>
                  </div>
                </div>

                <div className="px-6 pb-4 text-center text-xs text-[#4A3B69]/80">
                  Bấm vào thẻ hoặc nhấn phím Space để lật xem nghĩa
                </div>
              </div>

              {/* BACK FACE */}
              <div className="flashcard-face flashcard-face-back bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                {/* Pastel Card Header with 3D #2A154A depth rim */}
                <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 sm:px-7 py-3 flex items-center justify-between gap-2.5">
                  <span className="text-xs sm:text-sm font-bold text-[#1A1A1A] truncate">
                    Mặt sau - Nghĩa &amp; Collocations
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAudioClick('collocations')}
                      disabled={!speechSupported}
                      aria-label="Đọc toàn bộ cụm từ Collocations ở mặt sau"
                      title="Đọc Collocations ở mặt sau"
                      className={`inline-flex items-center justify-center gap-1.5 min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                        isSpeaking && activeSpeechMode === 'collocations'
                          ? 'bg-[#D91E2A] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] border border-[#2A154A]/20 text-[#1A1A1A] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] hover:border-[#5B2CA0]'
                      }`}
                    >
                      {speechSupported ? (
                        <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isSpeaking && activeSpeechMode === 'collocations'
                          ? 'Đang đọc...'
                          : collocationList.length > 0
                            ? 'Đọc Collocations'
                            : 'Đọc mặt sau'}
                      </span>
                    </button>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${
                        isCurrentMastered
                          ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                          : 'bg-[#D084E4] text-[#FFFFFF]'
                      }`}
                    >
                      {isCurrentMastered ? 'Đã nhớ' : 'Chưa nhớ'}
                    </span>
                  </div>
                </div>

                {/* Back Body */}
                <div className="flex-1 flex flex-col justify-center px-6 sm:px-9 py-5 gap-4 overflow-y-auto">
                  {/* Vietnamese Meaning + Face 2 Meaning Audio */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#4A3B69] mb-1">
                        Nghĩa tiếng Việt
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-snug">
                        {card.meaning}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAudioClick('meaning')}
                      disabled={!speechSupported || !card.meaning}
                      aria-label="Đọc nghĩa tiếng Việt ở mặt sau"
                      title="Đọc nghĩa tiếng Việt"
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                        isSpeaking && activeSpeechMode === 'meaning'
                          ? 'bg-[#D91E2A] border-[#D91E2A] text-[#FFFFFF]'
                          : 'bg-[#F9F8FC] border-[#E9DDF8] text-[#5B2CA0] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] hover:border-[#5B2CA0]'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Common Collocations (Clickable to hear each phrase) */}
                  {collocationList.length > 0 ? (
                    <div className="bg-[#E9DDF8]/75 rounded-[20px] px-5 py-3.5">
                      <p className="text-xs font-bold text-[#4A3B69] mb-2">
                        Collocations thường gặp (bấm từng cụm để nghe)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {collocationList.map((col, idx) => (
                          <button
                            key={`${col}-${idx}`}
                            type="button"
                            disabled={!speechSupported}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSpeakCustom(col);
                            }}
                            title={`Nghe phát âm: ${col}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D084E4]/50 text-xs sm:text-sm font-semibold text-[#1A1A1A] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] hover:border-[#5B2CA0] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
                            <span>{col}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Example Sentence Translation */}
                  {card.exampleTranslation ? (
                    <div className="bg-[#F9F8FC] border border-[#E9DDF8] rounded-[18px] px-5 py-3.5">
                      <p className="text-xs font-semibold text-[#4A3B69] mb-1">
                        Dịch nghĩa câu ví dụ
                      </p>
                      <p className="text-sm sm:text-base text-[#1A1A1A] leading-relaxed">
                        {card.exampleTranslation}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="px-6 pb-4 text-center text-xs text-[#4A3B69]/80">
                  Bấm vào thẻ hoặc nhấn phím Space để quay lại mặt trước
                </div>
              </div>
            </div>
          </div>

          {/* Control Row Below Card — STRICTLY 1 SINGLE ROW (no wrapping) */}
          <div className="mt-5 flex flex-nowrap items-center justify-between gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3.5 sm:px-5 py-2 rounded-full border border-[#E9DDF8] bg-[#FFFFFF] text-xs sm:text-sm font-semibold text-[#1A1A1A] hover:bg-[#F9F8FC] hover:border-[#D084E4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
            >
              <ChevronLeft className="w-4 h-4 text-[#5B2CA0] shrink-0" aria-hidden="true" />
              <span>Trước</span>
            </button>

            <button
              type="button"
              onClick={onFlip}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 sm:px-6 py-2 rounded-full bg-[#5B2CA0] text-xs sm:text-sm font-semibold text-[#FFFFFF] hover:bg-[#4A2285] shadow-[0_6px_18px_rgba(91,44,160,0.22)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
            >
              <RotateCw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Lật thẻ</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex >= filteredCount - 1}
              className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3.5 sm:px-5 py-2 rounded-full border border-[#E9DDF8] bg-[#FFFFFF] text-xs sm:text-sm font-semibold text-[#1A1A1A] hover:bg-[#F9F8FC] hover:border-[#D084E4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
            >
              <span>Tiếp</span>
              <ChevronRight className="w-4 h-4 text-[#5B2CA0] shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMastered}
              aria-pressed={isCurrentMastered}
              className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 sm:px-5 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                isCurrentMastered
                  ? 'bg-[#E9DDF8] border-[#5B2CA0] text-[#1A1A1A] hover:bg-[#D084E4] hover:border-[#D084E4] hover:text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] border-[#5B2CA0] text-[#5B2CA0] hover:bg-[#5B2CA0] hover:text-[#FFFFFF]'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isCurrentMastered ? 'Đã nhớ' : 'Đánh dấu đã nhớ'}</span>
            </button>
          </div>

          {/* Learner Guess Meaning Box Below Flashcard */}
          {(() => {
            const evaluation = evaluateGuess(currentGuess, card.meaning);
            const showInlineResult = isFlipped && currentGuess.trim().length > 0;
            const statusClass =
              evaluation.status === 'match'
                ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                : evaluation.status === 'partial'
                  ? 'bg-[#D084E4] text-[#FFFFFF]'
                  : 'bg-[#D91E2A] text-[#FFFFFF]';

            return (
              <div className="mt-5 bg-[#FFFFFF] border border-[#E9DDF8] rounded-[22px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-[#5B2CA0] shrink-0" aria-hidden="true" />
                    <label
                      htmlFor="guess-meaning-input"
                      className="text-xs sm:text-sm font-bold text-[#1A1A1A]"
                    >
                      Đoán nghĩa từ vựng ({card.word})
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono tabular-nums font-bold text-[#4A3B69]">
                      Đã điền{' '}
                      <span className="text-[#D91E2A]">{answeredCount}</span> / {totalCount}
                    </span>
                    {showInlineResult ? (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusClass}`}
                      >
                        {evaluation.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col gap-3.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      id="guess-meaning-input"
                      type="text"
                      value={currentGuess}
                      onChange={(e) => onChangeGuess(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!isFlipped) {
                            onFlip();
                          }
                        }
                      }}
                      placeholder="Ghi nghĩa tiếng Việt bạn đoán tại đây... (Nhấn Enter để lật xem đáp án)"
                      className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[#F9F8FC] border border-[#E9DDF8] text-sm text-[#1A1A1A] placeholder:text-[#4A3B69]/65 focus:bg-[#FFFFFF] focus:border-[#5B2CA0] focus:outline-none transition-colors"
                    />
                  </div>

                  {showInlineResult ? (
                    <div className="px-4 py-2.5 rounded-[16px] bg-[#F9F8FC] border border-[#E9DDF8] text-xs sm:text-sm flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[#4A3B69]">
                        Bạn đoán:{' '}
                        <strong className="text-[#1A1A1A]">&ldquo;{currentGuess.trim()}&rdquo;</strong>
                      </span>
                      <span className="text-[#4A3B69]">
                        Đáp án:{' '}
                        <strong className="text-[#5B2CA0]">{card.meaning}</strong>
                      </span>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <p className="text-xs text-[#4A3B69]">
                      Tự động lưu theo từng thẻ. Hoàn thành xong bạn có thể xuất file để đối chiếu lỗi.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={onOpenComparison}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full border border-[#E9DDF8] bg-[#F9F8FC] text-xs font-semibold text-[#1A1A1A] hover:bg-[#E9DDF8] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-[#5B2CA0] shrink-0" aria-hidden="true" />
                        <span>Xem đối chiếu</span>
                      </button>

                      <button
                        type="button"
                        onClick={onExportComparison}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#5B2CA0] text-xs font-semibold text-[#FFFFFF] hover:bg-[#4A2285] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Xuất file so sánh (.xlsx)</span>
                        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </section>
  );
}
