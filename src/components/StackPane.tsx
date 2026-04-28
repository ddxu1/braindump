'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { StackItem } from '@/types';
import StackItemComponent from './StackItemComponent';
import { CloseIcon, TrashIcon } from './Icons';

interface StackPaneProps {
  items: StackItem[];
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, text: string) => void;
  onClearAll: () => void;
  onReorder: (items: StackItem[]) => void;
}

export default function StackPane({
  items,
  onDeleteItem,
  onEditItem,
  onClearAll,
  onReorder,
}: StackPaneProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.text.toLowerCase().includes(query) ||
      (item.context && item.context.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      const itemsWithNewOrder = reorderedItems.map((item, index) => ({
        ...item,
        order: index,
      }));
      onReorder(itemsWithNewOrder);
    }
  };

  return (
    <div className="stack-pane">
      <div className="stack-header">
        <div className="stack-header-content">
          <div>
            <h2>STACK</h2>
          </div>
          {items.length > 1 && (
            <button
              onClick={onClearAll}
              className="stack-action-btn clear-all-btn"
              data-tooltip="Clear all items"
              data-tooltip-position="bottom"
              aria-label="Clear all items"
            >
              <TrashIcon size={18} />
            </button>
          )}
        </div>

        {items.length > 0 && (
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                data-tooltip="Clear search"
                aria-label="Clear search"
              >
                <CloseIcon size={14} />
              </button>
            )}
            {searchQuery && (
              <span className="search-count">
                Showing {filteredItems.length} of {items.length}
              </span>
            )}
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="stack-items">
            {items.length === 0 ? (
              <div className="empty-state">
                No items yet. Move items from Stream to get started.
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                No items match your search.
              </div>
            ) : (
              filteredItems.map((item) => (
                <StackItemComponent
                  key={item.id}
                  item={item}
                  onDelete={() => onDeleteItem(item.id)}
                  onEditText={(text) => onEditItem(item.id, text)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
