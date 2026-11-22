import type { FlashcardItem } from '../types/flashcard';

function escapeJsonForScript(data: unknown): string {
  return JSON.stringify(data, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildStandaloneSingleHtml(
  cards: FlashcardItem[],
  deckTitle = 'Bộ thẻ ghi nhớ Từ Vựng TOEIC kèm phát âm',
): string {
  const safeDeckJson = escapeJsonForScript(cards);
  const safeTitle = deckTitle.replace(/[<>&"]/g, '');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root {
      --bg: #FFFFFF;
      --sub-bg: #F9F8FC;
      --primary: #5B2CA0;
      --primary-hover: #4A2285;
      --secondary: #D084E4;
      --soft-surface: #E9DDF8;
      --accent: #D91E2A;
      --text: #1A1A1A;
      --subtext: #4A3B69;
      --depth: #2A154A;
      --radius-card: 24px;
      --radius-inner: 20px;
      --shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 36px 24px 64px;
    }

    /* A. Header */
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      padding-bottom: 28px;
      border-bottom: 1px solid var(--soft-surface);
    }

    .lesson-tag {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 9999px;
      background: var(--soft-surface);
      color: var(--text);
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    h1 {
      font-size: clamp(24px, 3.2vw, 34px);
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.25;
      color: var(--text);
    }

    .red-accent { color: var(--accent); }

    .subtitle {
      margin-top: 8px;
      font-size: 15px;
      color: var(--subtext);
      max-width: 60ch;
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    /* Pill Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
      padding: 10px 20px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid var(--soft-surface);
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    }

    .btn:hover:not(:disabled) { background: var(--sub-bg); border-color: var(--secondary); }
    .btn:disabled { opacity: 0.42; cursor: not-allowed; }

    .btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #FFFFFF;
      box-shadow: 0 6px 18px rgba(91, 44, 160, 0.22);
    }

    .btn-primary:hover:not(:disabled) { background: var(--primary-hover); border-color: var(--primary-hover); }

    .btn-reset {
      border-color: rgba(74, 59, 105, 0.35);
      color: var(--subtext);
      background: #FFFFFF;
    }

    .btn-reset:hover:not(:disabled) {
      background: var(--accent);
      border-color: var(--accent);
      color: #FFFFFF;
    }

    /* B. Stats Bar */
    .stats-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .stat-card {
      background: var(--bg);
      border: 1px solid var(--soft-surface);
      border-radius: 22px;
      padding: 20px;
      box-shadow: var(--shadow);
    }

    .stat-card.sub { background: var(--sub-bg); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .stat-label { font-size: 12px; font-weight: 700; color: var(--subtext); }
    .stat-desc { font-size: 12px; color: var(--subtext); opacity: 0.85; margin-top: 2px; }
    .stat-value { font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .stat-progress-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 12px; }
    .stat-progress-text { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }

    .progress-track {
      width: 100%;
      height: 10px;
      background: var(--soft-surface);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 9999px;
      transform-origin: left center;
      transition: transform 0.25s ease;
    }

    /* C. Main Study Grid (65% / 35%) */
    .study-grid {
      margin-top: 30px;
      display: grid;
      grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
      gap: 28px;
      align-items: start;
    }

    .stage-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .tabs {
      display: inline-flex;
      gap: 4px;
      padding: 4px;
      background: var(--sub-bg);
      border: 1px solid var(--soft-surface);
      border-radius: 9999px;
    }

    .tab-btn {
      border: none;
      background: transparent;
      color: var(--subtext);
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .tab-btn.active { background: var(--primary); color: #FFFFFF; }

    .toolbar-right { display: flex; align-items: center; gap: 10px; }
    .counter { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 9999px;
      border: 1px solid var(--soft-surface);
      background: #FFFFFF;
      color: var(--primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .icon-btn.active { background: var(--secondary); border-color: var(--secondary); color: #FFFFFF; }

    /* Empty state */
    .empty-state {
      background: var(--sub-bg);
      border: 1px solid var(--soft-surface);
      border-radius: var(--radius-card);
      min-height: 430px;
      padding: 36px;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 12px;
      box-shadow: var(--shadow);
    }

    .empty-state.show { display: flex; }

    /* 3D Flashcard */
    .scene {
      perspective: 1400px;
      width: 100%;
      height: 455px;
      cursor: pointer;
      user-select: none;
    }

    .card {
      position: relative;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .card.is-flipped { transform: rotateY(180deg); }

    .face {
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      background: var(--bg);
      border: 1px solid var(--soft-surface);
      border-radius: var(--radius-card);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow);
    }

    .face-back { transform: rotateY(180deg); }

    .card-header {
      background: var(--soft-surface);
      border-bottom: 3px solid var(--depth);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      font-weight: 700;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      color: #FFFFFF;
      background: var(--secondary);
      white-space: nowrap;
    }

    .badge.mastered { background: var(--primary); }

    .card-body {
      flex: 1;
      padding: 24px 30px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 18px;
      overflow-y: auto;
    }

    .word-line {
      text-align: center;
      font-size: clamp(26px, 3.6vw, 36px);
      font-weight: 800;
      line-height: 1.25;
    }

    .word-pos { font-size: 0.6em; color: var(--subtext); font-weight: 600; margin-left: 6px; }

    .example-box {
      background: var(--sub-bg);
      border-left: 4px solid var(--primary);
      border-radius: 0 18px 18px 0;
      padding: 14px 18px;
    }

    .field-label { font-size: 12px; font-weight: 700; color: var(--subtext); margin-bottom: 4px; }
    .example-text { font-size: 17px; font-style: italic; color: var(--text); }

    .audio-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .audio-btn {
      min-height: 38px;
      padding: 7px 14px;
      border-radius: 9999px;
      border: 1px solid var(--soft-surface);
      background: #FFFFFF;
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .audio-btn.primary { background: var(--primary); border-color: var(--primary); color: #FFFFFF; }
    .audio-btn.speaking { background: var(--accent); border-color: var(--accent); color: #FFFFFF; }

    .meaning-text { font-size: 24px; font-weight: 800; color: var(--text); }

    .collocation-box {
      background: rgba(233, 221, 248, 0.75);
      border-radius: var(--radius-inner);
      padding: 14px 18px;
    }

    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .chip {
      padding: 5px 12px;
      border-radius: 9999px;
      background: #FFFFFF;
      border: 1px solid rgba(208, 132, 228, 0.55);
      font-size: 13px;
      font-weight: 600;
    }

    .trans-box {
      background: var(--sub-bg);
      border: 1px solid var(--soft-surface);
      border-radius: 18px;
      padding: 12px 16px;
      font-size: 15px;
    }

    .card-footer {
      text-align: center;
      font-size: 12px;
      color: var(--subtext);
      padding: 0 20px 14px;
    }

    /* Single-row control bar under card */
    .controls-row {
      margin-top: 18px;
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .controls-row .btn { padding: 9px 16px; font-size: 13px; flex-shrink: 0; }
    .btn-mark { border-color: var(--primary); color: var(--primary); }
    .btn-mark.is-mastered { background: var(--soft-surface); color: var(--text); }

    /* Right Panel */
    .panel-stack { display: flex; flex-direction: column; gap: 22px; }
    .panel {
      background: var(--bg);
      border: 1px solid var(--soft-surface);
      border-radius: var(--radius-card);
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .panel-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .seg-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .seg-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px; background: var(--sub-bg); border: 1px solid var(--soft-surface); border-radius: 9999px; }

    .seg-btn {
      min-height: 38px;
      border-radius: 9999px;
      border: 1px solid var(--soft-surface);
      background: var(--sub-bg);
      color: var(--text);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .seg-3 .seg-btn { border: none; background: transparent; color: var(--subtext); min-height: 34px; }
    .seg-btn.active { background: var(--primary); border-color: var(--primary); color: #FFFFFF; }

    .shortcut-list { list-style: none; }
    .shortcut-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 0;
      border-bottom: 1px solid var(--sub-bg);
      font-size: 14px;
      color: var(--subtext);
    }

    .shortcut-list li:last-child { border-bottom: none; }
    kbd {
      padding: 4px 12px;
      border-radius: 9999px;
      background: var(--sub-bg);
      border: 1px solid var(--soft-surface);
      color: var(--primary);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      font-weight: 700;
    }

    /* D. Bottom Vocabulary List */
    .vocab-section {
      margin-top: 44px;
      background: var(--bg);
      border: 1px solid var(--soft-surface);
      border-radius: var(--radius-card);
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .vocab-body { padding: 24px 28px; }

    .search-input {
      width: 100%;
      max-width: 520px;
      min-height: 44px;
      padding: 10px 18px;
      border-radius: 9999px;
      border: 1px solid var(--soft-surface);
      background: var(--sub-bg);
      color: var(--text);
      font-size: 14px;
      margin-bottom: 20px;
      outline: none;
    }

    .search-input:focus { background: #FFFFFF; border-color: var(--primary); }

    .vocab-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 14px;
      border-bottom: 1px solid var(--sub-bg);
      border-radius: 16px;
      cursor: pointer;
    }

    .vocab-row:hover { background: var(--sub-bg); }
    .vocab-row.active { background: rgba(233, 221, 248, 0.72); }

    .vocab-left { display: flex; gap: 12px; min-width: 0; flex: 1; }
    .vocab-id { font-weight: 800; color: var(--primary); width: 28px; flex-shrink: 0; }
    .vocab-word { font-weight: 800; font-size: 16px; }
    .vocab-meaning { font-size: 14px; color: var(--text); margin-top: 2px; }
    .vocab-col { font-size: 12px; color: var(--subtext); margin-top: 3px; }
    .vocab-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(42, 21, 74, 0.45);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 50;
    }

    .modal-backdrop.show { display: flex; }
    .modal-box {
      width: 100%;
      max-width: 420px;
      background: #FFFFFF;
      border-radius: var(--radius-card);
      overflow: hidden;
      box-shadow: 0 18px 48px rgba(42, 21, 74, 0.25);
    }
    .modal-body { padding: 22px; }
    .modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }

    @media (max-width: 960px) {
      .stats-grid { grid-template-columns: 1fr; }
      .study-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- A. Header -->
    <header>
      <div>
        <span class="lesson-tag">TOEIC Reading • Ngày 1</span>
        <h1>Bộ thẻ ghi nhớ Từ Vựng <span class="red-accent">TOEIC</span> kèm phát âm</h1>
        <p class="subtitle">Ôn tập từ vựng trọng tâm TOEIC Reading cùng ví dụ ngữ cảnh, collocations thông dụng và phát âm trực tiếp trên trình duyệt.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-primary" id="scrollListBtn">Danh sách từ</button>
        <button type="button" class="btn btn-reset" id="resetBtn">Đặt lại tiến độ</button>
      </div>
    </header>

    <!-- B. Progress Stats Bar -->
    <section class="stats-grid" aria-label="Thống kê tiến độ">
      <div class="stat-card">
        <div class="stat-progress-top">
          <span class="stat-label">Tiến độ ghi nhớ</span>
          <span class="stat-progress-text" id="statProgressText">0 / 0 từ (0%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="statProgressBar" style="transform: scaleX(0)"></div>
        </div>
      </div>

      <div class="stat-card sub">
        <div>
          <div class="stat-label">Đã nhớ</div>
          <div class="stat-desc">Từ vựng đã hoàn thành</div>
        </div>
        <div class="stat-value" style="color: var(--primary)" id="statMastered">0</div>
      </div>

      <div class="stat-card sub">
        <div>
          <div class="stat-label">Cần ôn lại / Chưa nhớ</div>
          <div class="stat-desc">Từ vựng còn lại</div>
        </div>
        <div class="stat-value" style="color: var(--accent)" id="statUnmastered">0</div>
      </div>
    </section>

    <!-- C. Main Study Grid -->
    <main class="study-grid" id="studyStage">
      <div>
        <div class="stage-toolbar">
          <div class="tabs" role="tablist">
            <button type="button" class="tab-btn active" data-filter="all" id="tabAll">Tất cả (0)</button>
            <button type="button" class="tab-btn" data-filter="unmastered" id="tabUnmastered">Chưa nhớ (0)</button>
            <button type="button" class="tab-btn" data-filter="mastered" id="tabMastered">Đã nhớ (0)</button>
          </div>
          <div class="toolbar-right">
            <span class="counter" id="cardCounter">Thẻ 0 / 0</span>
            <button type="button" class="icon-btn" id="shuffleBtn" title="Xáo trộn">⇄</button>
          </div>
        </div>

        <div class="empty-state" id="emptyState">
          <strong>Không có thẻ nào trong nhóm lọc này</strong>
          <p style="font-size: 14px; color: var(--subtext);">Chuyển về mục Tất cả để tiếp tục ôn tập.</p>
          <button type="button" class="btn btn-primary" id="showAllBtn">Xem tất cả thẻ</button>
        </div>

        <div id="cardWrapper">
          <div class="scene" id="cardScene" role="button" tabindex="0">
            <div class="card" id="flashcard">
              <div class="face face-front">
                <div class="card-header">
                  <span>Mặt trước - Từ vựng & Ví dụ</span>
                  <span class="badge" id="frontBadge">Chưa nhớ</span>
                </div>
                <div class="card-body">
                  <div class="word-line" id="frontWord"></div>
                  <div class="example-box" id="exampleBox">
                    <div class="field-label">Câu ví dụ</div>
                    <div class="example-text" id="frontExample"></div>
                  </div>
                  <div class="audio-row">
                    <button type="button" class="audio-btn primary" id="speakBothBtn">🔊 Phát âm từ & ví dụ</button>
                    <button type="button" class="audio-btn" id="speakWordBtn">Chỉ đọc từ</button>
                    <button type="button" class="audio-btn" id="speakExampleBtn">Đọc ví dụ</button>
                  </div>
                </div>
                <div class="card-footer">Bấm vào thẻ hoặc nhấn phím Space để lật xem nghĩa</div>
              </div>

              <div class="face face-back">
                <div class="card-header">
                  <span>Mặt sau - Nghĩa & Collocations</span>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <button type="button" class="audio-btn" id="backSpeakWordBtn" style="min-height:32px;padding:4px 12px;font-size:12px;">🔊 Đọc Collocations</button>
                    <span class="badge" id="backBadge">Chưa nhớ</span>
                  </div>
                </div>
                <div class="card-body">
                  <div>
                    <div class="field-label">Nghĩa tiếng Việt</div>
                    <div class="meaning-text" id="backMeaning"></div>
                  </div>
                  <div class="collocation-box" id="collocationBox">
                    <div class="field-label">Collocations thường gặp</div>
                    <div class="chips" id="backCollocations"></div>
                  </div>
                  <div class="trans-box" id="transBox">
                    <div class="field-label">Dịch nghĩa câu ví dụ</div>
                    <div id="backTranslation"></div>
                  </div>
                </div>
                <div class="card-footer">Bấm vào thẻ hoặc nhấn phím Space để quay lại mặt trước</div>
              </div>
            </div>
          </div>

          <div class="controls-row">
            <button type="button" class="btn" id="prevBtn">← Trước</button>
            <button type="button" class="btn btn-primary" id="flipBtn">Lật thẻ</button>
            <button type="button" class="btn" id="nextBtn">Tiếp →</button>
            <button type="button" class="btn btn-mark" id="markBtn">✓ Đánh dấu đã nhớ</button>
          </div>

          <div class="panel" style="margin-top: 18px;">
            <div class="card-header">
              <span id="guessTitle">Đoán nghĩa từ vựng</span>
              <span style="font-size: 12px; color: var(--subtext);" id="guessCounter">Đã điền 0 / 0</span>
            </div>
            <div class="panel-body" style="gap: 12px;">
              <input
                type="text"
                id="guessInput"
                class="search-input"
                style="max-width: 100%; margin-bottom: 0;"
                placeholder="Ghi nghĩa tiếng Việt bạn đoán tại đây... (Nhấn Enter để lật xem đáp án)"
              />
              <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;">
                <span style="font-size: 12px; color: var(--subtext);">Tự động lưu theo từng thẻ. Xuất file để đối chiếu lỗi sau khi hoàn thành.</span>
                <button type="button" class="btn btn-primary" id="exportCompareBtn" style="min-height: 38px; padding: 7px 16px; font-size: 12px;">Xuất file so sánh lỗi (.csv)</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <aside class="panel-stack">
        <div class="panel">
          <div class="card-header"><span>Âm thanh phát âm (TTS)</span></div>
          <div class="panel-body">
            <div>
              <div class="field-label">Giọng đọc tiếng Anh</div>
              <div class="seg-2">
                <button type="button" class="seg-btn active" data-accent="en-US">Anh - Mỹ (en-US)</button>
                <button type="button" class="seg-btn" data-accent="en-GB">Anh - Anh (en-GB)</button>
              </div>
            </div>
            <div>
              <div class="field-label">Tốc độ đọc</div>
              <div class="seg-3">
                <button type="button" class="seg-btn" data-rate="0.75">0.75x</button>
                <button type="button" class="seg-btn active" data-rate="1">1.0x</button>
                <button type="button" class="seg-btn" data-rate="1.25">1.25x</button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="card-header"><span>Phím tắt học nhanh</span></div>
          <div class="panel-body" style="padding-top: 10px; padding-bottom: 10px;">
            <ul class="shortcut-list">
              <li><span>Lật thẻ</span><kbd>Space</kbd></li>
              <li><span>Thẻ trước / tiếp</span><kbd>← / →</kbd></li>
              <li><span>Phát âm</span><kbd>S</kbd></li>
              <li><span>Đánh dấu đã nhớ</span><kbd>M</kbd></li>
            </ul>
          </div>
        </div>
      </aside>
    </main>

    <!-- D. Bottom Vocabulary List -->
    <section class="vocab-section" id="vocabularyList">
      <div class="card-header">
        <span style="font-size: 16px;">Danh sách tổng hợp từ vựng</span>
        <span class="badge mastered" id="vocabCountBadge">0 từ</span>
      </div>
      <div class="vocab-body">
        <input
          type="search"
          id="searchInput"
          class="search-input"
          placeholder="Tìm kiếm theo từ tiếng Anh, nghĩa tiếng Việt hoặc collocations..."
        />
        <div id="vocabRows"></div>
      </div>
    </section>
  </div>

  <!-- Confirm Reset Modal -->
  <div class="modal-backdrop" id="resetModal" role="dialog" aria-modal="true">
    <div class="modal-box">
      <div class="card-header"><span>Xác nhận đặt lại tiến độ</span></div>
      <div class="modal-body">
        <p style="font-size: 14px; color: var(--subtext);">Bạn có chắc chắn muốn xóa toàn bộ tiến độ các từ đã nhớ không?</p>
        <div class="modal-actions">
          <button type="button" class="btn" id="cancelResetBtn">Hủy</button>
          <button type="button" class="btn" style="background: var(--accent); border-color: var(--accent); color: #FFFFFF;" id="confirmResetBtn">Đặt lại</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // MẢNG DỮ LIỆU TỪ VỰNG — Dễ dàng chỉnh sửa hoặc dán danh sách đầy đủ tại đây
    const VOCABULARY_DATA = ${safeDeckJson};

    (function () {
      const STORAGE_KEY = 'toeic_single_html_mastered_v1';
      const GUESS_KEY = 'toeic_single_html_guesses_v1';
      let mastered = new Set();
      let guesses = {};
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (Array.isArray(saved)) mastered = new Set(saved.map(String));
        const savedGuesses = JSON.parse(localStorage.getItem(GUESS_KEY) || '{}');
        if (savedGuesses && typeof savedGuesses === 'object') guesses = savedGuesses;
      } catch (e) {}

      let filterMode = 'all';
      let isShuffled = false;
      let orderIds = VOCABULARY_DATA.map((c) => String(c.id));
      let currentIndex = 0;
      let isFlipped = false;
      let accent = 'en-US';
      let rate = 1;

      const el = (id) => document.getElementById(id);

      function saveProgress() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(mastered)));
          localStorage.setItem(GUESS_KEY, JSON.stringify(guesses));
        } catch (e) {}
      }

      function getOrderedDeck() {
        const map = new Map(VOCABULARY_DATA.map((c) => [String(c.id), c]));
        return orderIds.map((id) => map.get(id)).filter(Boolean);
      }

      function getFilteredCards() {
        const ordered = getOrderedDeck();
        if (filterMode === 'mastered') return ordered.filter((c) => mastered.has(String(c.id)));
        if (filterMode === 'unmastered') return ordered.filter((c) => !mastered.has(String(c.id)));
        return ordered;
      }

      function cleanSpeechText(str) {
        return String(str || '').replace(/\\[([^\\]]+)\\]/g, ', $1').replace(/\\(([^)]+)\\)/g, ' $1 ').replace(/\\s+/g, ' ').trim();
      }

      function speak(card, mode, event, customText) {
        if (event) event.stopPropagation();
        if (!card || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const findVoice = (langCode) =>
          voices.find((v) => v.lang && v.lang.toLowerCase().replace('_', '-') === langCode.toLowerCase()) ||
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(langCode.split('-')[0].toLowerCase())) || null;

        const parts = [];
        if (mode === 'custom' && customText) {
          parts.push({ text: cleanSpeechText(customText), lang: accent });
        } else if (mode === 'collocations') {
          const cols = (card.collocation || '').split(/,|;/).map(cleanSpeechText).filter(Boolean);
          if (cols.length) {
            cols.forEach((c) => parts.push({ text: c, lang: accent }));
          } else if (card.meaning) {
            parts.push({ text: card.meaning, lang: 'vi-VN' });
          }
        } else if (mode === 'meaning') {
          if (card.meaning) parts.push({ text: card.meaning, lang: 'vi-VN' });
        } else {
          if ((mode === 'both' || mode === 'word') && card.word) parts.push({ text: card.word, lang: accent });
          if ((mode === 'both' || mode === 'example') && card.example) parts.push({ text: card.example, lang: accent });
        }

        parts.forEach((p) => {
          const u = new SpeechSynthesisUtterance(p.text);
          u.lang = p.lang;
          u.rate = rate;
          const v = findVoice(p.lang);
          if (v) u.voice = v;
          window.speechSynthesis.speak(u);
        });
      }

      function render() {
        const total = VOCABULARY_DATA.length;
        const masteredCount = VOCABULARY_DATA.filter((c) => mastered.has(String(c.id))).length;
        const unmasteredCount = total - masteredCount;
        const pct = total ? Math.round((masteredCount / total) * 100) : 0;

        el('statProgressText').innerHTML = '<span class="red-accent">' + masteredCount + '</span> / ' + total + ' từ (' + pct + '%)';
        el('statProgressBar').style.transform = 'scaleX(' + (pct / 100) + ')';
        el('statMastered').textContent = masteredCount;
        el('statUnmastered').textContent = unmasteredCount;

        el('tabAll').textContent = 'Tất cả (' + total + ')';
        el('tabUnmastered').textContent = 'Chưa nhớ (' + unmasteredCount + ')';
        el('tabMastered').textContent = 'Đã nhớ (' + masteredCount + ')';
        document.querySelectorAll('.tab-btn').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.filter === filterMode);
        });

        const filtered = getFilteredCards();
        if (currentIndex >= filtered.length) currentIndex = Math.max(0, filtered.length - 1);
        const card = filtered[currentIndex] || null;

        el('cardCounter').innerHTML = 'Thẻ <span class="red-accent">' + (filtered.length ? currentIndex + 1 : 0) + '</span> / ' + filtered.length;
        el('shuffleBtn').classList.toggle('active', isShuffled);

        if (!card) {
          el('emptyState').classList.add('show');
          el('cardWrapper').style.display = 'none';
        } else {
          el('emptyState').classList.remove('show');
          el('cardWrapper').style.display = 'block';
          const isM = mastered.has(String(card.id));

          el('frontBadge').textContent = isM ? 'Đã nhớ' : 'Chưa nhớ';
          el('frontBadge').classList.toggle('mastered', isM);
          el('backBadge').textContent = isM ? 'Đã nhớ' : 'Chưa nhớ';
          el('backBadge').classList.toggle('mastered', isM);

          el('frontWord').innerHTML = '<span class="red-accent">' + card.id + '.</span> ' + card.word + (card.pos ? ' <span class="word-pos">' + card.pos + '</span>' : '');
          el('frontExample').textContent = card.example ? '"' + card.example + '"' : '';
          el('exampleBox').style.display = card.example ? 'block' : 'none';

          el('backMeaning').textContent = card.meaning || '';
          const cols = (card.collocation || '').split(/,|;/).map((s) => s.trim()).filter(Boolean);
          el('backCollocations').innerHTML = cols.map((c) => '<span class="chip">' + c + '</span>').join('');
          el('collocationBox').style.display = cols.length ? 'block' : 'none';

          el('backTranslation').textContent = card.exampleTranslation || '';
          el('transBox').style.display = card.exampleTranslation ? 'block' : 'none';

          el('flashcard').classList.toggle('is-flipped', isFlipped);
          el('prevBtn').disabled = currentIndex === 0;
          el('nextBtn').disabled = currentIndex >= filtered.length - 1;
          el('markBtn').textContent = isM ? '✓ Đã nhớ' : '✓ Đánh dấu đã nhớ';
          el('markBtn').classList.toggle('is-mastered', isM);

          const answered = VOCABULARY_DATA.filter((c) => (guesses[String(c.id)] || '').trim().length > 0).length;
          el('guessTitle').textContent = 'Đoán nghĩa từ vựng (' + card.word + ')';
          el('guessCounter').innerHTML = 'Đã điền <strong class="red-accent">' + answered + '</strong> / ' + total;
          el('guessInput').value = guesses[String(card.id)] || '';
        }

        renderVocabList(card ? card.id : null);
      }

      function renderVocabList(activeId) {
        const q = (el('searchInput').value || '').trim().toLowerCase();
        const list = VOCABULARY_DATA.filter((c) =>
          !q ||
          c.word.toLowerCase().includes(q) ||
          c.meaning.toLowerCase().includes(q) ||
          (c.collocation || '').toLowerCase().includes(q)
        );
        el('vocabCountBadge').textContent = list.length + ' / ' + VOCABULARY_DATA.length + ' từ';
        const container = el('vocabRows');
        container.innerHTML = '';

        list.forEach((c) => {
          const row = document.createElement('div');
          row.className = 'vocab-row' + (activeId !== null && String(activeId) === String(c.id) ? ' active' : '');
          const isM = mastered.has(String(c.id));
          row.innerHTML =
            '<div class="vocab-left">' +
              '<span class="vocab-id">' + c.id + '.</span>' +
              '<div>' +
                '<div class="vocab-word">' + c.word + ' <span style="font-size:12px;color:var(--subtext);font-weight:600">' + (c.pos || '') + '</span></div>' +
                '<div class="vocab-meaning">' + c.meaning + '</div>' +
                (c.collocation ? '<div class="vocab-col">Collocations: ' + c.collocation + '</div>' : '') +
              '</div>' +
            '</div>' +
            '<div class="vocab-right">' +
              '<span class="badge ' + (isM ? 'mastered' : '') + '">' + (isM ? 'Đã nhớ' : 'Chưa nhớ') + '</span>' +
              '<button type="button" class="icon-btn row-speak" title="Nghe phát âm">🔊</button>' +
            '</div>';

          row.addEventListener('click', () => {
            filterMode = 'all';
            const ordered = getOrderedDeck();
            currentIndex = Math.max(0, ordered.findIndex((x) => String(x.id) === String(c.id)));
            isFlipped = false;
            render();
            el('studyStage').scrollIntoView({ behavior: 'smooth' });
          });
          row.querySelector('.row-speak').addEventListener('click', (e) => speak(c, 'both', e));
          container.appendChild(row);
        });
      }

      document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          filterMode = btn.dataset.filter;
          currentIndex = 0;
          isFlipped = false;
          render();
        });
      });

      el('showAllBtn').addEventListener('click', () => { filterMode = 'all'; currentIndex = 0; render(); });
      el('cardScene').addEventListener('click', () => { isFlipped = !isFlipped; render(); });
      el('flipBtn').addEventListener('click', () => { isFlipped = !isFlipped; render(); });
      el('prevBtn').addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; isFlipped = false; render(); } });
      el('nextBtn').addEventListener('click', () => {
        const len = getFilteredCards().length;
        if (currentIndex < len - 1) { currentIndex++; isFlipped = false; render(); }
      });

      function toggleMastered() {
        const card = getFilteredCards()[currentIndex];
        if (!card) return;
        const k = String(card.id);
        if (mastered.has(k)) mastered.delete(k); else mastered.add(k);
        saveProgress();
        if (filterMode !== 'all') isFlipped = false;
        render();
      }

      el('markBtn').addEventListener('click', toggleMastered);
      el('speakBothBtn').addEventListener('click', (e) => speak(getFilteredCards()[currentIndex], 'both', e));
      el('speakWordBtn').addEventListener('click', (e) => speak(getFilteredCards()[currentIndex], 'word', e));
      el('speakExampleBtn').addEventListener('click', (e) => speak(getFilteredCards()[currentIndex], 'example', e));
      el('backSpeakWordBtn').addEventListener('click', (e) => speak(getFilteredCards()[currentIndex], 'collocations', e));

      el('shuffleBtn').addEventListener('click', () => {
        isShuffled = !isShuffled;
        orderIds = VOCABULARY_DATA.map((c) => String(c.id));
        if (isShuffled) {
          for (let i = orderIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orderIds[i], orderIds[j]] = [orderIds[j], orderIds[i]];
          }
        }
        currentIndex = 0;
        isFlipped = false;
        render();
      });

      document.querySelectorAll('[data-accent]').forEach((btn) => {
        btn.addEventListener('click', () => {
          accent = btn.dataset.accent;
          document.querySelectorAll('[data-accent]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      document.querySelectorAll('[data-rate]').forEach((btn) => {
        btn.addEventListener('click', () => {
          rate = Number(btn.dataset.rate);
          document.querySelectorAll('[data-rate]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      el('scrollListBtn').addEventListener('click', () => el('vocabularyList').scrollIntoView({ behavior: 'smooth' }));
      el('resetBtn').addEventListener('click', () => el('resetModal').classList.add('show'));
      el('cancelResetBtn').addEventListener('click', () => el('resetModal').classList.remove('show'));
      el('confirmResetBtn').addEventListener('click', () => {
        mastered.clear();
        saveProgress();
        filterMode = 'all';
        currentIndex = 0;
        isFlipped = false;
        el('resetModal').classList.remove('show');
        render();
      });

      el('searchInput').addEventListener('input', () => {
        const card = getFilteredCards()[currentIndex];
        renderVocabList(card ? card.id : null);
      });

      el('guessInput').addEventListener('input', (e) => {
        const card = getFilteredCards()[currentIndex];
        if (!card) return;
        guesses[String(card.id)] = e.target.value;
        saveProgress();
        const answered = VOCABULARY_DATA.filter((c) => (guesses[String(c.id)] || '').trim().length > 0).length;
        el('guessCounter').innerHTML = 'Đã điền <strong class="red-accent">' + answered + '</strong> / ' + VOCABULARY_DATA.length;
      });

      el('guessInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!isFlipped) { isFlipped = true; render(); }
        }
      });

      el('exportCompareBtn').addEventListener('click', () => {
        const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\\s]/g, ' ').replace(/\\s+/g, ' ').trim();
        const esc = (v) => { const s = String(v == null ? '' : v); return /["\\n\\r,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
        const rows = [['STT', 'Từ vựng', 'Từ loại', 'Nghĩa học viên đoán', 'Đáp án chuẩn', 'Kết quả đối chiếu', 'Collocations'].map(esc).join(',')];
        VOCABULARY_DATA.forEach((c) => {
          const g = (guesses[String(c.id)] || '').trim();
          const ng = norm(g);
          const segs = String(c.meaning || '').split(/[,;/()]+/).map(norm).filter((x) => x.length >= 2);
          let status = 'Chưa điền';
          if (ng) {
            const matched = ng === norm(c.meaning) || segs.some((seg) => seg === ng || (ng.length >= 3 && seg.includes(ng)) || (seg.length >= 3 && ng.includes(seg)));
            status = matched ? 'Khớp nghĩa' : 'Cần xem lại';
          }
          rows.push([c.id, c.word, c.pos || '', g || '(Chưa điền)', c.meaning || '', status, c.collocation || ''].map(esc).join(','));
        });
        const blob = new Blob(['\\uFEFF' + rows.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'so-sanh-loi-toeic.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (e.code === 'Space') { e.preventDefault(); isFlipped = !isFlipped; render(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); if (currentIndex > 0) { currentIndex--; isFlipped = false; render(); } }
        else if (e.key === 'ArrowRight') { e.preventDefault(); if (currentIndex < getFilteredCards().length - 1) { currentIndex++; isFlipped = false; render(); } }
        else if (e.key.toLowerCase() === 's') { e.preventDefault(); speak(getFilteredCards()[currentIndex], 'both'); }
        else if (e.key.toLowerCase() === 'm') { e.preventDefault(); toggleMastered(); }
      });

      render();
    })();
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtml(
  cards: FlashcardItem[],
  deckTitle = 'Bộ thẻ ghi nhớ Từ Vựng TOEIC kèm phát âm',
): void {
  const html = buildStandaloneSingleHtml(cards, deckTitle);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'toeic-reading-flashcards.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
