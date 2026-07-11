const INTERVALS = [
  0,          // stage 0: new, shown immediately
  12 * 60 * 60 * 1000,   // stage 1: 12 hours
  24 * 60 * 60 * 1000,   // stage 2: 1 day
  3 * 24 * 60 * 60 * 1000,  // stage 3: 3 days
  7 * 24 * 60 * 60 * 1000,  // stage 4: 7 days
];

export function getInitialProgress(wordId) {
  return {
    wordId,
    stage: 0,
    nextReview: Date.now(),
    lastReviewed: null,
    learned: false,
    mistakes: 0,
    inErrorBook: false,
  };
}

export function advanceStage(currentStage) {
  const nextStage = Math.min(currentStage + 1, 4);
  const interval = INTERVALS[nextStage] || 7 * 24 * 60 * 60 * 1000;
  return {
    stage: nextStage,
    nextReview: Date.now() + interval,
    lastReviewed: Date.now(),
    learned: nextStage >= 4,
  };
}

export function resetStage() {
  const interval = INTERVALS[1];
  return {
    stage: 1,
    nextReview: Date.now() + interval,
    lastReviewed: Date.now(),
    learned: false,
  };
}

export function markAsMistake(progress) {
  return {
    inErrorBook: true,
    mistakes: (progress.mistakes || 0) + 1,
  };
}
