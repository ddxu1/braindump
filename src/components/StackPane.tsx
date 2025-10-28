'use client';

import { StackItem } from '@/types';
import StackItemComponent from './StackItemComponent';

interface StackPaneProps {
  items: StackItem[];
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, text: string) => void;
  onClearAll: () => void;
}

export default function StackPane({
  items,
  onDeleteItem,
  onEditItem,
  onClearAll,
}: StackPaneProps) {
  return (
    <div className="stack-pane">
      <div className="stack-header">
        <div className="stack-header-content">
          <div>
            <h2>STACK</h2>
            <p className="subtitle">Organized Actions</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="clear-all-btn"
              title="Clear all items"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="stack-items">
        {items.length === 0 ? (
          <div className="empty-state">
            No items yet. Move items from Stream to get started!
          </div>
        ) : (
          items.map((item) => (
            <StackItemComponent
              key={item.id}
              item={item}
              onDelete={() => onDeleteItem(item.id)}
              onEditText={(text) => onEditItem(item.id, text)}
            />
          ))
        )}
      </div>
    </div>
  );
}
