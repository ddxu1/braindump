'use client';

import { StackItem } from '@/types';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
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
      <div className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
        ⋮⋮
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
          <div className="item-context">📝 {item.context}</div>
        )}

        {item.category && (
          <div className="item-category">
            🏷️ {item.category}
          </div>
        )}

        {item.dueDate && (
          <div className="item-due-date">
            📅 {new Date(item.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        title="Delete"
        className="delete-button"
      >
        ×
      </button>

      {item.priority && (
        <div
          className="priority-indicator"
          style={{ backgroundColor: getPriorityColor(item.priority) }}
          title={`${item.priority} priority`}
        />
      )}
    </div>
  );
}
