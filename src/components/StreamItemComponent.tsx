'use client';

import { StreamItem } from '@/types';
import { useState } from 'react';
import { ArrowRightIcon, CloseIcon, HelpIcon, MoreIcon, NoteIcon } from './Icons';

interface StreamItemComponentProps {
  item: StreamItem;
  onDelete: () => void;
  onMoveToStack: () => void;
  onAddContext: (context: string) => void;
  onEditText: (text: string) => void;
  isDuplicate?: boolean;
  duplicateOfText?: string;
  onMerge?: () => void;
}

export default function StreamItemComponent({
  item,
  onDelete,
  onMoveToStack,
  onAddContext,
  onEditText,
  isDuplicate = false,
  duplicateOfText,
  onMerge,
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

  const isOld = Date.now() - item.createdAt > 24 * 60 * 60 * 1000;

  return (
    <div className={`stream-item ${isDuplicate ? 'duplicate' : ''}`}>
      {isDuplicate && duplicateOfText && (
        <div className="duplicate-indicator">
          Duplicate of: &ldquo;{duplicateOfText}&rdquo;
          {onMerge && (
            <button onClick={onMerge} className="merge-btn">
              Merge
            </button>
          )}
        </div>
      )}
      <div className="item-actions">
        <button
          onClick={onMoveToStack}
          data-tooltip="Move to Stack"
          aria-label="Move to Stack"
          className="action-btn move-btn"
        >
          <ArrowRightIcon />
        </button>
        <button
          onClick={onDelete}
          data-tooltip="Delete"
          aria-label="Delete"
          className="action-btn delete-btn"
        >
          <CloseIcon />
        </button>
        <button
          onClick={() => setShowContextInput(!showContextInput)}
          data-tooltip="Add context"
          aria-label="Add context"
          className="action-btn more-btn"
        >
          <MoreIcon />
        </button>
        {isOld && !item.context && (
          <span className="context-reminder" data-tooltip="Add context for clarity">
            <HelpIcon />
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
        <div className="item-context">
          <NoteIcon />
          <span>{item.context}</span>
        </div>
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
