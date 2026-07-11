const PROGRESS_KEY = 'echo_english_progress';
const TODAY_LEARNED_KEY = 'echo_english_today_learned';
const TODAY_DATE_KEY = 'echo_english_today_date';

export function getProgress() {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getWordProgress(wordId) {
  const progress = getProgress();
  return progress[wordId] || null;
}

export function updateWordProgress(wordId, updates) {
  const progress = getProgress();
  progress[wordId] = { ...(progress[wordId] || {}), ...updates };
  saveProgress(progress);
  return progress[wordId];
}

export function getTodayLearnedIds() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(TODAY_DATE_KEY);

  if (savedDate !== today) {
    localStorage.setItem(TODAY_DATE_KEY, today);
    localStorage.setItem(TODAY_LEARNED_KEY, JSON.stringify([]));
    return [];
  }

  try {
    const data = localStorage.getItem(TODAY_LEARNED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addTodayLearnedId(wordId) {
  const ids = getTodayLearnedIds();
  if (!ids.includes(wordId)) {
    ids.push(wordId);
    localStorage.setItem(TODAY_LEARNED_KEY, JSON.stringify(ids));
  }
  return ids;
}

export function resetTodayIfNewDay() {
  getTodayLearnedIds(); // Side effect: resets if new day
}
