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
import { Output, StackItem } from '@/types';
import StackItemComponent from './StackItemComponent';
import { CloseIcon, PlusIcon, TrashIcon } from './Icons';

interface StackPaneProps {
  outputs: Output[];
  activeOutputId: string;
  onSelectOutput: (id: string) => void;
  onCreateOutput: () => void;
  onCreateEisenhower: () => void;
  onCreateCategories: () => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, text: string) => void;
  onClearAll: () => void;
  onReorder: (items: StackItem[]) => void;
  onAddToTodoist?: () => void;
  todoistEnabled: boolean;
  todoistBusy: boolean;
}

export default function StackPane({
  outputs,
  activeOutputId,
  onSelectOutput,
  onCreateOutput,
  onCreateEisenhower,
  onCreateCategories,
  onDeleteItem,
  onEditItem,
  onClearAll,
  onReorder,
  onAddToTodoist,
  todoistEnabled,
  todoistBusy,
}: StackPaneProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const activeOutput = useMemo(
    () => outputs.find(output => output.id === activeOutputId) ?? outputs[0],
    [outputs, activeOutputId]
  );
  const items = useMemo(() => activeOutput?.items ?? [], [activeOutput]);

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
      <div className="stack-header pane-header">
        <div className="output-switcher">
          {outputs.map(output => (
            <button
              key={output.id}
              className={`output-tab ${output.id === activeOutputId ? 'active' : ''}`}
              onClick={() => onSelectOutput(output.id)}
            >
              <span>{output.name}</span>
              <strong>{output.items.length}</strong>
            </button>
          ))}
          <button className="output-tab add-output-tab" onClick={onCreateOutput} data-tooltip="New custom output">
            <PlusIcon size={14} />
          </button>
        </div>

        <div className="stack-header-content">
          <div className="pane-title-block">
            <div className="pane-title-row">
              <h2>Output</h2>
              <span className="count-pill">{items.length}</span>
            </div>
            <div className="pane-meta-row">
              <span>{filteredItems.length} visible</span>
            </div>
          </div>
          <div className="output-actions">
            <button className="preset-btn" onClick={onCreateEisenhower}>Eisenhower</button>
            <button className="preset-btn" onClick={onCreateCategories}>Categories</button>
            {todoistEnabled && (
              <button
                className="preset-btn todoist-btn"
                onClick={onAddToTodoist}
                disabled={todoistBusy || items.length === 0}
              >
                {todoistBusy ? 'Sending...' : 'Todoist'}
              </button>
            )}
            {items.length > 1 && (
              <button
                onClick={onClearAll}
                className="stack-action-btn clear-all-btn"
                data-tooltip="Clear active output"
                data-tooltip-position="bottom"
                aria-label="Clear active output"
              >
                <TrashIcon size={18} />
              </button>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search output..."
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
                No output yet. Move items from Input to get started.
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                No output items match your search.
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
