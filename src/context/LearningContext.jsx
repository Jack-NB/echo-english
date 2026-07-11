import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import vocabulary from '../data/vocabulary';
import { getProgress, saveProgress, getTodayLearnedIds, addTodayLearnedId } from '../utils/storage';
import { getInitialProgress, advanceStage, resetStage, markAsMistake } from '../utils/spacedRepetition';

const LearningContext = createContext(null);

export function LearningProvider({ children }) {
  const [progress, setProgress] = useState(() => getProgress());
  const [todayLearnedIds, setTodayLearnedIds] = useState(() => getTodayLearnedIds());
  const [activeTab, setActiveTab] = useState('learn');

  const save = useCallback((newProgress) => {
    setProgress(newProgress);
    saveProgress(newProgress);
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

  const reviewQueue = useMemo(() => {
    const now = Date.now();
    return vocabulary
      .filter(w => {
        const p = progress[w.id];
        return p && !p.learned && p.nextReview && p.nextReview <= now;
      })
      .sort((a, b) => (progress[a.id]?.nextReview || 0) - (progress[b.id]?.nextReview || 0));
  }, [progress]);

  const errorBookWords = useMemo(() => {
    return vocabulary.filter(w => progress[w.id]?.inErrorBook);
  }, [progress]);

  const newWordsToday = useMemo(() => {
    return vocabulary.filter(w => {
      const p = progress[w.id];
      return !p || (p.stage === 0 && !p.learned);
    });
  }, [progress]);

  const totalLearned = useMemo(() => {
    return Object.values(progress).filter(p => p.learned).length;
  }, [progress]);

  const value = useMemo(() => ({
    vocabulary,
    progress,
    todayLearnedIds,
    activeTab,
    reviewQueue,
    errorBookWords,
    newWordsToday,
    totalLearned,
    setActiveTab,
    learnWord,
    reviewWord,
    addToErrorBook,
  }), [progress, todayLearnedIds, activeTab, reviewQueue, errorBookWords, newWordsToday, totalLearned, learnWord, reviewWord, addToErrorBook]);

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
