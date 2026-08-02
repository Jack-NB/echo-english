// Shared speech helper: native Web Speech first, remote audio fallback for mobile.
let audioEl = null;
let enVoice = null;
let voicesLoaded = false;

const REMOTE_TTS_SOURCES = [
  text => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`,
  text => `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`,
];

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesLoaded = true;
  enVoice = voices.find(v => v.lang?.toLowerCase().startsWith('en') && v.localService)
    || voices.find(v => v.lang?.toLowerCase().startsWith('en'))
    || null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

function playRemote(text) {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  const trySource = index => {
    if (index >= REMOTE_TTS_SOURCES.length) return;
    audioEl.onerror = () => trySource(index + 1);
    audioEl.onended = () => {};
    audioEl.src = REMOTE_TTS_SOURCES[index](text);
    audioEl.play().catch(() => trySource(index + 1));
  };
  trySource(0);
}

export function speakText(text, options = {}) {
  const rate = options.rate ?? 0.9;
  if (isMobile() || !('speechSynthesis' in window) || !voicesLoaded || !enVoice) {
    playRemote(text);
    return;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = rate;
  if (enVoice) utterance.voice = enVoice;
  window.speechSynthesis.speak(utterance);
}
