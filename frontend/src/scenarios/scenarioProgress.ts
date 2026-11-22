const STORAGE_KEY_PREFIX = 'financeQuest.scenarioProgress.v1';
const READ_WARNING = "Saved scenario progress couldn't be read.";

export interface StoredScenarioProgress {
  readonly completedScenarioIds: readonly number[];
  readonly warningMessage: string | null;
}

export function getScenarioProgressStorageKey(email: string): string {
  return `${STORAGE_KEY_PREFIX}.${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function readStoredScenarioProgress(
  storageKey: string,
  validScenarioIds?: readonly number[],
): StoredScenarioProgress {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) {
      return { completedScenarioIds: [], warningMessage: null };
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return { completedScenarioIds: [], warningMessage: READ_WARNING };
    }

    const storedIds = parsed.filter(
      (id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
    );
    if (storedIds.length !== parsed.length) {
      return { completedScenarioIds: [], warningMessage: READ_WARNING };
    }

    const completedIdSet = new Set(storedIds);
    return {
      completedScenarioIds: validScenarioIds
        ? validScenarioIds.filter((id) => completedIdSet.has(id))
        : [...completedIdSet],
      warningMessage: null,
    };
  } catch {
    return { completedScenarioIds: [], warningMessage: READ_WARNING };
  }
}

export function recordScenarioCompletion(storageKey: string, scenarioId: number): boolean {
  if (!Number.isSafeInteger(scenarioId) || scenarioId <= 0) {
    return false;
  }

  const progress = readStoredScenarioProgress(storageKey);
  if (progress.warningMessage || progress.completedScenarioIds.includes(scenarioId)) {
    return !progress.warningMessage;
  }

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify([...progress.completedScenarioIds, scenarioId]),
    );
    return true;
  } catch {
    return false;
  }
}
