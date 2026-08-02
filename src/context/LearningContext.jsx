import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import vocabulary from '../data/vocabulary';
import { getProgress, saveProgress, getTodayLearnedIds, addTodayLearnedId } from '../utils/storage';
import { getInitialProgress, advanceStage, resetStage, markAsMistake } from '../utils/spacedRepetition';

/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
const LearningContext = createContext(null);

export function LearningProvider({ children }) {
  const [progress, setProgress] = useState(() => getProgress());
  const [todayLearnedIds, setTodayLearnedIds] = useState(() => getTodayLearnedIds());
  const [activeTab, setActiveTab] = useState('docs');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const learnWord = useCallback((wordId) => {
    setProgress(prev => {
      const next = { ...prev };
      if (!next[wordId]) {
        next[wordId] = getInitialProgress(wordId);
      }
      const adv = advanceStage(next[wordId].stage);
      next[wordId] = { ...next[wordId], ...adv };
      saveProgress(next);
      return next;
    });
    addTodayLearnedId(wordId);
    setTodayLearnedIds(prev => prev.includes(wordId) ? prev : [...prev, wordId]);
  }, []);

  const reviewWord = useCallback((wordId, knew) => {
    setProgress(prev => {
      const next = { ...prev };
      const current = next[wordId] || getInitialProgress(wordId);
      if (knew) {
        const adv = advanceStage(current.stage);
        next[wordId] = { ...current, ...adv, inErrorBook: false };
      } else {
        const reset = resetStage();
        const mistake = markAsMistake(current);
        next[wordId] = { ...current, ...reset, ...mistake };
      }
      saveProgress(next);
      return next;
    });
  }, []);

  const addToErrorBook = useCallback((wordId) => {
    setProgress(prev => {
      const next = { ...prev };
      const current = next[wordId] || getInitialProgress(wordId);
      next[wordId] = { ...current, inErrorBook: true, mistakes: (current.mistakes || 0) + 1 };
      saveProgress(next);
      return next;
    });
  }, []);

  // Words due for review (nextReview <= now)
  const reviewQueue = useMemo(() => {
    return vocabulary
      .filter(w => {
        const p = progress[w.id];
        return p && !p.learned && p.nextReview && p.nextReview <= now;
      })
      .sort((a, b) => (progress[a.id]?.nextReview || 0) - (progress[b.id]?.nextReview || 0));
  }, [progress, now]);

  // ALL words that have been started but not mastered (for review page)
  const allLearningWords = useMemo(() => {
    return vocabulary
      .filter(w => {
        const p = progress[w.id];
        return p && !p.learned;
      })
      .sort((a, b) => (progress[a.id]?.nextReview || 0) - (progress[b.id]?.nextReview || 0));
  }, [progress]);

  // Count how many words are due vs recently learned
  const reviewStats = useMemo(() => {
    let due = 0, recent = 0;
    allLearningWords.forEach(w => {
      const p = progress[w.id];
      if (p && p.nextReview <= now) due++;
      else recent++;
    });
    return { due, recent, total: allLearningWords.length };
  }, [allLearningWords, progress, now]);

  const errorBookWords = useMemo(() => {
    return vocabulary.filter(w => progress[w.id]?.inErrorBook);
  }, [progress]);

  const totalLearned = useMemo(() => {
    return Object.values(progress).filter(p => p.learned).length;
  }, [progress]);

  const value = useMemo(() => ({
    vocabulary,
    progress,
    todayLearnedIds,
    activeTab,
    now,
    reviewQueue,
    allLearningWords,
    reviewStats,
    errorBookWords,
    totalLearned,
    setActiveTab,
    learnWord,
    reviewWord,
    addToErrorBook,
  }), [progress, todayLearnedIds, activeTab, now, reviewQueue, allLearningWords, reviewStats, errorBookWords, totalLearned, learnWord, reviewWord, addToErrorBook]);

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used within LearningProvider');
  return ctx;
}
