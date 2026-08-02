import { speakText } from '../utils/speech';

export default function WordCard({ word, showMeaning, onFlip, flipped, children }) {
  return (
    <div className="fade-in">
      <div
        className={`relative w-full max-w-md mx-auto cursor-pointer ${flipped ? 'flipped' : ''}`}
        onClick={onFlip}
        style={{ minHeight: '280px' }}
      >
        <div className="card-inner absolute inset-0">
          {/* Front */}
          <div className="card-front absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl font-bold text-gray-900">{word.word}</h2>
              <button
                onClick={(e) => { e.stopPropagation(); speakText(word.word); }}
                className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                title="点击播放发音"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            {word.phonetic && (
              <p className="text-gray-400 text-sm mb-2">{word.phonetic}</p>
            )}
            {showMeaning && (
              <p className="text-gray-500 text-lg mt-2">{word.meaning}</p>
            )}
            {!showMeaning && !flipped && (
              <p className="text-gray-300 text-sm mt-6">点击卡片查看释义</p>
            )}
          </div>

          {/* Back */}
          <div className="card-back absolute inset-0 bg-blue-50 rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{word.word}</h2>
            <p className="text-xl text-blue-700 font-medium mb-4">{word.meaning}</p>
            {word.phonetic && (
              <p className="text-blue-400 text-sm mb-4">{word.phonetic}</p>
            )}
          </div>
        </div>
      </div>

      {children && (
        <div className="mt-4 max-w-md mx-auto space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
