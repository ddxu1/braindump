'use client';

import { StackItem } from '@/types';
import StackItemComponent from './StackItemComponent';

interface StackPaneProps {
  items: StackItem[];
  onCheckItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, text: string) => void;
}

export default function StackPane({
  items,
  onCheckItem,
  onDeleteItem,
  onEditItem,
}: StackPaneProps) {
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

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
              onCheck={() => onCheckItem(item.id)}
              onDelete={() => onDeleteItem(item.id)}
              onEditText={(text) => onEditItem(item.id, text)}
            />
          ))
        )}
      </div>
    </div>
  );
}
