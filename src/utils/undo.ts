import { AppState } from '@/types';

export interface HistoryAction {
  type: 'delete-stack' | 'delete-stream' | 'move-to-stack' | 'clear-all' | 'edit-stack' | 'edit-stream' | 'reorder';
  description: string;
  previousState: AppState;
  timestamp: number;
}

const MAX_HISTORY = 10;

export class UndoManager {
  private history: HistoryAction[] = [];

  push(action: HistoryAction) {
    this.history.push(action);
    // Keep only last MAX_HISTORY actions
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
  }

  pop(): HistoryAction | undefined {
    return this.history.pop();
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  getLastAction(): HistoryAction | undefined {
    return this.history[this.history.length - 1];
  }

  clear() {
    this.history = [];
  }

  getHistory(): HistoryAction[] {
    return [...this.history];
  }
}
