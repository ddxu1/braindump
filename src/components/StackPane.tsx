'use client';

import { StackItem } from '@/types';
import StackItemComponent from './StackItemComponent';
import { sortByPriority } from '@/utils/prioritySort';

interface StackPaneProps {
  items: StackItem[];
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, text: string) => void;
  onToggleUrgent: (id: string) => void;
  onToggleImportant: (id: string) => void;
}

export default function StackPane({
  items,
  onDeleteItem,
  onEditItem,
  onToggleUrgent,
  onToggleImportant,
}: StackPaneProps) {
  const sortedItems = sortByPriority(items);

  return (
    <div className="stack-pane">
      <div className="stack-header">
        <h2>STACK</h2>
        <p className="subtitle">Organized Actions</p>
      </div>

      <div className="items-list">
        {sortedItems.length === 0 ? (
          <div className="empty-state">
            No items yet. Move items from Stream to get started!
          </div>
        ) : (
          sortedItems.map((item) => (
            <StackItemComponent
              key={item.id}
              item={item}
              onDelete={() => onDeleteItem(item.id)}
              onEditText={(text) => onEditItem(item.id, text)}
              onToggleUrgent={() => onToggleUrgent(item.id)}
              onToggleImportant={() => onToggleImportant(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
