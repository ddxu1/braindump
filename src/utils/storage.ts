import { AppState, Output, StackItem, StreamItem } from '@/types';

const STORAGE_KEY = 'braindump-app-state';
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

export const saveState = (state: AppState): void => {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save state:', err);
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
