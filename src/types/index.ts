// Stream Item
export interface StreamItem {
  id: string;
  text: string;
  createdAt: number;
  processed: boolean;
  context: string | null;
  duplicateOf: string | null;
}

export interface InputBatch {
  id: string;
  text: string;
  createdAt: number;
  itemIds: string[];
  source: 'initial' | 'addition' | 'import';
}

// Stack Item
export interface StackItem {
  id: string;
  text: string;
  context: string | null;
  category: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  dueDate: number | null;
  order: number;
}

export type OutputPreset = 'custom' | 'eisenhower' | 'category';

export interface Output {
  id: string;
  name: string;
  preset: OutputPreset;
  items: StackItem[];
}

export interface AppState {
  streamItems: StreamItem[];
  inputBatches: InputBatch[];
  outputs: Output[];
  activeOutputId: string;
}
