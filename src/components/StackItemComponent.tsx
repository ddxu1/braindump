'use client';

import { StackItem } from '@/types';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarIcon, CloseIcon, GripIcon, NoteIcon, TagIcon } from './Icons';

interface StackItemComponentProps {
  item: StackItem;
  onDelete: () => void;
  onEditText: (text: string) => void;
}

export default function StackItemComponent({
  item,
  onDelete,
  onEditText,
}: StackItemComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const handleTextEdit = () => {
    if (editText.trim() !== '') {
      onEditText(editText);
    }
    setIsEditing(false);
  };
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'var(--danger)';
      case 'medium':
        return 'var(--accent)';
      case 'low':
        return 'var(--text-tertiary)';
      default:
        return 'transparent';
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div className="stack-item" ref={setNodeRef} style={style}>
      <div
        className="drag-handle"
        {...attributes}
        {...listeners}
        data-tooltip="Drag to reorder"
      >
        <GripIcon />
      </div>
      <div className="item-content">
        {isEditing ? (
          <div className="text-edit-input">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              onBlur={handleTextEdit}
              autoFocus
            />
          </div>
        ) : (
          <div className="item-text" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
            {item.text}
          </div>
        )}

        {item.context && (
          <div className="item-context">
            <NoteIcon />
            <span>{item.context}</span>
          </div>
        )}

        {item.category && (
          <div className="item-category">
            <TagIcon />
            <span>{item.category}</span>
          </div>
        )}

        {item.dueDate && (
          <div className="item-due-date">
            <CalendarIcon />
            <span>{new Date(item.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        data-tooltip="Delete"
        data-tooltip-position="left"
        aria-label="Delete"
        className="delete-button"
      >
        <CloseIcon />
      </button>

      {item.priority && (
        <div
          className="priority-indicator"
          style={{ backgroundColor: getPriorityColor(item.priority) }}
          data-tooltip={`${item.priority} priority`}
          data-tooltip-position="left"
        />
      )}
    </div>
  );
}
