'use client';

import { StackItem } from '@/types';
import { useState } from 'react';

interface StackItemComponentProps {
  item: StackItem;
  onCheck: () => void;
  onDelete: () => void;
  onEditText: (text: string) => void;
}

export default function StackItemComponent({
  item,
  onCheck,
  onDelete,
  onEditText,
}: StackItemComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

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

  return (
    <div className={`stack-item ${item.completed ? 'completed' : ''}`}>
      <div className="item-checkbox">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={onCheck}
        />
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

      {item.priority && (
        <div
          className="priority-indicator"
          style={{ backgroundColor: getPriorityColor(item.priority) }}
          title={`${item.priority} priority`}
        />
      )}

      <button
        onClick={onDelete}
        title="Delete"
        className="delete-btn"
      >
        ×
      </button>
    </div>
  );
}
