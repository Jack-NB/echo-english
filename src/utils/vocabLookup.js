// Word lookup: outline words stay in the main bundle (indexed once into a Map),
// the big non-outline dictionary (vocabulary-extra) is lazy-loaded on demand so
// the initial page payload stays small.
import vocabulary from '../data/vocabulary';

let outlineIndex = null;
let extraIndex = null;
let extraLoadPromise = null;

function buildOutlineIndex() {
  if (!outlineIndex) {
    outlineIndex = new Map();
    for (const entry of vocabulary) {
      const key = entry.word.toLowerCase();
      if (!outlineIndex.has(key)) outlineIndex.set(key, entry);
    }
  }
  return outlineIndex;
}

function loadExtraIndex() {
  if (extraIndex) return Promise.resolve(extraIndex);
  if (!extraLoadPromise) {
    extraLoadPromise = import('../data/vocabulary-extra')
      .then((module) => {
        extraIndex = new Map();
        for (const entry of module.default) {
          const key = entry.word.toLowerCase();
          if (!extraIndex.has(key)) extraIndex.set(key, entry);
        }
        return extraIndex;
      })
      .catch((error) => {
        extraLoadPromise = null;
        throw error;
      });
  }
  return extraLoadPromise;
}

// Synchronous lookup against the outline dictionary only.
export function lookupWord(word) {
  return buildOutlineIndex().get(word.toLowerCase()) || null;
}

// Deep lookup: outline first, then the lazy-loaded extra dictionary.
export async function lookupWordDeep(word) {
  const key = word.toLowerCase();
  const known = buildOutlineIndex().get(key);
  if (known) return known;
  try {
    return (await loadExtraIndex()).get(key) || null;
  } catch {
    return null;
  }
}

// Fetch the extra dictionary during browser idle time so the first word
// click usually hits an already-loaded index.
export function preloadExtra() {
  const schedule = typeof requestIdleCallback === 'function'
    ? (task) => requestIdleCallback(() => task())
    : (task) => setTimeout(task, 2000);
  schedule(() => {
    loadExtraIndex().catch(() => {});
  });
}
