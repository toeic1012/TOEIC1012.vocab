import { Keyboard, Volume2 } from 'lucide-react';
import type { SpeechAccent, SpeechRate } from '../types/flashcard';

interface ControlSidebarProps {
  accent: SpeechAccent;
  speechRate: SpeechRate;
  isSpeaking: boolean;
  speechSupported: boolean;
  canSpeak: boolean;
  onChangeAccent: (accent: SpeechAccent) => void;
  onChangeRate: (rate: SpeechRate) => void;
  onTestSpeak: () => void;
}

const ACCENTS: { value: SpeechAccent; label: string; sub: string }[] = [
  { value: 'en-US', label: 'en-US', sub: 'Anh - Mỹ' },
  { value: 'en-GB', label: 'en-GB', sub: 'Anh - Anh' },
];

const RATES: { value: SpeechRate; label: string }[] = [
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1.0x' },
  { value: 1.25, label: '1.25x' },
];

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Space', label: 'Lật thẻ' },
  { keys: '← / →', label: 'Thẻ trước / tiếp' },
  { keys: 'S', label: 'Phát âm từ & ví dụ' },
  { keys: 'M', label: 'Đánh dấu đã nhớ' },
];

export function ControlSidebar({
  accent,
  speechRate,
  isSpeaking,
  speechSupported,
  canSpeak,
  onChangeAccent,
  onChangeRate,
  onTestSpeak,
}: ControlSidebarProps) {
  return (
    <aside aria-label="Bảng điều khiển âm thanh và phím tắt" className="flex flex-col gap-6">
      {/* Block 1: TTS Audio Control */}
      <div className="bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#5B2CA0]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">Âm thanh phát âm (TTS)</h3>
          </div>
          {isSpeaking ? (
            <span className="px-2.5 py-0.5 rounded-full bg-[#D91E2A] text-[#FFFFFF] text-[11px] font-semibold">
              Đang phát
            </span>
          ) : null}
        </div>

        <div className="p-5 flex flex-col gap-5">
          {!speechSupported ? (
            <p className="text-xs text-[#D91E2A] bg-[#FFF5F5] border border-[#F8C8CC] rounded-[16px] px-3.5 py-2.5">
              Trình duyệt hiện tại không hỗ trợ Web Speech API.
            </p>
          ) : null}

          {/* Voice Accent Selection */}
          <div>
            <p className="text-xs font-bold text-[#4A3B69] mb-2">Giọng đọc tiếng Anh</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Chọn giọng đọc tiếng Anh">
              {ACCENTS.map((item) => {
                const isActive = accent === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChangeAccent(item.value)}
                    className={`min-h-[42px] px-3 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0] ${
                      isActive
                        ? 'bg-[#5B2CA0] border-[#5B2CA0] text-[#FFFFFF]'
                        : 'bg-[#F9F8FC] border-[#E9DDF8] text-[#1A1A1A] hover:bg-[#E9DDF8]'
                    }`}
                  >
                    {item.sub} <span className="opacity-85">({item.label})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speech Speed Selection */}
          <div>
            <p className="text-xs font-bold text-[#4A3B69] mb-2">Tốc độ đọc</p>
            <div
              className="grid grid-cols-3 gap-1.5 p-1 bg-[#F9F8FC] border border-[#E9DDF8] rounded-full"
              role="group"
              aria-label="Chọn tốc độ đọc"
            >
              {RATES.map((item) => {
                const isActive = speechRate === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChangeRate(item.value)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-mono tabular-nums font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B2CA0] ${
                      isActive
                        ? 'bg-[#5B2CA0] text-[#FFFFFF]'
                        : 'text-[#4A3B69] hover:text-[#1A1A1A] hover:bg-[#E9DDF8]/70'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onTestSpeak}
            disabled={!speechSupported || !canSpeak}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-full border border-[#5B2CA0] bg-[#FFFFFF] text-xs font-semibold text-[#5B2CA0] hover:bg-[#5B2CA0] hover:text-[#FFFFFF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B2CA0]"
          >
            <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isSpeaking ? 'Dừng phát âm' : 'Nghe thử thẻ hiện tại'}</span>
          </button>
        </div>
      </div>

      {/* Block 2: Quick Keyboard Shortcuts */}
      <div className="bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-5 py-3.5 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-[#5B2CA0]" aria-hidden="true" />
          <h3 className="text-sm font-bold text-[#1A1A1A]">Phím tắt học nhanh</h3>
        </div>

        <div className="p-5">
          <ul className="divide-y divide-[#F9F8FC]">
            {SHORTCUTS.map((item) => (
              <li
                key={item.keys}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-[#4A3B69] font-medium">{item.label}</span>
                <kbd className="px-3 py-1 rounded-full bg-[#F9F8FC] border border-[#E9DDF8] font-mono text-xs font-bold text-[#5B2CA0] whitespace-nowrap shrink-0">
                  {item.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
