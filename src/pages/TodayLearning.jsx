import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLearning } from '../context/LearningContext';
import WordCard from '../components/WordCard';

const WORDS_PER_SESSION = 5;

export default function TodayLearning() {
  const { vocabulary, todayLearnedIds, learnWord } = useLearning();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionWords, setSessionWords] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [spoken, setSpoken] = useState(false);

  const pickWords = useMemo(() => {
    const available = vocabulary.filter(
      w => !todayLearnedIds.includes(w.id)
    );
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, WORDS_PER_SESSION);
  }, [vocabulary, todayLearnedIds]);

  useEffect(() => {
    setSessionWords(pickWords);
    setCurrentIdx(0);
    setCompleted(pickWords.length === 0);
    setSpoken(false);
  }, [pickWords]);

  useEffect(() => {
    setSpoken(false);
  }, [currentIdx]);

  const speak = useCallback((word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const handleRemember = useCallback(() => {
    const word = sessionWords[currentIdx];
    if (word) {
      learnWord(word.id);
      if (!spoken) {
        speak(word.word);
        setSpoken(true);
      }
    }
    if (currentIdx < sessionWords.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentIdx, sessionWords, learnWord, spoken, speak]);

  const handleSkip = useCallback(() => {
    if (currentIdx < sessionWords.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentIdx, sessionWords]);

  const word = sessionWords[currentIdx];

  if (completed) {
    const learned = todayLearnedIds.length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center slide-up">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">今日学习完成！</h2>
        <p className="text-gray-500 mb-2">
          今天已学习 <span className="font-semibold text-blue-600">{learned}</span> 个单词
        </p>
        {learned < 5 && (
          <p className="text-gray-400 text-sm">明天继续来学习更多单词吧！</p>
        )}
        <div className="mt-8 w-full max-w-xs bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            💡 提示：复习和听力测验可以巩固今日所学
          </p>
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">今日单词已学完</h2>
        <p className="text-gray-500">所有单词已学习，去复习吧！</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">今日学习</h1>
        <span className="text-sm text-gray-400">
          {currentIdx + 1} / {sessionWords.length}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIdx) / sessionWords.length) * 100}%` }}
        />
      </div>

      <WordCard word={word} showMeaning={true}>
        <div className="mt-6 space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-700 leading-relaxed">"{word.example}"</p>
            <p className="text-gray-400 text-sm mt-2">{word.exampleCn}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              跳过
            </button>
            <button
              onClick={handleRemember}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              记住了 ✓
            </button>
          </div>
        </div>
      </WordCard>
    </div>
  );
}
