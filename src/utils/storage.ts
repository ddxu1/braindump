import { AppState, Output, StackItem, StreamItem } from '@/types';

const STORAGE_KEY = 'braindump-app-state';
const INPUT_DRAFT_STORAGE_KEY = 'braindump-input-draft';
const DEFAULT_OUTPUT_ID = 'output-inbox';

type LegacyStackItem = StackItem & {
  isUrgent?: boolean;
  isImportant?: boolean;
};

type StoredOutput = Partial<Output> & {
  items?: LegacyStackItem[];
};

type StoredAppState = {
  streamItems?: StreamItem[];
  inputBatches?: AppState['inputBatches'];
  outputs?: StoredOutput[];
  activeOutputId?: string;
  stackItems?: LegacyStackItem[];
  archivedItems?: unknown;
  collapsedSections?: unknown;
};

const sanitizeStackItem = (item: LegacyStackItem): StackItem => {
  const sanitized = { ...item };
  delete sanitized.isUrgent;
  delete sanitized.isImportant;
  return sanitized;
};

const buildDefaultOutput = (items: LegacyStackItem[] = []): Output => ({
  id: DEFAULT_OUTPUT_ID,
  name: 'Output',
  preset: 'custom',
  items: items.map(sanitizeStackItem),
});

export const normalizeState = (raw: unknown): AppState => {
  const data = (raw ?? {}) as StoredAppState;
  const streamItems = data.streamItems ?? [];

  const outputs = data.outputs?.length
    ? data.outputs.map((output, index) => ({
        id: output.id || `output-${index + 1}`,
        name: output.name || `Output ${index + 1}`,
        preset: output.preset || 'custom',
        items: (output.items ?? []).map(sanitizeStackItem),
      }))
    : [buildDefaultOutput(data.stackItems ?? [])];

  const activeOutputId = outputs.some(output => output.id === data.activeOutputId)
    ? data.activeOutputId!
    : outputs[0].id;

  return {
    streamItems,
    inputBatches: data.inputBatches ?? [],
    outputs,
    activeOutputId,
  };
};

export const loadState = (): AppState => {
  if (typeof window === 'undefined') {
    return normalizeState({});
  }

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized === null) {
      return normalizeState({});
    }

    return normalizeState(JSON.parse(serialized));
  } catch (err) {
    console.error('Failed to load state:', err);
    return normalizeState({});
  }
};

export const saveState = (state: AppState): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save state:', err);
    return false;
  }
};

export const loadInputDraft = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    return localStorage.getItem(INPUT_DRAFT_STORAGE_KEY) ?? '';
  } catch (err) {
    console.error('Failed to load input draft:', err);
    return '';
  }
};

export const saveInputDraft = (text: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    if (text) {
      localStorage.setItem(INPUT_DRAFT_STORAGE_KEY, text);
    } else {
      localStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
    }
    return true;
  } catch (err) {
    console.error('Failed to save input draft:', err);
    return false;
  }
};

export const commitStateAndClearDraft = (state: AppState, draft: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const previousDraft = localStorage.getItem(INPUT_DRAFT_STORAGE_KEY);

    // Free the draft's storage before expanding the committed state. If the
    // state write fails, restore the last draft that was known to be durable.
    localStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
    if (saveState(state)) return true;

    if (previousDraft === null) {
      localStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
    } else {
      localStorage.setItem(INPUT_DRAFT_STORAGE_KEY, previousDraft);
    }
    return false;
  } catch (err) {
    console.error('Failed to commit state and clear input draft:', err);
    // The current draft remains in React state even if browser storage is
    // unavailable, and the UI warns the user to keep the tab open or export.
    void draft;
    return false;
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
