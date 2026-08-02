import { useState, useCallback, useEffect, useRef } from 'react';
import { useLearning } from '../context/LearningContext';
import { speakText } from '../utils/speech';

const QUIZ_COUNT = 3;
const OPTIONS_COUNT = 4;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(vocabulary, learnedIds, errorWordIds) {
  const ids = new Set([...learnedIds, ...errorWordIds]);
  const pool = vocabulary.filter(w => ids.has(w.id));
  if (pool.length < 1) return [];
  const count = Math.min(QUIZ_COUNT, pool.length);
  const selected = shuffle(pool).slice(0, count);
  return selected.map(target => {
    const distractors = shuffle(
      vocabulary.filter(w => w.id !== target.id)
    ).slice(0, OPTIONS_COUNT - 1);
    const options = shuffle([
      { text: target.meaning, correct: true },
      ...distractors.map(d => ({ text: d.meaning, correct: false })),
    ]);
    return { word: target, options };
  });
}

export default function ListeningQuiz() {
  const { vocabulary, todayLearnedIds, errorBookWords, addToErrorBook, activeTab } = useLearning();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const prevTabRef = useRef(activeTab);

  // Stable questions: rebuild when entering the quiz tab, keep them during the session
  const [questions, setQuestions] = useState(() =>
    buildQuiz(vocabulary, todayLearnedIds, errorBookWords.map(w => w.id))
  );

  useEffect(() => {
    const entered = prevTabRef.current !== 'quiz' && activeTab === 'quiz';
    prevTabRef.current = activeTab;
    if (!entered) return;
    setQuestions(buildQuiz(vocabulary, todayLearnedIds, errorBookWords.map(w => w.id)));
    setCurrentIdx(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  }, [activeTab, vocabulary, todayLearnedIds, errorBookWords]);

  const current = questions[currentIdx];

  const speak = useCallback((word) => {
    speakText(word, { rate: 0.85 });
  }, []);

  // Mobile browsers block audio until the user interacts with the page.
  useEffect(() => {
    const enable = () => setAudioReady(true);
    window.addEventListener('pointerdown', enable, { once: true });
    window.addEventListener('keydown', enable, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
    };
  }, []);

  // Auto-play when a new question appears (before showing result)
  useEffect(() => {
    if (current && !showResult && audioReady) {
      const t = setTimeout(() => speak(current.word.word), 300);
      return () => {
        clearTimeout(t);
      };
    }
  }, [current, showResult, speak, audioReady]);

  const handleSelect = useCallback((option) => {
    if (showResult) return;
    setSelected(option.text);
    setShowResult(true);
    if (option.correct) {
      setScore(prev => prev + 1);
    } else if (current) {
      addToErrorBook(current.word.id);
    }
  }, [showResult, current, addToErrorBook]);

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  }, [currentIdx, questions.length]);

  // --- Empty pool --- //
  if (questions.length === 0) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">还没有可测验的单词</h2>
          <p className="text-gray-500">先去学习一些单词吧！</p>
        </div>
      </div>
    );
  }

  // --- Finished --- //
  if (finished) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          {score === questions.length ? (
            <>
              <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
                <span className="text-4xl">🏆</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">全部正确！</h2>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <span className="text-4xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">测验完成</h2>
            </>
          )}
          <div className="flex gap-8 my-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{score}</p>
              <p className="text-xs text-gray-400 mt-1">正确</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-700">{questions.length}</p>
              <p className="text-xs text-gray-400 mt-1">总题数</p>
            </div>
          </div>
          {score < questions.length && (
            <p className="text-sm text-gray-400 mt-2">答错的单词已加入错题本</p>
          )}
        </div>
      </div>
    );
  }

  // --- Quiz view --- //
  const correctAnswer = current.options.find(o => o.correct);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-900">听力测验</h1>
        <span className="text-sm text-gray-400">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
      </div>

      {/* Big play button */}
      <div className="flex flex-col items-center mb-8">
        <button onClick={() => speak(current.word.word)}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 flex items-center justify-center transition-all shadow-lg active:scale-95 mb-4"
        >
          <svg className="w-12 h-12 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <p className="text-sm text-gray-400">点击播放发音，选择正确的中文释义</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {current.options.map((opt, i) => {
          let btnCls = 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300';
          if (showResult) {
            if (opt.correct) {
              btnCls = 'border-green-500 bg-green-50 text-green-700';
            } else if (selected === opt.text) {
              btnCls = 'border-red-400 bg-red-50 text-red-600';
            } else {
              btnCls = 'border-gray-100 text-gray-300';
            }
          }
          return (
            <button key={i} onClick={() => handleSelect(opt)} disabled={showResult}
              className={`w-full py-4 px-6 rounded-xl border-2 text-left font-medium transition-all ${btnCls}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm shrink-0 ${
                  showResult && opt.correct ? 'border-green-500 text-green-600 bg-green-50' :
                  showResult && selected === opt.text ? 'border-red-400 text-red-500' :
                  'border-gray-300 text-gray-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className="mt-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm slide-up">
          <p className={`font-semibold text-lg ${selected === correctAnswer.text ? 'text-green-600' : 'text-red-500'}`}>
            {selected === correctAnswer.text ? '✓ 回答正确！' : `✗ 正确答案：${correctAnswer.text}`}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {current.word.word}
            {current.word.phonetic ? ` — ${current.word.phonetic}` : ''}
            {current.word.category ? ` · ${current.word.category}` : ''}
          </p>
          <button onClick={handleNext}
            className="mt-3 w-full py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {currentIdx < questions.length - 1 ? '下一题' : '查看成绩'}
          </button>
        </div>
      )}
    </div>
  );
}
