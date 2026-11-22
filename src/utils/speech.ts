import type { SpeechAccent, SpeechMode, SpeechRate } from '../types/flashcard';

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

function selectVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const targetLang = lang.toLowerCase();
  const preferredByLang: Record<string, string[]> = {
    'en-us': [
      'Google US English',
      'Samantha',
      'Alex',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Zira - English (United States)',
    ],
    'en-gb': [
      'Google UK English Female',
      'Google UK English Male',
      'Daniel',
      'Serena',
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
    ],
    'vi-vn': [
      'Google tiếng Việt',
      'Linh',
      'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)',
      'Microsoft An - Vietnamese (Vietnam)',
    ],
  };

  for (const name of preferredByLang[targetLang] ?? []) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }

  const langPrefix = targetLang.split('-')[0];
  return (
    voices.find((v) => v.lang.toLowerCase().replace('_', '-') === targetLang) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
    null
  );
}

export function cleanPhraseForSpeech(phrase: string): string {
  return phrase
    .replace(/\[([^\]]+)\]/g, ', $1')
    .replace(/\(([^)]+)\)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakUtterances(
  parts: { text: string; lang: string }[],
  options: {
    rate?: SpeechRate;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  } = {},
): void {
  if (!isSpeechSupported()) {
    options.onError?.();
    return;
  }

  const validParts = parts
    .map((p) => ({ text: p.text.trim(), lang: p.lang }))
    .filter((p) => p.text.length > 0);

  if (!validParts.length) {
    options.onEnd?.();
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const rate = options.rate ?? 1;
  const voices = synth.getVoices();

  const utterances = validParts.map(({ text, lang }) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = rate;
    const voice = selectVoiceForLang(voices, lang);
    if (voice) utt.voice = voice;
    return utt;
  });

  const first = utterances[0];
  const last = utterances[utterances.length - 1];

  first.onstart = () => {
    options.onStart?.();
  };

  last.onend = () => {
    options.onEnd?.();
  };

  for (const utt of utterances) {
    utt.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        options.onEnd?.();
        return;
      }
      options.onError?.();
    };
    synth.speak(utt);
  }
}

export function speakFlashcardAudio(
  card: {
    word: string;
    example: string;
    meaning: string;
    collocation: string;
  },
  options: {
    mode?: SpeechMode;
    customText?: string;
    accent?: SpeechAccent;
    rate?: SpeechRate;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  } = {},
): void {
  const mode = options.mode ?? 'both';
  const accent = options.accent ?? 'en-US';
  const parts: { text: string; lang: string }[] = [];

  if (mode === 'custom' && options.customText) {
    parts.push({ text: cleanPhraseForSpeech(options.customText), lang: accent });
  } else if (mode === 'collocations') {
    const phrases = card.collocation
      .split(/,|;/)
      .map((item) => cleanPhraseForSpeech(item))
      .filter(Boolean);
    if (phrases.length > 0) {
      phrases.forEach((phrase) => parts.push({ text: phrase, lang: accent }));
    } else if (card.meaning.trim()) {
      parts.push({ text: card.meaning.trim(), lang: 'vi-VN' });
    }
  } else if (mode === 'meaning') {
    if (card.meaning.trim()) {
      parts.push({ text: card.meaning.trim(), lang: 'vi-VN' });
    }
  } else {
    if ((mode === 'both' || mode === 'word') && card.word.trim()) {
      parts.push({ text: card.word.trim(), lang: accent });
    }
    if ((mode === 'both' || mode === 'example') && card.example.trim()) {
      parts.push({ text: card.example.trim(), lang: accent });
    }
  }

  speakUtterances(parts, {
    rate: options.rate,
    onStart: options.onStart,
    onEnd: options.onEnd,
    onError: options.onError,
  });
}
