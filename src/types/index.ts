// Stream Item
export interface StreamItem {
  id: string;
  text: string;
  createdAt: number;
  processed: boolean;
  context: string | null;
  duplicateOf: string | null;
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
  isUrgent: boolean;
  isImportant: boolean;
}

export interface AppState {
  streamItems: StreamItem[];
  stackItems: StackItem[];
}
