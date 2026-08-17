import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { lookupWord, lookupWordDeep, preloadExtra } from '../utils/vocabLookup';
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

function splitDoc(content) {
  const lines = content.split('\n');
  const transIdx = lines.findIndex(line => line.includes('中文翻译'));
  const beforeLines = (transIdx >= 0 ? lines.slice(0, transIdx) : lines).filter(line => {
    const trimmed = line.trim();
    return !/^#\s+Day\s+\d+/.test(trimmed) && !/^>\s*生成时间/.test(trimmed);
  });
  const translation = transIdx >= 0 ? lines.slice(transIdx).join('\n') : '';

  const storyMarker = /###\s*2\.?\s*连锁故事|^\*\*(英文)?连锁故事|^\*\*The Chain Story/;
  let storyIdx = beforeLines.findIndex(line => storyMarker.test(line.trim()));
  if (storyIdx < 0) {
    const fenceStart = beforeLines.findIndex(line => /^```/.test(line.trim()));
    if (fenceStart >= 0) {
      const fenceEnd = beforeLines.findIndex(
        (line, index) => index > fenceStart && /^```/.test(line.trim())
      );
      storyIdx = fenceEnd >= 0 ? fenceEnd + 1 : fenceStart + 1;
    } else {
      storyIdx = 0;
    }
  }

  const derivation = beforeLines.slice(0, storyIdx).join('\n');
  const story = beforeLines.slice(storyIdx).join('\n');
  return { derivation, story, translation };
}

function splitParagraphs(markdown) {
  return markdown
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(s => (
      s
      && !/^#{1,4}\s/.test(s)
      && !/^\*\*[^*]+\*\*$/.test(s)
      && !/^\*\*[^*]+\*\*\s*([：:]\s*)?([（(][^）)]*[）)])?\s*[：:]?\s*$/.test(s)
      && !/^-{3,}$/.test(s)
    ));
}

function cleanTranslation(paragraph) {
  return paragraph
    .replace(/[（(][A-Za-z][A-Za-z'’\- ]*[）)]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function WordLink({ word, onWordClick }) {
  return (
    <button type="button" className="doc-word" onClick={e => onWordClick(word, e)}>
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
  const [manifest, setManifest] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [content, setContent] = useState('');
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState(loadVisits);
  const [jumpValue, setJumpValue] = useState('');
  const [popover, setPopover] = useState(null);
  const [showRecent, setShowRecent] = useState(false);
  const popoverRef = useRef(null);
  const scrollToBottomRef = useRef(false);

  const selectItem = useCallback((item) => {
    setSelectedItem({ day: item.day, file: item.file });
    setContent('');
    setFetchError(false);
    setPopover(null);
    localStorage.setItem(LAST_DAY_KEY, String(item.day));
  }, []);

  const closePopover = useCallback(() => setPopover(null), []);

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
        if (!cancelled) {
          setContent('');
          setFetchError(true);
        }
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

  const docParts = useMemo(() => splitDoc(content), [content]);
  const storyParas = useMemo(() => splitParagraphs(docParts.story), [docParts.story]);
  const transParas = useMemo(() => splitParagraphs(docParts.translation), [docParts.translation]);
  const paraCount = Math.max(storyParas.length, transParas.length);
  const derivationDisplay = useMemo(() => {
    let raw = docParts.derivation.replace(/^#{1,4}\s+.*$/gm, '').trim();
    if (!raw) return '';
    raw = raw.replace(/\*/g, '').replace(/([A-Za-z])-(\s|\))/g, '$1$2');
    if (!raw.includes('```')) return `\`\`\`text\n${raw}\n\`\`\``;
    return raw;
  }, [docParts.derivation]);
  const selectedDay = selectedItem?.day ?? null;

  // Warm the extra dictionary during idle time so word clicks stay fast.
  useEffect(() => {
    preloadExtra();
  }, []);

  // Count a visit only when the reader stays on the doc for a few seconds.
  useEffect(() => {
    if (selectedDay == null || !content) return;
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
  }, [selectedDay, content]);

  // After a bottom page turn, land at the bottom of the new page.
  useEffect(() => {
    if (!content || !scrollToBottomRef.current) return;
    scrollToBottomRef.current = false;
    const timer = setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
    }, 80);
    return () => clearTimeout(timer);
  }, [content]);

  function bottomTurn(item) {
    scrollToBottomRef.current = true;
    selectItem(item);
  }

  // Close the word popover on outside tap / Escape.
  useEffect(() => {
    if (!popover) return;
    function onPointerDown(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        closePopover();
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') closePopover();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [popover, closePopover]);

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

  function handleWordClick(word, event) {
    const key = word.toLowerCase();
    const known = lookupWord(word);
    setPopover({
      display: word,
      entry: known || null,
      docMeaning: docWordMap[key] || '',
      pending: !known,
      x: event?.clientX ?? 0,
      y: event?.clientY ?? 0,
    });
    if (!known) {
      lookupWordDeep(word).then((entry) => {
        setPopover(prev => (
          prev && prev.display === word
            ? { ...prev, entry, pending: false }
            : prev
        ));
      });
    }
  }

  const markdownComponents = {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mt-9 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold text-gray-900 mt-7 mb-3">{children}</h3>,
    p: ({ children }) => (
      <p className="text-[15px] text-gray-700 leading-loose mb-6 md:text-base md:leading-8">
        {wrapTextChildren(children, handleWordClick)}
      </p>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 text-[13px] leading-loose rounded-xl p-5 overflow-x-auto mb-7 whitespace-pre-wrap break-words md:text-sm">
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
          {!navigator.onLine && (
            <p className="text-gray-400 text-sm mt-1">当前离线且文档尚未缓存，请联网后访问</p>
          )}
        </div>
      </div>
    );
  }

  const entry = popover?.entry;
  const meanings = entry?.meanings || [];
  const phrases = entry?.phrases || [];
  const popoverTop = popover
    ? popover.y + 240 > window.innerHeight
      ? Math.max(8, popover.y - 260)
      : popover.y + 12
    : 0;

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto md:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {selectedDay != null ? dayLabel(selectedDay) : 'AI 文档'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">共 {manifest.total} 天</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
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

      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 mb-4">
          本篇文档加载失败(可能离线且尚未缓存),恢复网络后重试
        </div>
      )}

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

      {derivationDisplay && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-8 shadow-sm mb-5">
          <ReactMarkdown components={markdownComponents}>
            {derivationDisplay}
          </ReactMarkdown>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-8 shadow-sm">
        {Array.from({ length: paraCount }, (_, index) => (
          <div
            key={index}
            className={`md:grid md:grid-cols-10 md:gap-6 md:items-start ${
              index < paraCount - 1 ? 'border-b border-gray-100 pb-5 mb-5' : ''
            }`}
          >
            <div className="md:col-span-6">
              <ReactMarkdown components={markdownComponents}>
                {storyParas[index] || ''}
              </ReactMarkdown>
            </div>
            {transParas[index] && (
              <div className="mt-3 md:mt-0 md:col-span-4">
                <ReactMarkdown components={markdownComponents}>
                  {cleanTranslation(transParas[index])}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <button
          onClick={() => prevItem && bottomTurn(prevItem)}
          disabled={!prevItem}
          className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          ‹ 上一篇
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {selectedDay != null ? dayLabel(selectedDay) : ''}
        </span>
        <button
          onClick={() => nextItem && bottomTurn(nextItem)}
          disabled={!nextItem}
          className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          下一篇 ›
        </button>
      </div>

      {popover && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-72 max-h-[65vh] overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-2xl"
          style={{
            left: Math.max(8, Math.min(popover.x, window.innerWidth - 296)),
            top: popoverTop,
          }}
        >
          <div className="sticky top-0 bg-white px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">{popover.display}</h3>
              <button
                onClick={() => speakText(popover.display)}
                className="w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                aria-label="播放发音"
              >
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            <button
              onClick={closePopover}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {entry?.inOutline === false && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                  非大纲
                </span>
              )}
              {entry?.rootWord && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 font-medium">
                  原词 {entry.rootWord}
                </span>
              )}
              {entry?.baseWord && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-medium">
                  原形 {entry.baseWord}
                </span>
              )}
              {entry?.frequency != null && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  词频 {entry.frequency}
                </span>
              )}
              {entry?.category && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  {entry.category}
                </span>
              )}
            </div>

            {meanings.length > 0 ? (
              <div className="space-y-2 mb-3">
                {meanings.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="shrink-0 min-w-7 text-center text-[11px] font-semibold text-white bg-blue-500 rounded px-1 py-0.5">
                      {item.type || '义'}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.translation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {popover.pending && !popover.docMeaning
                  ? '词典加载中…'
                  : entry?.meaning || popover.docMeaning || '暂无独立词条，请结合文中语境理解'}
              </p>
            )}

            {!meanings.length && popover.docMeaning && (
              <p className="text-xs text-gray-400 mb-3">文中释义：{popover.docMeaning}</p>
            )}

            {phrases.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1.5">常用搭配</h4>
                <div className="space-y-1.5">
                  {phrases.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <p className="text-[13px] font-medium text-gray-800">{item.phrase}</p>
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
