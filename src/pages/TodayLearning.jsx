import { useState, useCallback } from 'react';
import { useLearning } from '../context/LearningContext';
import { speakText } from '../utils/speech';

const WORDS_PER_SESSION = 5;

export default function TodayLearning() {
  const { vocabulary, todayLearnedIds, learnWord } = useLearning();
  const [currentIdx, setCurrentIdx] = useState(0);

  // Stable session: pick words once on mount, NOT reactive to todayLearnedIds
  const [sessionWords] = useState(() => {
    const learned = new Set(todayLearnedIds);
    const available = vocabulary.filter(w => !learned.has(w.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, WORDS_PER_SESSION);
  });

  const completed = currentIdx >= sessionWords.length;
  const word = sessionWords[currentIdx];
  const todayCount = todayLearnedIds.length;

  const handleRemember = useCallback(() => {
    if (word) {
      learnWord(word.id);
      speakText(word.word);
    }
    setCurrentIdx(prev => prev + 1);
  }, [word, learnWord]);

  const handleSkip = useCallback(() => {
    setCurrentIdx(prev => prev + 1);
  }, []);

  // Completed screen
  if (completed) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto slide-up">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {/* Success ring */}
          <div className="relative mb-8">
            <svg className="w-28 h-28" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#22C55E" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">今日学习完成！</h2>
          <p className="text-gray-500 mb-1">
            今天学习了 <span className="font-semibold text-blue-600">{todayCount}</span> 个单词
          </p>
          <p className="text-sm text-gray-400 mb-8">
            {todayCount >= WORDS_PER_SESSION ? '🎉 达成每日目标！' : '明天继续！'}
          </p>

          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">💡</span>
              <div className="text-sm text-blue-800 text-left">
                <p className="font-medium mb-1">下一步建议</p>
                <p>前往「复习」巩固今日所学，或「听力测验」练习听力</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No words available
  if (sessionWords.length === 0) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">今日单词已学完</h2>
          <p className="text-gray-500">所有单词已学习，去复习吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Daily goal progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">今日学习</h1>
          <p className="text-sm text-gray-400 mt-0.5">每日 {WORDS_PER_SESSION} 个新词</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">{Math.min(todayCount, WORDS_PER_SESSION)}/{WORDS_PER_SESSION}</p>
            <p className="text-xs text-gray-400">今日目标</p>
          </div>
          <svg className="w-10 h-10" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3B82F6" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 15.5}`}
              strokeDashoffset={`${2 * Math.PI * 15.5 * (1 - Math.min(todayCount, WORDS_PER_SESSION) / WORDS_PER_SESSION)}`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
        </div>
      </div>

      {/* Session progress */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentIdx / sessionWords.length) * 100}%` }} />
      </div>

      {/* Word card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-gray-900">{word.word}</h2>
            <button onClick={() => speakText(word.word)}
              className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
          {word.phonetic && <p className="text-gray-400 text-sm">{word.phonetic}</p>}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-lg text-gray-800 font-medium text-center">{word.meaning}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
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
            {word.subcategory && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">
                {word.subcategory}
              </span>
            )}
          </div>
        </div>

        {word.example ? (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600 italic leading-relaxed">"{word.example}"</p>
            <p className="text-xs text-gray-400 mt-1.5">{word.exampleCn}</p>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">考研大纲词频排序 #{word.id}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handleSkip}
          className="flex-1 py-3.5 px-4 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          跳过
        </button>
        <button onClick={handleRemember}
          className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          记住了 ✓
        </button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-4">
        第 {currentIdx + 1} 个，共 {sessionWords.length} 个
      </p>
    </div>
  );
}
