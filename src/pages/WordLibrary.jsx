import { useMemo, useState } from 'react';
import { useLearning } from '../context/LearningContext';

const PAGE_SIZE = 100;

function alternateText(value) {
  if (!value) return '';
  return Array.isArray(value) ? value.join(' / ') : String(value);
}

export default function WordLibrary() {
  const { vocabulary } = useLearning();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const counts = new Map();
    for (const w of vocabulary) {
      const name = w.category || '未分类';
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [vocabulary]);

  const filtered = useMemo(() => {
    const keyword = query.trim();
    const lower = keyword.toLowerCase();
    return vocabulary.filter(w => {
      if (category !== '全部' && (w.category || '未分类') !== category) return false;
      if (!lower) return true;
      return w.word.toLowerCase().includes(lower) || (w.meaning || '').includes(keyword);
    });
  }, [vocabulary, query, category]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">词库</h1>
        <p className="text-sm text-gray-400 mt-0.5">{vocabulary.length} 个考研大纲词</p>
      </div>

      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
          placeholder="搜索单词或释义"
          className="flex-1 bg-transparent text-sm text-gray-800 outline-none select-text min-w-0"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm hover:bg-gray-200 transition-colors shrink-0"
            aria-label="清空搜索"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-4 px-4">
        <button
          onClick={() => { setCategory('全部'); setVisible(PAGE_SIZE); }}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            category === '全部'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          全部 {vocabulary.length}
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            onClick={() => { setCategory(name); setVisible(PAGE_SIZE); }}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              category === name
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {name} {count}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} 条结果</p>

      <div className="space-y-2">
        {shown.map(w => (
          <div key={w.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-gray-900">{w.word}</span>
                {alternateText(w.alternate) && (
                  <span className="text-xs text-gray-300">{alternateText(w.alternate)}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate mt-0.5">{w.meaning}</p>
            </div>
            <div className="text-right shrink-0 ml-3">
              {w.frequency != null && (
                <p className="text-sm font-semibold text-blue-600">{w.frequency}</p>
              )}
              <p className="text-xs text-gray-400">{w.category || '未分类'}</p>
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">没有匹配的单词</div>
      )}

      {filtered.length > visible && (
        <button
          onClick={() => setVisible(prev => prev + PAGE_SIZE)}
          className="w-full mt-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
        >
          加载更多（{filtered.length - visible}）
        </button>
      )}
    </div>
  );
}
