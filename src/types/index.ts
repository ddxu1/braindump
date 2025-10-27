// Stream Item
export interface StreamItem {
  id: string;
  text: string;
  createdAt: number;
  processed: boolean;
  completed: boolean;
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
  completed: boolean;
  order: number;
}

export interface AppState {
  streamItems: StreamItem[];
  stackItems: StackItem[];
  archivedItems: (StreamItem | StackItem)[];
}
