import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Bell, Check, FolderOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { FlashcardDeck } from '../types/flashcard';
import { getDeckSrsSummary } from '../utils/spacedRepetition';

interface DeckManagerBarProps {
  decks: FlashcardDeck[];
  activeDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onUploadExcelDeck: () => void;
  onRenameDeck: (deckId: string, newName: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

export function DeckManagerBar({
  decks,
  activeDeckId,
  onSelectDeck,
  onUploadExcelDeck,
  onRenameDeck,
  onDeleteDeck,
}: DeckManagerBarProps) {
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const startEditing = (deck: FlashcardDeck, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setEditingDeckId(deck.id);
    setDraftName(deck.name);
  };

  const commitRename = () => {
    if (editingDeckId && draftName.trim()) {
      onRenameDeck(editingDeckId, draftName.trim());
    }
    setEditingDeckId(null);
    setDraftName('');
  };

  const cancelRename = () => {
    setEditingDeckId(null);
    setDraftName('');
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  return (
    <section
      aria-label="Thanh quản lý bộ thẻ học theo từng file Excel"
      className="mt-7 bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    >
      {/* Pastel Header with #2A154A depth rim */}
      <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="w-4 h-4 text-[#5B2CA0] shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-extrabold text-[#1A1A1A]">
            Quản lý bộ thẻ theo file Excel
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-[#5B2CA0] text-[#FFFFFF] text-xs font-mono tabular-nums font-semibold">
            {decks.length} bộ thẻ
          </span>
        </div>

        <button
          type="button"
          onClick={onUploadExcelDeck}
          className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-4 py-1.5 rounded-full bg-[#5B2CA0] text-[#FFFFFF] text-xs sm:text-sm font-semibold hover:bg-[#4A2285] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Tải file Excel (tạo bộ mới)</span>
        </button>
      </div>

      {/* Horizontal Scrollable Deck Pills */}
      <div className="p-4 sm:px-6 sm:py-4 flex items-center gap-2.5 overflow-x-auto">
        {decks.map((deck) => {
          const isActive = deck.id === activeDeckId;
          const isEditing = editingDeckId === deck.id;
          const masteredCount = deck.cards.filter((c) =>
            deck.masteredIds.includes(String(c.id)),
          ).length;

          if (isEditing) {
            return (
              <div
                key={deck.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F9F8FC] border-2 border-[#5B2CA0] shrink-0"
              >
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  autoFocus
                  aria-label="Đổi tên bộ thẻ"
                  className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-[#1A1A1A] bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={commitRename}
                  aria-label="Lưu tên bộ thẻ"
                  className="p-1 rounded-full bg-[#5B2CA0] text-[#FFFFFF] hover:bg-[#4A2285] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  aria-label="Hủy đổi tên"
                  className="p-1 rounded-full text-[#4A3B69] hover:bg-[#E9DDF8] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          }

          const srsSummary = getDeckSrsSummary(deck.srs);
          const isDueNow = srsSummary.status === 'due_today' || srsSummary.status === 'overdue';

          return (
            <div
              key={deck.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDeck(deck.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDeck(deck.id);
                }
              }}
              aria-pressed={isActive}
              className={`group inline-flex items-center gap-2 min-h-[42px] pl-4 pr-2.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                isActive
                  ? 'bg-[#5B2CA0] border-[#5B2CA0] text-[#FFFFFF] shadow-[0_4px_14px_rgba(91,44,160,0.2)]'
                  : 'bg-[#F9F8FC] border-[#E9DDF8] text-[#1A1A1A] hover:bg-[#E9DDF8]/75 hover:border-[#D084E4]'
              }`}
            >
              <span className="max-w-[180px] truncate">{deck.name}</span>

              <span
                className={`px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-bold ${
                  isActive
                    ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                    : 'bg-[#E9DDF8] text-[#4A3B69]'
                }`}
              >
                {masteredCount}/{deck.cards.length}
              </span>

              {isDueNow ? (
                <span
                  title="Bộ thẻ này đã đến lịch ôn tập lặp lại ngắt quãng"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D91E2A] text-[#FFFFFF] text-[10px] font-bold whitespace-nowrap"
                >
                  <Bell className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                  <span>Cần ôn</span>
                </span>
              ) : null}

              <div className="inline-flex items-center gap-0.5 ml-0.5">
                <button
                  type="button"
                  onClick={(e) => startEditing(deck, e)}
                  title="Đổi tên bộ thẻ"
                  aria-label={`Đổi tên bộ thẻ ${deck.name}`}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#FFFFFF]/80 hover:bg-[#FFFFFF]/20 hover:text-[#FFFFFF]'
                      : 'text-[#4A3B69] hover:bg-[#FFFFFF] hover:text-[#5B2CA0]'
                  }`}
                >
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                </button>

                {decks.length > 1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDeck(deck.id);
                    }}
                    title="Xóa bộ thẻ này"
                    aria-label={`Xóa bộ thẻ ${deck.name}`}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#FFFFFF]/80 hover:bg-[#D91E2A] hover:text-[#FFFFFF]'
                        : 'text-[#4A3B69] hover:bg-[#D91E2A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
