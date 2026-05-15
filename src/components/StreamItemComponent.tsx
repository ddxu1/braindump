'use client';

import { StreamItem } from '@/types';
import { useState } from 'react';
import { CloseIcon, HelpIcon, MoreIcon, NoteIcon } from './Icons';

interface OutputTarget {
  id: string;
  name: string;
}

interface StreamItemComponentProps {
  item: StreamItem;
  selected: boolean;
  onDelete: () => void;
  onMoveToStack: (outputId: string) => void;
  onAddContext: (context: string) => void;
  onEditText: (text: string) => void;
  onSelectClick: (shiftKey: boolean) => void;
  isDuplicate?: boolean;
  duplicateOfText?: string;
  duplicateSource?: 'input' | 'output';
  onMerge?: () => void;
  outputTargets: OutputTarget[];
}

export default function StreamItemComponent({
  item,
  selected,
  onDelete,
  onMoveToStack,
  onAddContext,
  onEditText,
  onSelectClick,
  isDuplicate = false,
  duplicateOfText,
  duplicateSource,
  onMerge,
  outputTargets,
}: StreamItemComponentProps) {
  const [showContextInput, setShowContextInput] = useState(false);
  const [contextText, setContextText] = useState(item.context || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [renderedAt] = useState(() => Date.now());

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

  const isOld = renderedAt - item.createdAt > 24 * 60 * 60 * 1000;

  return (
    <div
      className={`stream-item ${isDuplicate ? 'duplicate' : ''} ${selected ? 'selected' : ''}`}
    >
      {isDuplicate && duplicateOfText && (
        <div
          className={`duplicate-indicator ${duplicateSource === 'output' ? 'output-match' : ''}`}
          aria-label={`${duplicateSource === 'output' ? 'Already in Output' : 'Duplicate of'}: ${duplicateOfText}`}
          title={duplicateSource === 'output' ? `Already in Output: ${duplicateOfText}` : undefined}
        >
          {duplicateSource === 'output' ? 'Already in Output' : 'Duplicate of'}: &ldquo;{duplicateOfText}&rdquo;
          {onMerge && (
            <button onClick={onMerge} className="merge-btn">
              Merge
            </button>
          )}
        </div>
      )}
      <div className="stream-item-body">
        <button
          type="button"
          className="select-handle"
          onClick={(e) => onSelectClick(e.shiftKey)}
          aria-label={selected ? 'Deselect input item' : 'Select input item'}
          data-tooltip="Select. Shift-click selects a range."
        >
          <span />
        </button>
        <div className="stream-item-main">
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

        <div className="item-actions">
          <div className="send-targets" aria-label="Send to output">
            {outputTargets.map(output => (
              <button
                key={output.id}
                onClick={() => onMoveToStack(output.id)}
                className="send-target-btn"
                title={`Send to ${output.name}`}
              >
                {output.name}
              </button>
            ))}
          </div>
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
      </div>
    </div>
  );
}
