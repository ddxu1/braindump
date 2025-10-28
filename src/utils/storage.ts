import { AppState, StreamItem, StackItem } from '@/types';

const STORAGE_KEY = 'braindump-app-state';

export const loadState = (): AppState => {
  if (typeof window === 'undefined') {
    return { streamItems: [], stackItems: [] };
  }

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized === null) {
      return { streamItems: [], stackItems: [] };
    }
    const data = JSON.parse(serialized);

    // Remove old fields for backwards compatibility
    if (data.archivedItems) {
      delete data.archivedItems;
    }
    if (data.collapsedSections) {
      delete data.collapsedSections;
    }

    // Remove isUrgent and isImportant from stack items
    if (data.stackItems) {
      data.stackItems = data.stackItems.map((item: any) => {
        const { isUrgent, isImportant, ...rest } = item;
        return rest;
      });
    }

    return data;
  } catch (err) {
    console.error('Failed to load state:', err);
    return { streamItems: [], stackItems: [] };
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
