import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, Bell, CheckCircle2, List, RotateCcw, X } from 'lucide-react';
import { ComparisonModal } from './components/ComparisonModal';
import { ConfirmResetModal } from './components/ConfirmResetModal';
import { ControlSidebar } from './components/ControlSidebar';
import { DeckManagerBar } from './components/DeckManagerBar';
import { FlashcardStage } from './components/FlashcardStage';
import { SpacedRepetitionCard } from './components/SpacedRepetitionCard';
import { VocabularySection } from './components/VocabularySection';
import { VOCABULARY_DATA } from './data/defaultDeck';
import type {
  FilterMode,
  FlashcardDeck,
  FlashcardItem,
  SpeechAccent,
  SpeechMode,
  SpeechRate,
} from './types/flashcard';
import {
  downloadSampleExcel,
  exportGuessComparisonCsv,
  exportGuessComparisonExcel,
  parseExcelFile,
} from './utils/excel';
import { downloadStandaloneHtml } from './utils/exportSingleHtml';
import { downloadSrsCalendarIcs, getDeckSrsSummary } from './utils/spacedRepetition';
import { isSpeechSupported, speakFlashcardAudio, stopSpeaking } from './utils/speech';

const STORAGE_KEY_DECKS = 'toeic_1012_decks_v1';
const STORAGE_KEY_ACTIVE_DECK = 'toeic_1012_active_deck_v1';
const LOGO_SRC = '/assets/aistudio/_nh_ch_p_m_n_h_nh_2026-09-23_121413_3be5139b.png';

interface FeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDefaultDeck(): FlashcardDeck {
  return {
    id: 'default-day-1',
    name: 'TOEIC Reading • Ngày 1',
    createdAt: Date.now(),
    cards: VOCABULARY_DATA,
    masteredIds: [],
    isDefault: true,
  };
}

function loadInitialDecks(): { decks: FlashcardDeck[]; activeId: string } {
  try {
    const rawDecks = localStorage.getItem(STORAGE_KEY_DECKS);
    const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_DECK);
    if (rawDecks) {
      const parsed = JSON.parse(rawDecks) as FlashcardDeck[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.filter(
          (d) => d && typeof d.id === 'string' && Array.isArray(d.cards) && d.cards.length > 0,
        );
        if (sanitized.length > 0) {
          const validActive =
            savedActiveId && sanitized.some((d) => d.id === savedActiveId)
              ? savedActiveId
              : sanitized[0].id;
          return { decks: sanitized, activeId: validActive };
        }
      }
    }
  } catch {
    // Fallback to default deck
  }

  const fallback = createDefaultDeck();
  return { decks: [fallback], activeId: fallback.id };
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.(xlsx|xls|csv)$/i, '').trim() || 'Bộ từ mới';
}

export default function App() {
  const initial = useMemo(() => loadInitialDecks(), []);

  const [decks, setDecks] = useState<FlashcardDeck[]>(initial.decks);
  const [activeDeckId, setActiveDeckId] = useState<string>(initial.activeId);

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffledOrderIds, setShuffledOrderIds] = useState<string[]>([]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const [accent, setAccent] = useState<SpeechAccent>('en-US');
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSpeechMode, setActiveSpeechMode] = useState<SpeechMode | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSupported = isSpeechSupported();

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId) ?? decks[0],
    [decks, activeDeckId],
  );

  const deck = activeDeck.cards;
  const masteredIds = useMemo(() => new Set(activeDeck.masteredIds), [activeDeck.masteredIds]);
  const guesses = useMemo(() => activeDeck.guesses ?? {}, [activeDeck.guesses]);
  const answeredCount = useMemo(
    () => deck.filter((c) => (guesses[String(c.id)] ?? '').trim().length > 0).length,
    [deck, guesses],
  );
  const activeDeckSrs = useMemo(() => getDeckSrsSummary(activeDeck.srs), [activeDeck.srs]);

  // Identify any decks across the workspace that are due today or overdue for review
  const dueDecks = useMemo(() => {
    return decks
      .map((d) => ({ deck: d, summary: getDeckSrsSummary(d.srs) }))
      .filter(
        ({ summary }) => summary.status === 'due_today' || summary.status === 'overdue',
      );
  }, [decks]);

  // Persist all decks + per-deck progress automatically to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
      localStorage.setItem(STORAGE_KEY_ACTIVE_DECK, activeDeck.id);
    } catch {
      // Ignore storage quota errors
    }
  }, [decks, activeDeck.id]);

  // Preload browser speech voices
  useEffect(() => {
    if (!speechSupported) return;
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
      stopSpeaking();
    };
  }, [speechSupported]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  }, []);

  // Derive ordered deck (either original order or shuffled order)
  const orderedDeck = useMemo(() => {
    if (!isShuffled || shuffledOrderIds.length === 0) return deck;
    const byId = new Map(deck.map((item) => [String(item.id), item]));
    const ordered: FlashcardItem[] = [];
    for (const id of shuffledOrderIds) {
      const found = byId.get(id);
      if (found) {
        ordered.push(found);
        byId.delete(id);
      }
    }
    byId.forEach((remaining) => ordered.push(remaining));
    return ordered;
  }, [deck, isShuffled, shuffledOrderIds]);

  // Derive filtered list according to active tab
  const filteredCards = useMemo(() => {
    if (filterMode === 'mastered') {
      return orderedDeck.filter((c) => masteredIds.has(String(c.id)));
    }
    if (filterMode === 'unmastered') {
      return orderedDeck.filter((c) => !masteredIds.has(String(c.id)));
    }
    return orderedDeck;
  }, [orderedDeck, filterMode, masteredIds]);

  const safeIndex =
    filteredCards.length === 0
      ? 0
      : Math.min(currentIndex, filteredCards.length - 1);

  const currentCard = filteredCards[safeIndex] ?? null;
  const isCurrentMastered = currentCard ? masteredIds.has(String(currentCard.id)) : false;

  // Progress statistics for active deck
  const totalCount = deck.length;
  const masteredCount = useMemo(
    () => deck.filter((c) => masteredIds.has(String(c.id))).length,
    [deck, masteredIds],
  );
  const unmasteredCount = Math.max(0, totalCount - masteredCount);
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  const handleStopSpeech = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    setActiveSpeechMode(null);
  }, []);

  const handleSpeakCard = useCallback(
    (card: FlashcardItem | null, mode: SpeechMode = 'both', customText?: string) => {
      if (!card) return;
      if (isSpeaking && activeSpeechMode === mode && !customText) {
        handleStopSpeech();
        return;
      }

      speakFlashcardAudio(card, {
        mode,
        customText,
        accent,
        rate: speechRate,
        onStart: () => {
          setIsSpeaking(true);
          setActiveSpeechMode(mode);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setActiveSpeechMode(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setActiveSpeechMode(null);
          showFeedback('error', 'Không thể phát âm thanh trên trình duyệt này.');
        },
      });
    },
    [accent, activeSpeechMode, handleStopSpeech, isSpeaking, showFeedback, speechRate],
  );

  const markDeckDay1Completed = useCallback(
    (deckId: string, deckTitle: string) => {
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== deckId) return d;
          if (d.srs?.firstCompletedAt) return d;
          return {
            ...d,
            srs: {
              firstCompletedAt: Date.now(),
              completedStages: [0],
              lastReviewedAt: Date.now(),
            },
          };
        }),
      );
      showFeedback(
        'success',
        `Đã hoàn thành vòng học đầu tiên của bộ "${deckTitle}"! Đã tính Ngày 1 và kích hoạt lịch nhắc lặp lại ngắt quãng (Ngày 2, 4, 7, 15, 30).`,
      );
    },
    [showFeedback],
  );

  const checkAndTriggerDay1ForCard = useCallback(
    (reachedCard: FlashcardItem | undefined, reachedIndex: number, listLength: number) => {
      if (!reachedCard || activeDeck.srs?.firstCompletedAt || deck.length === 0) return;
      const lastCardInDeck = deck[deck.length - 1];
      const reachedLastInDeck = String(reachedCard.id) === String(lastCardInDeck.id);
      const reachedLastInAllView = filterMode === 'all' && reachedIndex >= listLength - 1;
      if (reachedLastInDeck || reachedLastInAllView) {
        markDeckDay1Completed(activeDeck.id, activeDeck.name);
      }
    },
    [activeDeck.id, activeDeck.name, activeDeck.srs?.firstCompletedAt, deck, filterMode, markDeckDay1Completed],
  );

  const handleFlip = useCallback(() => {
    if (!currentCard) return;
    setIsFlipped((prev) => !prev);
    if (deck.length === 1 && !activeDeck.srs?.firstCompletedAt) {
      markDeckDay1Completed(activeDeck.id, activeDeck.name);
    }
  }, [activeDeck.id, activeDeck.name, activeDeck.srs?.firstCompletedAt, currentCard, deck.length, markDeckDay1Completed]);

  const handlePrev = useCallback(() => {
    if (safeIndex <= 0) return;
    handleStopSpeech();
    setCurrentIndex(safeIndex - 1);
    setIsFlipped(false);
  }, [handleStopSpeech, safeIndex]);

  const handleNext = useCallback(() => {
    if (safeIndex >= filteredCards.length - 1) return;
    handleStopSpeech();
    const nextIdx = safeIndex + 1;
    setCurrentIndex(nextIdx);
    setIsFlipped(false);
    checkAndTriggerDay1ForCard(filteredCards[nextIdx], nextIdx, filteredCards.length);
  }, [checkAndTriggerDay1ForCard, filteredCards, handleStopSpeech, safeIndex]);

  const handleToggleSrsStage = useCallback(
    (stageIndex: number) => {
      if (stageIndex === 0) return;
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== activeDeck.id || !d.srs?.firstCompletedAt) return d;
          const set = new Set(d.srs.completedStages ?? [0]);
          set.add(0);
          if (set.has(stageIndex)) {
            set.delete(stageIndex);
          } else {
            set.add(stageIndex);
          }
          return {
            ...d,
            srs: {
              ...d.srs,
              completedStages: Array.from(set).sort((a, b) => a - b),
              lastReviewedAt: Date.now(),
            },
          };
        }),
      );
    },
    [activeDeck.id],
  );

  const handleResetSrsSchedule = useCallback(() => {
    setDecks((prev) =>
      prev.map((d) => (d.id === activeDeck.id ? { ...d, srs: undefined } : d)),
    );
    showFeedback(
      'success',
      `Đã đặt lại lịch nhắc lặp lại ngắt quãng cho bộ "${activeDeck.name}". Học đến từ cuối cùng để tính lại Ngày 1.`,
    );
  }, [activeDeck.id, activeDeck.name, showFeedback]);

  const handleExportSrsCalendar = useCallback(() => {
    const ok = downloadSrsCalendarIcs(activeDeck);
    if (ok) {
      showFeedback(
        'success',
        `Đã tải file lịch nhắc (.ics) cho bộ "${activeDeck.name}". Bạn có thể mở để thêm vào Google Calendar hoặc Apple Calendar.`,
      );
    }
  }, [activeDeck, showFeedback]);

  const handleToggleMastered = useCallback(() => {
    if (!currentCard) return;
    const idKey = String(currentCard.id);

    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== activeDeck.id) return d;
        const set = new Set(d.masteredIds);
        if (set.has(idKey)) {
          set.delete(idKey);
        } else {
          set.add(idKey);
        }
        return { ...d, masteredIds: Array.from(set) };
      }),
    );

    if (filterMode !== 'all') {
      setIsFlipped(false);
    }
  }, [activeDeck.id, currentCard, filterMode]);

  const handleChangeGuess = useCallback(
    (value: string) => {
      if (!currentCard) return;
      const idKey = String(currentCard.id);
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== activeDeck.id) return d;
          return {
            ...d,
            guesses: {
              ...(d.guesses ?? {}),
              [idKey]: value,
            },
          };
        }),
      );
    },
    [activeDeck.id, currentCard],
  );

  const handleClearGuesses = useCallback(() => {
    setDecks((prev) =>
      prev.map((d) => (d.id === activeDeck.id ? { ...d, guesses: {} } : d)),
    );
    showFeedback('success', `Đã xóa toàn bộ câu đoán nghĩa của bộ "${activeDeck.name}".`);
  }, [activeDeck.id, activeDeck.name, showFeedback]);

  const handleExportComparisonExcel = useCallback(() => {
    exportGuessComparisonExcel(activeDeck.name, deck, guesses);
    showFeedback(
      'success',
      `Đã xuất file Excel đối chiếu lỗi cho bộ "${activeDeck.name}" (${answeredCount}/${deck.length} từ đã điền).`,
    );
  }, [activeDeck.name, answeredCount, deck, guesses, showFeedback]);

  const handleExportComparisonCsv = useCallback(() => {
    exportGuessComparisonCsv(activeDeck.name, deck, guesses);
    showFeedback(
      'success',
      `Đã xuất file CSV đối chiếu lỗi cho bộ "${activeDeck.name}".`,
    );
  }, [activeDeck.name, deck, guesses, showFeedback]);

  const handleChangeFilter = useCallback(
    (nextMode: FilterMode) => {
      handleStopSpeech();
      setFilterMode(nextMode);
      setCurrentIndex(0);
      setIsFlipped(false);
    },
    [handleStopSpeech],
  );

  const handleToggleShuffle = useCallback(() => {
    handleStopSpeech();
    setIsFlipped(false);
    setCurrentIndex(0);
    setIsShuffled((prev) => {
      const nextShuffled = !prev;
      if (nextShuffled) {
        setShuffledOrderIds(shuffleArray(deck.map((item) => String(item.id))));
      } else {
        setShuffledOrderIds([]);
      }
      return nextShuffled;
    });
  }, [deck, handleStopSpeech]);

  const handleSelectDeck = useCallback(
    (deckId: string) => {
      if (deckId === activeDeck.id) return;
      handleStopSpeech();
      setActiveDeckId(deckId);
      setFilterMode('all');
      setIsShuffled(false);
      setShuffledOrderIds([]);
      setCurrentIndex(0);
      setIsFlipped(false);
    },
    [activeDeck.id, handleStopSpeech],
  );

  const handleRenameDeck = useCallback(
    (deckId: string, newName: string) => {
      setDecks((prev) =>
        prev.map((d) => (d.id === deckId ? { ...d, name: newName } : d)),
      );
      showFeedback('success', `Đã đổi tên bộ thẻ thành "${newName}".`);
    },
    [showFeedback],
  );

  const handleDeleteDeck = useCallback(
    (deckId: string) => {
      if (decks.length <= 1) return;
      const target = decks.find((d) => d.id === deckId);
      const remaining = decks.filter((d) => d.id !== deckId);
      handleStopSpeech();
      setDecks(remaining);
      if (activeDeck.id === deckId) {
        setActiveDeckId(remaining[0].id);
        setFilterMode('all');
        setIsShuffled(false);
        setShuffledOrderIds([]);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
      if (target) {
        showFeedback('success', `Đã xóa bộ thẻ "${target.name}".`);
      }
    },
    [activeDeck.id, decks, handleStopSpeech, showFeedback],
  );

  const handleSelectWordFromList = useCallback(
    (card: FlashcardItem) => {
      handleStopSpeech();
      const targetId = String(card.id);
      const idxInFiltered = filteredCards.findIndex((c) => String(c.id) === targetId);

      if (idxInFiltered >= 0) {
        setCurrentIndex(idxInFiltered);
        checkAndTriggerDay1ForCard(card, idxInFiltered, filteredCards.length);
      } else {
        setFilterMode('all');
        const idxInOrdered = orderedDeck.findIndex((c) => String(c.id) === targetId);
        const targetIdx = idxInOrdered >= 0 ? idxInOrdered : 0;
        setCurrentIndex(targetIdx);
        checkAndTriggerDay1ForCard(card, targetIdx, orderedDeck.length);
      }
      setIsFlipped(false);
      document.getElementById('flashcard-stage')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    },
    [checkAndTriggerDay1ForCard, filteredCards, handleStopSpeech, orderedDeck],
  );

  const handleScrollToVocabList = () => {
    document.getElementById('vocabulary-list')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleConfirmResetProgress = () => {
    handleStopSpeech();
    setDecks((prev) =>
      prev.map((d) => (d.id === activeDeck.id ? { ...d, masteredIds: [] } : d)),
    );
    setFilterMode('all');
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsResetModalOpen(false);
    showFeedback('success', `Đã đặt lại tiến độ của bộ "${activeDeck.name}" về 0%.`);
  };

  // Keyboard shortcuts: Space (Flip), ← / → (Prev/Next), S (Speak), M (Mark mastered)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isResetModalOpen || isComparisonOpen) {
        if (e.key === 'Escape') {
          setIsResetModalOpen(false);
          setIsComparisonOpen(false);
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isTyping) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSpeakCard(currentCard, 'both');
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMastered();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentCard,
    handleFlip,
    handleNext,
    handlePrev,
    handleSpeakCard,
    handleToggleMastered,
    isComparisonOpen,
    isResetModalOpen,
  ]);

  // Every uploaded Excel file creates a brand-new deck
  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      handleStopSpeech();
      const result = await parseExcelFile(file);
      const baseName = stripFileExtension(result.fileName);

      // Avoid exact duplicate names nicely
      const existingNames = new Set(decks.map((d) => d.name));
      let uniqueName = baseName;
      let suffix = 2;
      while (existingNames.has(uniqueName)) {
        uniqueName = `${baseName} (${suffix})`;
        suffix += 1;
      }

      const newDeck: FlashcardDeck = {
        id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: uniqueName,
        fileName: result.fileName,
        createdAt: Date.now(),
        cards: result.cards,
        masteredIds: [],
      };

      setDecks((prev) => [...prev, newDeck]);
      setActiveDeckId(newDeck.id);
      setFilterMode('all');
      setIsShuffled(false);
      setShuffledOrderIds([]);
      setCurrentIndex(0);
      setIsFlipped(false);

      showFeedback(
        'success',
        `Đã tạo bộ thẻ mới "${uniqueName}" gồm ${result.cards.length} từ vựng từ file "${result.fileName}".`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể đọc file Excel.';
      showFeedback('error', msg);
    }
  };

  const handleExportHtml = () => {
    downloadStandaloneHtml(deck, `TOEIC 1012 — ${activeDeck.name}`);
    showFeedback(
      'success',
      `Đã xuất file HTML độc lập cho bộ "${activeDeck.name}" (${deck.length} từ).`,
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Hidden Excel File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-7 sm:py-10">
        {/* A. HEADER SECTION WITH TOEIC 1012 LOGO */}
        <header className="pb-8 border-b border-[#E9DDF8] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-4 mb-3.5">
              {!logoError ? (
                <img
                  src={LOGO_SRC}
                  alt="Logo TOEIC 1012"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-14 sm:h-16 w-auto object-contain select-none"
                />
              ) : (
                <span className="text-xl font-extrabold tracking-tight text-[#5B2CA0]">
                  TOEIC <span className="text-[#D91E2A]">1012</span>
                </span>
              )}

              <span className="inline-block px-3.5 py-1 rounded-full bg-[#E9DDF8] text-[#1A1A1A] text-xs font-bold tracking-wide">
                TOEIC 985/990 LR
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A] leading-tight [text-wrap:balance]">
              Bộ thẻ ghi nhớ Từ Vựng <span className="text-[#D91E2A]">TOEIC</span> kèm phát âm
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#4A3B69] leading-relaxed">
              Ôn tập từ vựng trọng tâm TOEIC Reading cùng ví dụ ngữ cảnh, collocations thông dụng và phát âm trực tiếp trên trình duyệt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleScrollToVocabList}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-[#5B2CA0] text-[#FFFFFF] text-sm font-semibold hover:bg-[#4A2285] shadow-[0_6px_18px_rgba(91,44,160,0.22)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
            >
              <List className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Danh sách từ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full border border-[#4A3B69]/30 bg-[#FFFFFF] text-[#4A3B69] text-sm font-semibold hover:bg-[#D91E2A] hover:border-[#D91E2A] hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D91E2A]"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Đặt lại tiến độ</span>
            </button>
          </div>
        </header>

        {/* Inline Feedback Toast Banner */}
        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`mt-6 px-5 py-3.5 rounded-[20px] border flex items-center justify-between gap-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-[#F9F8FC] border-[#E9DDF8] text-[#1A1A1A]'
                : 'bg-[#FFF5F5] border-[#F8C8CC] text-[#9E141D]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#5B2CA0] shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#D91E2A] shrink-0" aria-hidden="true" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Đóng thông báo"
              className="p-1.5 rounded-full hover:bg-[#E9DDF8]/60 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {/* SPACED REPETITION DUE-TODAY REMINDER BANNER */}
        {dueDecks.length > 0 ? (
          <div
            role="region"
            aria-label="Nhắc lịch ôn tập hôm nay"
            className="mt-6 px-5 py-4 rounded-[22px] bg-[#FFF5F5] border border-[#F8C8CC] flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-[#D91E2A] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#9E141D]">
                  Đến lịch ôn tập lặp lại ngắt quãng ({dueDecks.length} bộ thẻ)
                </p>
                <p className="text-xs text-[#4A3B69] mt-0.5">
                  {dueDecks
                    .map(
                      ({ deck: d, summary }) =>
                        `${d.name} (${summary.nextStage?.title ?? 'Ôn tập'})`,
                    )
                    .join(' · ')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {dueDecks.map(({ deck: d }) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    handleSelectDeck(d.id);
                    document.getElementById('flashcard-stage')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                  className="inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 rounded-full bg-[#D91E2A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#B81822] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Ôn {d.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* MULTI-DECK MANAGER BAR (Each Excel file = 1 Deck) */}
        <DeckManagerBar
          decks={decks}
          activeDeckId={activeDeck.id}
          onSelectDeck={handleSelectDeck}
          onUploadExcelDeck={() => fileInputRef.current?.click()}
          onRenameDeck={handleRenameDeck}
          onDeleteDeck={handleDeleteDeck}
        />

        {/* B. PROGRESS STATS BAR (3 Horizontal Cards) */}
        <section
          aria-label="Thống kê tiến độ học tập"
          className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* Card 1: Memory Progress */}
          <div className="bg-[#FFFFFF] border border-[#E9DDF8] rounded-[22px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex flex-col justify-between gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-[#4A3B69]">Tiến độ ghi nhớ</span>
              <span className="font-mono tabular-nums text-sm font-extrabold text-[#1A1A1A]">
                <span className="text-[#D91E2A]">{masteredCount}</span> / {totalCount} từ (
                {progressPercent}%)
              </span>
            </div>
            <div
              className="w-full h-2.5 bg-[#E9DDF8] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Tiến độ ghi nhớ ${progressPercent}%`}
            >
              <div
                className="h-full w-full bg-[#5B2CA0] origin-left transition-transform duration-300 ease-out rounded-full"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>
          </div>

          {/* Card 2: Mastered */}
          <div className="bg-[#F9F8FC] border border-[#E9DDF8] rounded-[22px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#4A3B69]">Đã nhớ</p>
              <p className="text-xs text-[#4A3B69]/80 mt-0.5">Từ vựng đã hoàn thành</p>
            </div>
            <span className="font-mono tabular-nums text-3xl font-extrabold text-[#5B2CA0]">
              {masteredCount}
            </span>
          </div>

          {/* Card 3: Need Review / Unmastered */}
          <div className="bg-[#F9F8FC] border border-[#E9DDF8] rounded-[22px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#4A3B69]">Cần ôn lại / Chưa nhớ</p>
              <p className="text-xs text-[#4A3B69]/80 mt-0.5">Từ vựng còn lại</p>
            </div>
            <span className="font-mono tabular-nums text-3xl font-extrabold text-[#D91E2A]">
              {unmasteredCount}
            </span>
          </div>
        </section>

        {/* C. MAIN STUDY AREA (2 Columns: Left ~65%, Right ~35%) */}
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] gap-8 items-start">
          {/* Left Column (~65%): Flashcard */}
          <FlashcardStage
            card={currentCard}
            currentIndex={safeIndex}
            filteredCount={filteredCards.length}
            totalCount={totalCount}
            masteredCount={masteredCount}
            unmasteredCount={unmasteredCount}
            filterMode={filterMode}
            isFlipped={isFlipped}
            isShuffled={isShuffled}
            isCurrentMastered={isCurrentMastered}
            isSpeaking={isSpeaking}
            activeSpeechMode={activeSpeechMode}
            speechSupported={speechSupported}
            currentGuess={currentCard ? guesses[String(currentCard.id)] ?? '' : ''}
            answeredCount={answeredCount}
            onChangeFilter={handleChangeFilter}
            onToggleShuffle={handleToggleShuffle}
            onFlip={handleFlip}
            onPrev={handlePrev}
            onNext={handleNext}
            onToggleMastered={handleToggleMastered}
            onSpeak={(mode) => handleSpeakCard(currentCard, mode)}
            onSpeakCustom={(text) => handleSpeakCard(currentCard, 'custom', text)}
            onChangeGuess={handleChangeGuess}
            onOpenComparison={() => setIsComparisonOpen(true)}
            onExportComparison={handleExportComparisonExcel}
          />

          {/* Right Column (~35%): TTS Settings, Shortcuts & Spaced Repetition Reminder */}
          <div className="flex flex-col gap-6">
            <ControlSidebar
              accent={accent}
              speechRate={speechRate}
              isSpeaking={isSpeaking}
              speechSupported={speechSupported}
              canSpeak={Boolean(currentCard)}
              onChangeAccent={setAccent}
              onChangeRate={setSpeechRate}
              onTestSpeak={() => handleSpeakCard(currentCard, 'both')}
            />

            <SpacedRepetitionCard
              deckName={activeDeck.name}
              totalCards={totalCount}
              currentCardPosition={filteredCards.length > 0 ? safeIndex + 1 : 0}
              summary={activeDeckSrs}
              onStartDay1Now={() => markDeckDay1Completed(activeDeck.id, activeDeck.name)}
              onToggleStageComplete={handleToggleSrsStage}
              onExportCalendarIcs={handleExportSrsCalendar}
              onResetSchedule={handleResetSrsSchedule}
            />
          </div>
        </main>

        {/* D. BOTTOM SECTION: FULL VOCABULARY LIST */}
        <VocabularySection
          cards={deck}
          activeCardId={currentCard ? currentCard.id : null}
          masteredIds={masteredIds}
          speechSupported={speechSupported}
          onSelectWord={handleSelectWordFromList}
          onSpeakWord={(card) => handleSpeakCard(card, 'both')}
          onTriggerExcelImport={() => fileInputRef.current?.click()}
          onDownloadSampleExcel={() => {
            downloadSampleExcel();
            showFeedback('success', 'Đã tải file Excel mẫu (TOEIC_Reading_Flashcards_Mau.xlsx).');
          }}
          onExportSingleHtml={handleExportHtml}
        />
      </div>

      {/* Confirmation Dialog for Resetting Active Deck Progress */}
      <ConfirmResetModal
        isOpen={isResetModalOpen}
        deckName={activeDeck.name}
        masteredCount={masteredCount}
        onCancel={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmResetProgress}
      />

      {/* Error Comparison Review Modal */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        deckName={activeDeck.name}
        cards={deck}
        guesses={guesses}
        onClose={() => setIsComparisonOpen(false)}
        onJumpToCard={handleSelectWordFromList}
        onExportExcel={handleExportComparisonExcel}
        onExportCsv={handleExportComparisonCsv}
        onClearGuesses={handleClearGuesses}
      />
    </div>
  );
}
