const STORAGE_KEY_PREFIX = 'financeQuest.learningProgress.v1';
const READ_WARNING = "Saved learning progress couldn't be read. Starting fresh.";

export interface StoredLearningProgress {
  readonly completedNodeIds: readonly string[];
  readonly warningMessage: string | null;
}

export function getLearningProgressStorageKey(email: string): string {
  return `${STORAGE_KEY_PREFIX}.${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function readStoredLearningProgress(
  storageKey: string,
  validNodeIds: readonly string[],
): StoredLearningProgress {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) {
      return { completedNodeIds: [], warningMessage: null };
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return { completedNodeIds: [], warningMessage: READ_WARNING };
    }

    const storedIds = parsed.filter((id): id is string => typeof id === 'string');
    if (storedIds.length !== parsed.length) {
      return { completedNodeIds: [], warningMessage: READ_WARNING };
    }

    const completedIdSet = new Set(storedIds);
    return {
      completedNodeIds: validNodeIds.filter((id) => completedIdSet.has(id)),
      warningMessage: null,
    };
  } catch {
    return { completedNodeIds: [], warningMessage: READ_WARNING };
  }
}

export function writeStoredLearningProgress(
  storageKey: string,
  completedNodeIds: readonly string[],
): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(completedNodeIds));
    return true;
  } catch {
    return false;
  }
}
