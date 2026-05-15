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
import { CloseIcon, CopyIcon, PlusIcon, TrashIcon } from './Icons';

interface StackPaneProps {
  outputs: Output[];
  activeOutputId: string;
  onSelectOutput: (id: string) => void;
  onCreateOutput: () => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, text: string) => void;
  onClearAll: () => void;
  onDeleteOutput: () => void;
  onCopyOutput: () => void;
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
  onDeleteItem,
  onEditItem,
  onClearAll,
  onDeleteOutput,
  onCopyOutput,
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
          {outputs.map(output => {
            const isActive = output.id === activeOutputId;

            return (
              <div
                key={output.id}
                className={`output-tab-shell ${isActive ? 'active' : ''}`}
              >
                <button
                  className="output-tab"
                  onClick={() => onSelectOutput(output.id)}
                >
                  <span>{output.name}</span>
                  <strong>{output.items.length}</strong>
                </button>
                {isActive && outputs.length > 1 && (
                  <button
                    className="output-tab-delete"
                    onClick={onDeleteOutput}
                    data-tooltip={`Delete ${output.name}`}
                    aria-label={`Delete ${output.name}`}
                  >
                    <CloseIcon size={13} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="output-tab add-output-tab"
            onClick={onCreateOutput}
            data-tooltip="New output"
            aria-label="New output"
          >
            <PlusIcon size={14} />
          </button>
        </div>

        {todoistEnabled && (
          <div className="stack-header-content">
            <div className="output-actions">
              <button
                className="preset-btn todoist-btn"
                onClick={onAddToTodoist}
                disabled={todoistBusy || items.length === 0}
              >
                {todoistBusy ? 'Sending...' : 'Todoist'}
              </button>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="output-toolbar">
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
            <div className="output-toolbar-actions">
              <button
                onClick={onCopyOutput}
                className="stack-action-btn"
                data-tooltip="Copy this output"
                data-tooltip-position="bottom"
                aria-label="Copy this output"
              >
                <CopyIcon size={18} />
              </button>
              {items.length > 1 && (
                <button
                  onClick={onClearAll}
                  className="stack-action-btn clear-all-btn"
                  data-tooltip="Clear output items"
                  data-tooltip-position="bottom"
                  aria-label="Clear output items"
                >
                  <TrashIcon size={18} />
                </button>
              )}
            </div>
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
