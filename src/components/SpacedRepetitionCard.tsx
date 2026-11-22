import { Bell, CalendarPlus, Check, Flag, RotateCcw } from 'lucide-react';
import type { DeckSrsSummary } from '../utils/spacedRepetition';

interface SpacedRepetitionCardProps {
  deckName: string;
  totalCards: number;
  currentCardPosition: number;
  summary: DeckSrsSummary;
  onStartDay1Now: () => void;
  onToggleStageComplete: (stageIndex: number) => void;
  onExportCalendarIcs: () => void;
  onResetSchedule: () => void;
}

export function SpacedRepetitionCard({
  deckName,
  totalCards,
  currentCardPosition,
  summary,
  onStartDay1Now,
  onToggleStageComplete,
  onExportCalendarIcs,
  onResetSchedule,
}: SpacedRepetitionCardProps) {
  const renderStatusBadge = () => {
    if (summary.status === 'not_started') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#2A154A]/20 text-[11px] font-bold text-[#4A3B69] whitespace-nowrap">
          Chờ vòng 1
        </span>
      );
    }
    if (summary.status === 'overdue' && summary.nextStage) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#D91E2A] text-[11px] font-bold text-[#FFFFFF] whitespace-nowrap">
          Quá hạn {Math.abs(summary.nextStage.daysDiff)} ngày
        </span>
      );
    }
    if (summary.status === 'due_today') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#D91E2A] text-[11px] font-bold text-[#FFFFFF] whitespace-nowrap">
          Ôn hôm nay
        </span>
      );
    }
    if (summary.status === 'upcoming' && summary.nextStage) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#5B2CA0] text-[11px] font-bold text-[#FFFFFF] whitespace-nowrap">
          Còn {summary.nextStage.daysDiff} ngày
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-[#5B2CA0] text-[11px] font-bold text-[#FFFFFF] whitespace-nowrap">
        Hoàn tất 30 ngày
      </span>
    );
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Pastel Card Header with 3D #2A154A depth rim */}
      <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 py-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-[#5B2CA0] shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-bold text-[#1A1A1A] truncate">
            Nhắc học lặp lại ngắt quãng
          </h3>
        </div>
        {renderStatusBadge()}
      </div>

      <div className="p-5 flex flex-col gap-4">
        {summary.status === 'not_started' ? (
          <>
            <div className="bg-[#F9F8FC] border border-[#E9DDF8] rounded-[18px] p-4">
              <p className="text-xs font-bold text-[#1A1A1A]">
                Ngày 1 tính từ lúc học đến từ cuối cùng
              </p>
              <p className="text-xs text-[#4A3B69] mt-1.5 leading-relaxed">
                Khi bạn học đến thẻ cuối cùng{' '}
                <strong className="font-mono tabular-nums text-[#D91E2A]">
                  ({totalCards}/{totalCards})
                </strong>{' '}
                của bộ <strong className="text-[#1A1A1A]">{deckName}</strong>, hệ thống sẽ tự động
                tính <strong>Ngày 1</strong> và lập lịch nhắc ôn theo chu kỳ 1 – 2 – 4 – 7 – 15 – 30 ngày.
              </p>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono tabular-nums text-[#4A3B69]">
                <span>Vị trí hiện tại</span>
                <span className="font-bold text-[#5B2CA0]">
                  Thẻ {currentCardPosition} / {totalCards}
                </span>
              </div>
              <div className="mt-1.5 w-full h-1.5 bg-[#E9DDF8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5B2CA0] rounded-full origin-left transition-transform duration-200"
                  style={{
                    transform: `scaleX(${totalCards > 0 ? currentCardPosition / totalCards : 0})`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onStartDay1Now}
              className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full border border-[#5B2CA0] bg-[#FFFFFF] text-xs font-semibold text-[#5B2CA0] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Đánh dấu xong vòng 1 (Tính Ngày 1)</span>
            </button>
          </>
        ) : (
          <>
            {/* Day 1 Anchor Info */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#4A3B69]">
                Ngày 1:{' '}
                <strong className="font-mono tabular-nums text-[#1A1A1A]">
                  {summary.firstCompletedLabel}
                </strong>
              </span>
              <span className="font-mono tabular-nums font-bold text-[#5B2CA0]">
                {summary.completedCount}/{summary.totalStages} chặng
              </span>
            </div>

            {/* Active Due Callout */}
            {summary.nextStage && (summary.status === 'due_today' || summary.status === 'overdue') ? (
              <div className="bg-[#FFF5F5] border border-[#F8C8CC] rounded-[18px] p-3.5 flex flex-col gap-2.5">
                <p className="text-xs font-bold text-[#9E141D]">
                  {summary.status === 'overdue'
                    ? `Đã quá hạn ${Math.abs(summary.nextStage.daysDiff)} ngày cho lượt ôn ${summary.nextStage.title}!`
                    : `Hôm nay đến lịch ôn ${summary.nextStage.title} (${summary.nextStage.note})!`}
                </p>
                <button
                  type="button"
                  onClick={() => onToggleStageComplete(summary.nextStage!.index)}
                  className="w-full inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#D91E2A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#B81822] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Xác nhận đã ôn xong {summary.nextStage.title}</span>
                </button>
              </div>
            ) : null}

            {/* 6-Stage Spaced Repetition Timeline */}
            <ol className="relative pl-1 space-y-2.5">
              {summary.milestones.map((m) => {
                const isNext = summary.nextStage?.index === m.index;
                const dotClass = m.isCompleted
                  ? 'bg-[#5B2CA0] text-[#FFFFFF] border-[#5B2CA0]'
                  : m.isDueToday || m.isOverdue
                    ? 'bg-[#D91E2A] text-[#FFFFFF] border-[#D91E2A]'
                    : isNext
                      ? 'bg-[#D084E4] text-[#FFFFFF] border-[#D084E4]'
                      : 'bg-[#E9DDF8] text-[#1A1A1A] border-[#E9DDF8]';

                return (
                  <li key={m.index} className="flex items-center justify-between gap-2.5 text-xs">
                    <button
                      type="button"
                      disabled={m.index === 0}
                      onClick={() => onToggleStageComplete(m.index)}
                      title={
                        m.index === 0
                          ? 'Ngày 1 đã hoàn thành'
                          : m.isCompleted
                            ? `Bỏ đánh dấu ${m.title}`
                            : `Đánh dấu đã ôn ${m.title}`
                      }
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left group cursor-pointer disabled:cursor-default"
                    >
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-mono tabular-nums text-[11px] font-bold transition-colors ${dotClass}`}
                      >
                        {m.isCompleted ? (
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          m.index + 1
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-bold ${
                            m.isCompleted
                              ? 'text-[#4A3B69] line-through opacity-80'
                              : m.isDueToday || m.isOverdue
                                ? 'text-[#D91E2A]'
                                : 'text-[#1A1A1A]'
                          }`}
                        >
                          {m.title}
                        </span>
                        <span className="text-[#4A3B69] ml-1.5 truncate">· {m.note}</span>
                      </div>
                    </button>

                    <span
                      className={`font-mono tabular-nums text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                        m.isDueToday || m.isOverdue
                          ? 'bg-[#FFF5F5] text-[#D91E2A]'
                          : 'bg-[#F9F8FC] text-[#4A3B69]'
                      }`}
                    >
                      {m.dueLabel}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* Footer Actions: Export .ics Calendar + Reset Schedule */}
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={onExportCalendarIcs}
                className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full bg-[#5B2CA0] text-[#FFFFFF] text-xs font-semibold hover:bg-[#4A2285] transition-colors cursor-pointer whitespace-nowrap"
              >
                <CalendarPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Thêm vào Lịch nhắc (.ics)</span>
              </button>

              <button
                type="button"
                onClick={onResetSchedule}
                className="inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#4A3B69] hover:text-[#D91E2A] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Đặt lại lịch nhắc bộ này</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
