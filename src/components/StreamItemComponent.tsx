'use client';

import { StreamItem } from '@/types';
import { useState } from 'react';

interface StreamItemComponentProps {
  item: StreamItem;
  onCheck: () => void;
  onDelete: () => void;
  onMoveToStack: () => void;
  onAddContext: (context: string) => void;
  onEditText: (text: string) => void;
}

export default function StreamItemComponent({
  item,
  onCheck,
  onDelete,
  onMoveToStack,
  onAddContext,
  onEditText,
}: StreamItemComponentProps) {
  const [showContextInput, setShowContextInput] = useState(false);
  const [contextText, setContextText] = useState(item.context || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleContextSubmit = () => {
    onAddContext(contextText);
    setShowContextInput(false);
  };

  const handleTextEdit = () => {
    if (editText.trim() !== '') {
      onEditText(editText);
    }
    setIsEditing(false);
  };

  const isOld = Date.now() - item.createdAt > 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div className={`stream-item ${item.completed ? 'completed' : ''}`}>
      <div className="item-actions">
        <button
          onClick={onCheck}
          title="Complete"
          className="action-btn check-btn"
        >
          ✓
        </button>
        <button
          onClick={onMoveToStack}
          title="Move to Stack"
          className="action-btn move-btn"
        >
          →
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="action-btn delete-btn"
        >
          ×
        </button>
        <button
          onClick={() => setShowContextInput(!showContextInput)}
          title="Add context"
          className="action-btn more-btn"
        >
          ⋮
        </button>
        {isOld && !item.context && (
          <span className="context-reminder" title="Add context for clarity">
            ?
          </span>
        )}
      </div>

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

      {item.context && !showContextInput && (
        <div className="item-context">📝 {item.context}</div>
      )}

      {showContextInput && (
        <div className="context-input">
          <input
            type="text"
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            placeholder="Add context..."
            autoFocus
          />
          <button onClick={handleContextSubmit}>Save</button>
          <button onClick={() => setShowContextInput(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
