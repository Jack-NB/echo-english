import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLearning } from '../context/LearningContext';

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

export default function ListeningQuiz() {
  const { vocabulary, todayLearnedIds, errorBookWords, learnWord, addToErrorBook } = useLearning();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Build quiz pool from today's learned + error book words
  const quizPool = useMemo(() => {
    const ids = new Set([...todayLearnedIds, ...errorBookWords.map(w => w.id)]);
    return vocabulary.filter(w => ids.has(w.id));
  }, [vocabulary, todayLearnedIds, errorBookWords]);

  const generateQuiz = useCallback(() => {
    if (quizPool.length < 1) return [];

    const count = Math.min(QUIZ_COUNT, quizPool.length);
    const selected = shuffle(quizPool).slice(0, count);

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
  }, [quizPool, vocabulary]);

  useEffect(() => {
    setQuestions(generateQuiz());
    setCurrentIdx(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  }, [generateQuiz]);

  const speak = useCallback((word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const current = questions[currentIdx];

  // Auto-play on new question
  useEffect(() => {
    if (current && !showResult) {
      const timer = setTimeout(() => speak(current.word.word), 300);
      return () => clearTimeout(timer);
    }
  }, [current, showResult, speak]);

  const handleSelect = useCallback((option) => {
    if (showResult) return;
    setSelected(option.text);
    setShowResult(true);

    if (option.correct) {
      setScore(prev => prev + 1);
    } else {
      // Add to error book if wrong
      if (current) {
        addToErrorBook(current.word.id);
      }
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

  // No quiz pool available
  if (quizPool.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center slide-up">
        <div className="text-6xl mb-6">🎧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">还没有可测验的单词</h2>
        <p className="text-gray-500">先去学习一些单词吧！</p>
      </div>
    );
  }

  // No questions generated (shouldn't happen if pool is non-empty)
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-gray-500">准备题目中...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center slide-up">
        <div className="text-6xl mb-6">{score === questions.length ? '🏆' : '📊'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">测验完成！</h2>
        <p className="text-lg text-gray-600 mb-2">
          得分：<span className="font-bold text-blue-600">{score}</span> / {questions.length}
        </p>
        {score < questions.length && (
          <p className="text-sm text-gray-400 mt-2">
            答错的单词已加入错题本
          </p>
        )}
        <button
          onClick={() => {
            setQuestions(generateQuiz());
            setCurrentIdx(0);
            setSelected(null);
            setShowResult(false);
            setScore(0);
            setFinished(false);
          }}
          className="mt-6 py-3 px-8 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          再来一次
        </button>
      </div>
    );
  }

  const correctOption = current.options.find(o => o.correct);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">听力测验</h1>
        <span className="text-sm text-gray-400">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="bg-purple-50 rounded-2xl p-8 mb-4 w-full flex items-center justify-center">
          <button
            onClick={() => speak(current.word.word)}
            className="w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors shadow-lg"
            title="播放发音"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-400">点击喇叭听发音，选择正确的中文释义</p>
      </div>

      <div className="space-y-3">
        {current.options.map((option, idx) => {
          let btnClass = 'border-gray-200 hover:bg-gray-50 text-gray-700';
          if (showResult) {
            if (option.correct) {
              btnClass = 'border-green-500 bg-green-50 text-green-700';
            } else if (selected === option.text && !option.correct) {
              btnClass = 'border-red-400 bg-red-50 text-red-600';
            } else {
              btnClass = 'border-gray-100 text-gray-300';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`w-full py-4 px-6 rounded-xl border-2 text-left font-medium transition-all ${btnClass}`}
            >
              {option.text}
              {showResult && option.correct && (
                <span className="float-right text-green-600 font-bold">✓</span>
              )}
              {showResult && selected === option.text && !option.correct && (
                <span className="float-right text-red-500 font-bold">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className={`mt-4 p-4 rounded-xl ${selected === correctOption.text ? 'bg-green-50' : 'bg-red-50'} slide-up`}>
          <p className={`font-medium ${selected === correctOption.text ? 'text-green-700' : 'text-red-600'}`}>
            {selected === correctOption.text ? '✓ 回答正确！' : `✗ 正确答案：${correctOption.text}`}
          </p>
          <p className="text-gray-500 text-sm mt-1">{current.word.word} — {current.word.meaning}</p>
          <button
            onClick={handleNext}
            className="mt-3 w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {currentIdx < questions.length - 1 ? '下一题' : '查看成绩'}
          </button>
        </div>
      )}
    </div>
  );
}
