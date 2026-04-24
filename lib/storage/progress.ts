import type { LearningHistory, LearningSummary } from '../../src/types';

const historyStorageKey = 'textlingo-learning-history';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function readLearningHistory(): LearningHistory {
  if (typeof window === 'undefined') return { entriesByDate: {} };

  try {
    const saved = localStorage.getItem(historyStorageKey);
    return saved ? (JSON.parse(saved) as LearningHistory) : { entriesByDate: {} };
  } catch {
    return { entriesByDate: {} };
  }
}

export function writeLearningHistory(value: LearningHistory) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(historyStorageKey, JSON.stringify(value));
}

export function recordLearningActivity() {
  const history = readLearningHistory();
  const key = todayKey();

  history.entriesByDate[key] = (history.entriesByDate[key] || 0) + 1;
  history.lastActiveDate = key;
  writeLearningHistory(history);
}

export function summarizeLearningHistory(history: LearningHistory): LearningSummary {
  const today = new Date();
  const entries = history.entriesByDate ?? {};
  const totalCount = Object.values(entries).reduce((sum, count) => sum + count, 0);
  const todayCount = entries[todayKey(today)] || 0;

  let recent7DaysCount = 0;
  const heatmap: Array<{ date: string; count: number }> = [];
  for (let offset = 83; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * MS_PER_DAY);
    const key = todayKey(date);
    const count = entries[key] || 0;
    heatmap.push({ date: key, count });
    if (offset <= 6) {
      recent7DaysCount += count;
    }
  }

  let streakCount = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(today.getTime() - offset * MS_PER_DAY);
    const key = todayKey(date);
    if (entries[key]) {
      streakCount += 1;
    } else if (offset === 0) {
      continue;
    } else {
      break;
    }
  }

  if (!entries[todayKey(today)] && streakCount > 0) {
    streakCount -= 1;
  }

  return {
    totalCount,
    todayCount,
    recent7DaysCount,
    streakCount,
    heatmap,
  };
}
