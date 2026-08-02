import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLearning } from '../context/LearningContext';
import { speakText } from '../utils/speech';

const VISITS_KEY = 'echo_english_doc_visits_v1';
const LAST_DAY_KEY = 'echo_english_last_day_v1';
const MIN_READ_MS = 3000;

function loadVisits() {
  try {
    return JSON.parse(localStorage.getItem(VISITS_KEY)) || {};
  } catch {
    return {};
  }
}

function dayLabel(day) {
  return `Day ${String(day).padStart(3, '0')}`;
}

function loadLastDay() {
  try {
    const value = Number(localStorage.getItem(LAST_DAY_KEY));
    return Number.isInteger(value) ? value : null;
  } catch {
    return null;
  }
}

function alternateText(value) {
  if (!value) return '';
  return Array.isArray(value) ? value.join(' / ') : String(value);
}

function WordLink({ word, onWordClick }) {
  return (
    <button type="button" className="doc-word" onClick={() => onWordClick(word)}>
      {word}
    </button>
  );
}

function wrapTextChildren(children, onWordClick) {
  return Children.map(children, child => {
    if (typeof child === 'string') {
      return child
        .split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/g)
        .map((part, index) =>
          /^[A-Za-z]/.test(part)
            ? <WordLink key={index} word={part} onWordClick={onWordClick} />
            : part
        );
    }
    if (isValidElement(child) && child.props?.children) {
      return cloneElement(child, {
        children: wrapTextChildren(child.props.children, onWordClick),
      });
    }
    return child;
  });
}

export default function GeneratedDocs() {
  const { activeTab, vocabulary } = useLearning();
  const [manifest, setManifest] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState(loadVisits);
  const [jumpValue, setJumpValue] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [showRecent, setShowRecent] = useState(false);

  const selectItem = useCallback((item) => {
    setSelectedItem({ day: item.day, file: item.file });
    setContent('');
    setSelectedWord(null);
    localStorage.setItem(LAST_DAY_KEY, String(item.day));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('generated/manifest.json')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('missing manifest'))))
      .then(data => {
        if (cancelled) return;
        setManifest(data);
        setLoading(false);
        if (data.days?.length) {
          const saved = loadLastDay();
          const found = saved != null
            ? data.days.find(d => d.day === saved)
            : null;
          selectItem(found || data.days[data.days.length - 1]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setManifest(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectItem]);

  useEffect(() => {
    if (!selectedItem) return;
    let cancelled = false;
    fetch(`generated/${selectedItem.file}`)
      .then(res => res.text())
      .then(text => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setContent('');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  // Build a small map of derived words from the current day's derivation trees.
  const docWordMap = useMemo(() => {
    if (!content) return {};
    const map = {};
    const blocks = content.matchAll(/```[a-z]*\n([\s\S]*?)```/g);
    for (const block of blocks) {
      for (const line of block[1].split('\n')) {
        const match = line.match(/^\s*[├└─│ ]*\s*([A-Za-z][A-Za-z'-]*)\s*\(([^)]*)\)/);
        if (match) {
          const key = match[1].toLowerCase();
          const value = match[2].trim();
          if (value && !map[key]) map[key] = value;
        }
      }
    }
    return map;
  }, [content]);

  const selectedDay = selectedItem?.day ?? null;

  // Count a visit only when the reader stays on the doc for a few seconds.
  useEffect(() => {
    if (activeTab !== 'docs' || selectedDay == null || !content) return;
    const day = selectedDay;
    const timer = setTimeout(() => {
      setVisits(prev => {
        const current = prev[day] || { count: 0, lastAt: 0 };
        const next = {
          ...prev,
          [day]: { count: current.count + 1, lastAt: Date.now() },
        };
        localStorage.setItem(VISITS_KEY, JSON.stringify(next));
        return next;
      });
    }, MIN_READ_MS);
    return () => clearTimeout(timer);
  }, [activeTab, selectedDay, content]);

  const selectedIndex = manifest && selectedDay != null
    ? manifest.days.findIndex(d => d.day === selectedDay)
    : -1;
  const prevItem = selectedIndex > 0 ? manifest.days[selectedIndex - 1] : null;
  const nextItem = selectedIndex >= 0 && selectedIndex < manifest.days.length - 1
    ? manifest.days[selectedIndex + 1]
    : null;
  const selectedVisits = selectedDay != null ? visits[selectedDay]?.count || 0 : 0;

  const recentVisits = useMemo(() => {
    return Object.entries(visits)
      .map(([day, value]) => ({
        day: Number(day),
        count: value.count,
        lastAt: value.lastAt,
      }))
      .filter(v => v.count > 0)
      .sort((a, b) => b.lastAt - a.lastAt)
      .slice(0, 6);
  }, [visits]);

  function jumpToDay() {
    const num = Number(jumpValue);
    if (manifest && Number.isInteger(num) && num >= 1 && num <= manifest.total) {
      const item = manifest.days.find(d => d.day === num);
      if (item) selectItem(item);
    }
    setJumpValue('');
  }

  function handleWordClick(word) {
    const key = word.toLowerCase();
    const entry = vocabulary.find(v => v.word.toLowerCase() === key) || null;
    setSelectedWord({
      display: word,
      entry,
      docMeaning: docWordMap[key] || '',
    });
  }

  const markdownComponents = {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mt-9 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold text-gray-900 mt-7 mb-3">{children}</h3>,
    p: ({ children }) => (
      <p className="text-[15px] text-gray-700 leading-loose mb-6">
        {wrapTextChildren(children, handleWordClick)}
      </p>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 text-[13px] leading-loose rounded-xl p-5 overflow-x-auto mb-7 whitespace-pre-wrap break-words">
        {wrapTextChildren(children, handleWordClick)}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-200 pl-4 text-gray-400 text-sm mb-6">{children}</blockquote>
    ),
    hr: () => <hr className="my-6 border-gray-100" />,
    li: ({ children }) => (
      <li className="text-[15px] text-gray-700 leading-loose mb-3 ml-1">
        {wrapTextChildren(children, handleWordClick)}
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{wrapTextChildren(children, handleWordClick)}</strong>
    ),
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  if (!manifest || manifest.days.length === 0) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">AI 文档生成中</h2>
          <p className="text-gray-500">生成器正在后台运行，稍后刷新查看</p>
        </div>
      </div>
    );
  }

  const entry = selectedWord?.entry;
  const meanings = entry?.meanings || [];
  const phrases = entry?.phrases || [];

  return (
    <div className={`px-4 py-6 max-w-lg mx-auto ${selectedWord ? 'pb-40' : ''}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">AI 文档</h1>
        <p className="text-sm text-gray-400 mt-0.5">已生成 {manifest.total} 天</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={manifest.total}
            value={jumpValue}
            onChange={e => setJumpValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') jumpToDay();
            }}
            placeholder={`1-${manifest.total}`}
            className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none select-text"
          />
          <button
            onClick={jumpToDay}
            className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            跳转
          </button>
          <button
            onClick={() => prevItem && selectItem(prevItem)}
            disabled={!prevItem}
            className="shrink-0 w-9 h-9 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors"
            aria-label="上一篇"
          >
            ‹
          </button>
          <button
            onClick={() => nextItem && selectItem(nextItem)}
            disabled={!nextItem}
            className="shrink-0 w-9 h-9 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors"
            aria-label="下一篇"
          >
            ›
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {selectedDay != null ? dayLabel(selectedDay) : ''} · 本日访问 {selectedVisits} 次
        </p>
      </div>

      {recentVisits.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowRecent(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>最近访问（{recentVisits.length}）</span>
            <span className={`inline-block transition-transform ${showRecent ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showRecent && (
            <div className="flex flex-wrap gap-2 mt-2">
              {recentVisits.map(v => (
                <button
                  key={v.day}
                  onClick={() => {
                    const item = manifest.days.find(d => d.day === v.day);
                    if (item) selectItem(item);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedDay === v.day
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {dayLabel(v.day)} · {v.count} 次
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <ReactMarkdown components={markdownComponents}>
          {content || '加载中...'}
        </ReactMarkdown>
      </div>

      {selectedWord && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[72vh] overflow-y-auto safe-bottom">
          <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{selectedWord.display}</h3>
              <button
                onClick={() => speakText(selectedWord.display)}
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                aria-label="播放发音"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setSelectedWord(null)}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {entry?.inOutline === false && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-500 font-medium">
                  不在大纲内
                </span>
              )}
              {entry?.sourceDay != null && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-500 font-medium">
                  源自 Day {String(entry.sourceDay).padStart(3, '0')} 派生词
                </span>
              )}
              {entry?.frequency != null && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                  词频 {entry.frequency}
                </span>
              )}
              {entry?.category && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  {entry.category}
                </span>
              )}
              {entry?.subcategory && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">
                  {entry.subcategory}
                </span>
              )}
              {alternateText(entry?.alternate) && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {alternateText(entry.alternate)}
                </span>
              )}
            </div>

            {meanings.length > 0 ? (
              <div className="space-y-3 mb-5">
                {meanings.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="shrink-0 min-w-8 text-center text-xs font-semibold text-white bg-blue-500 rounded px-1.5 py-0.5">
                      {item.type || '义'}
                    </span>
                    <p className="text-[15px] text-gray-700 leading-relaxed">{item.translation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] text-gray-700 leading-relaxed mb-5">
                {entry?.meaning || selectedWord.docMeaning || '暂无独立词条，请结合文中语境理解'}
              </p>
            )}

            {!meanings.length && selectedWord.docMeaning && (
              <p className="text-xs text-gray-400 mb-5">文中释义：{selectedWord.docMeaning}</p>
            )}

            {phrases.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">常用搭配</h4>
                <div className="space-y-2">
                  {phrases.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-gray-800">{item.phrase}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.translation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
