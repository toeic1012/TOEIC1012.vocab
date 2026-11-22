import { AlertTriangle } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  deckName: string;
  masteredCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmResetModal({
  isOpen,
  deckName,
  masteredCount,
  onCancel,
  onConfirm,
}: ConfirmResetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A154A]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E9DDF8] rounded-[24px] overflow-hidden shadow-[0_16px_48px_rgba(42,21,74,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#E9DDF8] border-b-[3px] border-[#2A154A] px-6 py-4 flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-[#D91E2A] shrink-0" aria-hidden="true" />
          <h2 id="reset-dialog-title" className="text-base font-extrabold text-[#1A1A1A]">
            Xác nhận đặt lại tiến độ
          </h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-[#4A3B69] leading-relaxed">
            Bạn có chắc muốn xóa toàn bộ trạng thái đã ghi nhớ của{' '}
            <strong className="text-[#D91E2A] font-mono tabular-nums">{masteredCount}</strong> từ
            vựng trong bộ <strong className="text-[#1A1A1A]">&ldquo;{deckName}&rdquo;</strong>?
            Hành động này không thể hoàn tác.
          </p>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[42px] px-5 py-2 rounded-full border border-[#E9DDF8] bg-[#FFFFFF] text-sm font-semibold text-[#1A1A1A] hover:bg-[#F9F8FC] transition-colors cursor-pointer whitespace-nowrap"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="min-h-[42px] px-5 py-2 rounded-full bg-[#D91E2A] text-sm font-semibold text-[#FFFFFF] hover:bg-[#B81822] transition-colors cursor-pointer whitespace-nowrap"
            >
              Đặt lại tiến độ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
