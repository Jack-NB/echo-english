import { useState, useEffect, useCallback } from 'react';
import { useLearning } from '../context/LearningContext';
import WordCard from '../components/WordCard';

export default function ReviewPage() {
  const { reviewQueue, reviewWord, totalLearned } = useLearning();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ known: 0, forgot: 0 });

  useEffect(() => {
    setCurrentIdx(0);
    setFlipped(false);
    setDone(false);
    setStats({ known: 0, forgot: 0 });
  }, [reviewQueue.length]);

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
      setStats(prev => ({ ...prev, known: prev.known + 1 }));
      goNext();
    }
  }, [word, reviewWord, goNext]);

  const handleForgot = useCallback(() => {
    if (word) {
      reviewWord(word.id, false);
      setStats(prev => ({ ...prev, forgot: prev.forgot + 1 }));
      goNext();
    }
  }, [word, reviewWord, goNext]);

  const handleFlip = useCallback(() => {
    setFlipped(prev => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (done) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (!flipped) setFlipped(true);
      } else if (e.key === 'k' || e.key === 'K') {
        handleKnow();
      } else if (e.key === 'f' || e.key === 'F') {
        handleForgot();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [done, flipped, handleKnow, handleForgot, handleFlip]);

  // Review queue empty but words have been learned
  if (reviewQueue.length === 0 && totalLearned > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center slide-up">
        <div className="text-6xl mb-6">🌟</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
        <p className="text-gray-500 mb-1">当前没有需要复习的单词</p>
        <p className="text-sm text-gray-400">
          已掌握 <span className="font-semibold text-green-600">{totalLearned}</span> 个单词
        </p>
      </div>
    );
  }

  // No words at all
  if (reviewQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center slide-up">
        <div className="text-6xl mb-6">📚</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">还没有复习内容</h2>
        <p className="text-gray-500">先去学习一些单词吧！</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center slide-up">
        <div className="text-6xl mb-6">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
        <p className="text-gray-500 mb-1">
          本次复习 <span className="font-semibold text-blue-600">{stats.known + stats.forgot}</span> 个单词
        </p>
        <div className="flex gap-4 mt-2">
          <span className="text-green-600">✓ 记住 {stats.known}</span>
          <span className="text-red-400">✗ 忘记 {stats.forgot}</span>
        </div>
        {stats.forgot > 0 && (
          <p className="text-sm text-gray-400 mt-4">忘记的单词已加入错题本</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">复习</h1>
        <span className="text-sm text-gray-400">
          {currentIdx + 1} / {reviewQueue.length}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(currentIdx / reviewQueue.length) * 100}%` }}
        />
      </div>

      <WordCard
        word={word}
        showMeaning={flipped}
        onFlip={handleFlip}
        flipped={flipped}
      >
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleForgot}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-red-100 text-red-400 font-medium hover:bg-red-50 transition-colors"
          >
            忘了
          </button>
          <button
            onClick={handleKnow}
            className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            我知道了 ✓
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-3">
          空格翻转 · K 记住 · F 忘记 · ←→ 查看答案
        </p>
      </WordCard>
    </div>
  );
}
