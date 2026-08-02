import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLearning } from '../context/LearningContext';
import { speakText } from '../utils/speech';

export default function ReviewPage() {
  const { allLearningWords, progress, reviewWord, totalLearned, now } = useLearning();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, forgot: 0 });
  const [mode, setMode] = useState('overview'); // 'overview' | 'reviewing'

  // Split into due (needs review now) and recent (already reviewed, still learning)
  const { due, recent } = useMemo(() => {
    const d = [];
    const r = [];
    for (const w of allLearningWords) {
      const p = progress[w.id];
      if (p && p.nextReview <= now) {
        d.push(w);
      } else {
        r.push(w);
      }
    }
    // Due: soonest first. Recent: most recently reviewed first.
    d.sort((a, b) => (progress[a.id]?.nextReview || 0) - (progress[b.id]?.nextReview || 0));
    r.sort((a, b) => (progress[b.id]?.nextReview || 0) - (progress[a.id]?.nextReview || 0));
    return { due: d, recent: r };
  }, [allLearningWords, progress, now]);

  // Full queue: due first, then recent
  const reviewQueue = useMemo(() => [...due, ...recent], [due, recent]);
  const word = reviewQueue[currentIdx];

  const goNext = useCallback(() => {
    setFlipped(false);
    if (currentIdx < reviewQueue.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setDone(true);
    }
  }, [currentIdx, reviewQueue.length]);

  const handleKnow = useCallback(() => {
    if (word) {
      reviewWord(word.id, true);
      setSessionStats(prev => ({ ...prev, known: prev.known + 1 }));
    }
    goNext();
  }, [word, reviewWord, goNext]);

  const handleForgot = useCallback(() => {
    if (word) {
      reviewWord(word.id, false);
      setSessionStats(prev => ({ ...prev, forgot: prev.forgot + 1 }));
    }
    goNext();
  }, [word, reviewWord, goNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (mode !== 'reviewing' || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(prev => !prev);
      } else if (e.key === 'k' || e.key === 'K') {
        handleKnow();
      } else if (e.key === 'f' || e.key === 'F') {
        handleForgot();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, done, handleKnow, handleForgot]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  const totalLearning = allLearningWords.length;

  // --- Overview screen --- //
  if (mode === 'overview') {
    if (totalLearning === 0) {
      return (
        <div className="px-4 py-6 max-w-lg mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">还没有学习记录</h2>
            <p className="text-gray-500">先去「今日学习」学几个单词吧！</p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">复习</h1>
        <p className="text-sm text-gray-400 mb-6">间隔重复巩固记忆</p>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
            <p className="text-2xl font-bold text-orange-500">{due.length}</p>
            <p className="text-xs text-gray-400 mt-1">待复习</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-500">{totalLearning}</p>
            <p className="text-xs text-gray-400 mt-1">学习中</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-500">{totalLearned}</p>
            <p className="text-xs text-gray-400 mt-1">已掌握</p>
          </div>
        </div>

        {/* Action card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          {due.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="font-semibold text-gray-900">有 {due.length} 个单词待复习</p>
                  <p className="text-sm text-gray-400">
                    {recent.length > 0 ? `另有 ${recent.length} 个可巩固` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setMode('reviewing')}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
              >
                开始复习
              </button>
            </>
          ) : totalLearning > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌟</span>
                <div>
                  <p className="font-semibold text-gray-900">暂无待复习单词</p>
                  <p className="text-sm text-gray-400">
                    {recent.length > 0 ? `${recent.length} 个最近学习的单词可巩固` : ''}
                  </p>
                </div>
              </div>
              {recent.length > 0 && (
                <button onClick={() => setMode('reviewing')}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  快速巩固
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* All learning words list */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">学习中 ({totalLearning})</h3>
          <div className="space-y-2">
            {reviewQueue.slice(0, 20).map(w => {
              const p = progress[w.id];
              const isDue = p && p.nextReview <= now;
              return (
                <div key={w.id}
                  className={`flex items-center justify-between bg-white rounded-xl px-4 py-3 border ${
                    isDue ? 'border-orange-100' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">{w.word}</span>
                    <span className="text-xs text-gray-400">{w.meaning}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isDue ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {isDue ? '待复习' : '已复习'}
                  </span>
                </div>
              );
            })}
            {reviewQueue.length > 20 && (
              <p className="text-center text-xs text-gray-400 pt-2">
                还有 {reviewQueue.length - 20} 个单词...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Done screen --- //
  if (done) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
          <div className="flex gap-6 my-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{sessionStats.known}</p>
              <p className="text-xs text-gray-400">记住</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{sessionStats.forgot}</p>
              <p className="text-xs text-gray-400">忘记</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{sessionStats.known + sessionStats.forgot}</p>
              <p className="text-xs text-gray-400">总计</p>
            </div>
          </div>
          <button onClick={() => { setMode('overview'); setCurrentIdx(0); setDone(false); setSessionStats({ known: 0, forgot: 0 }); }}
            className="mt-4 py-3 px-8 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
          >
            返回概览
          </button>
        </div>
      </div>
    );
  }

  // --- Reviewing view --- //
  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMode('overview')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回
        </button>
        <span className="text-sm text-gray-400">{currentIdx + 1} / {reviewQueue.length}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIdx / reviewQueue.length) * 100}%` }} />
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setFlipped(prev => !prev)}
        className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-4 min-h-[220px] flex flex-col items-center justify-center cursor-pointer select-none"
      >
        {!flipped ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-bold text-gray-900">{word.word}</h2>
              <button onClick={(e) => { e.stopPropagation(); speakText(word.word); }}
                className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            {word.phonetic && <p className="text-sm text-gray-400 mb-4">{word.phonetic}</p>}
            <p className="text-sm text-gray-300">点击卡片查看释义</p>
          </>
        ) : (
          <div className="text-center w-full">
            <p className="text-2xl font-bold text-gray-800 mb-3">{word.meaning}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {word.frequency != null && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                  词频 {word.frequency}
                </span>
              )}
              {word.category && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  {word.category}
                </span>
              )}
            </div>
            {word.example ? (
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 italic leading-relaxed">"{word.example}"</p>
                <p className="text-xs text-gray-400 mt-1.5">{word.exampleCn}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">考研大纲词频排序 #{word.id}</p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={`flex gap-3 transition-all duration-200 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <button onClick={handleForgot}
          className="flex-1 py-3.5 px-4 rounded-xl border-2 border-red-100 text-red-400 font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          忘了
        </button>
        <button onClick={handleKnow}
          className="flex-1 py-3.5 px-4 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
        >
          我知道了 ✓
        </button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-3">
        点击卡片翻转 · K 记住 · F 忘记
      </p>
    </div>
  );
}
