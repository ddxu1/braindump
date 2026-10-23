'use client';

import { StreamItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { EditIcon } from './Icons';

type Action = 'stayed' | 'deleted' | 'moved';

interface ProcessingModeProps {
  items: StreamItem[];
  onKeep: (id: string) => void;
  onMoveToStack: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onClose: () => void;
}

export default function ProcessingMode({
  items,
  onKeep,
  onMoveToStack,
  onDelete,
  onEdit,
  onClose,
}: ProcessingModeProps) {
  const [queue, setQueue] = useState<StreamItem[]>(() => items);
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [index, setIndex] = useState(0);
  const [openedAt] = useState(() => Date.now());
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const cancelEditRef = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const current = queue[index];
  const isComplete = !current;

  const handleStay = () => {
    if (!current) return;
    setActions(a => ({ ...a, [current.id]: 'stayed' }));
    onKeep(current.id);
    setIndex(i => i + 1);
  };

  const handleDelete = () => {
    if (!current) return;
    setActions(a => ({ ...a, [current.id]: 'deleted' }));
    onDelete(current.id);
    setIndex(i => i + 1);
  };

  const handleMove = () => {
    if (!current) return;
    setActions(a => ({ ...a, [current.id]: 'moved' }));
    onMoveToStack(current.id);
    setIndex(i => i + 1);
  };

  const startEditing = () => {
    if (!current) return;
    cancelEditRef.current = false;
    setEditText(current.text);
    setIsEditing(true);
  };

  const finishEditing = () => {
    if (!current) return;
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      setIsEditing(false);
      return;
    }

    const nextText = editText.trim();
    if (nextText && nextText !== current.text) {
      setQueue(previous => previous.map(item =>
        item.id === current.id ? { ...item, text: nextText } : item
      ));
      onEdit(current.id, nextText);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditRef.current = true;
      e.currentTarget.blur();
    }
  };

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (isComplete) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          onClose();
        }
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (k === 's') {
        e.preventDefault();
        handleStay();
      } else if (k === 'd') {
        e.preventDefault();
        handleMove();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (isComplete) {
    return (
      <div className="processing-mode">
        <div className="processing-modal" ref={modalRef} tabIndex={-1}>
          <div className="processing-header">
            <h3>Processing Complete</h3>
            <button
              onClick={onClose}
              className="close-processing"
              data-tooltip="Close (Esc)"
              data-tooltip-position="left"
              aria-label="Close"
            >×</button>
          </div>
          <div className="processing-item">
            <div className="processing-item-text">
              All {queue.length} item{queue.length === 1 ? '' : 's'} have been processed.
            </div>
          </div>
          <div className="processing-actions">
            <button onClick={onClose} className="processing-btn keep">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const prev2 = queue[index - 2] ?? null;
  const prev1 = queue[index - 1] ?? null;
  const next1 = queue[index + 1] ?? null;
  const next2 = queue[index + 2] ?? null;

  const renderPast = (item: StreamItem | null, key: string) => {
    if (!item) return <div key={key} className="deck-card empty" aria-hidden />;
    const action = actions[item.id];
    return (
      <div key={item.id} className={`deck-card past action-${action ?? 'stayed'}`}>
        {action && <span className="deck-action-tag">{action}</span>}
        <div className="deck-text">{item.text}</div>
      </div>
    );
  };

  const renderUpcoming = (item: StreamItem | null, key: string) => {
    if (!item) return <div key={key} className="deck-card empty" aria-hidden />;
    return (
      <div key={item.id} className="deck-card upcoming">
        <div className="deck-text">{item.text}</div>
      </div>
    );
  };

  const itemAge = Math.floor((openedAt - current.createdAt) / (1000 * 60 * 60));

  return (
    <div className="processing-mode">
      <div className="processing-modal" ref={modalRef} tabIndex={-1}>
        <div className="processing-header">
          <h3>Process Input</h3>
          <div className="processing-progress">
            Item {index + 1} of {queue.length}
          </div>
          <button
            onClick={onClose}
            className="close-processing"
            data-tooltip="Close (Esc)"
            data-tooltip-position="left"
            aria-label="Close"
          >×</button>
        </div>

        <div className="processing-deck">
          {renderPast(prev2, 'p2')}
          {renderPast(prev1, 'p1')}

          <div className="deck-card current">
            {isEditing ? (
              <input
                className="processing-edit-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={finishEditing}
                aria-label="Edit current input"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="deck-text processing-text-button"
                onClick={startEditing}
                aria-label="Edit current input"
              >
                {current.text}
              </button>
            )}
            <div className="deck-meta">
              <span>
                {itemAge < 1 ? 'just created' : `${itemAge}h old`}
                {current.context && ` • ${current.context}`}
              </span>
              {!isEditing && (
                <button className="processing-edit-btn" onClick={startEditing}>
                  <EditIcon size={13} />
                  Edit
                </button>
              )}
            </div>
          </div>

          {renderUpcoming(next1, 'n1')}
          {renderUpcoming(next2, 'n2')}
        </div>

        <div className="processing-actions">
          <button onClick={handleDelete} className="processing-btn delete">
            <span className="shortcut">A / ⌫</span>
            Delete
          </button>
          <button onClick={handleStay} className="processing-btn keep">
            <span className="shortcut">S</span>
            Stay
          </button>
          <button onClick={handleMove} className="processing-btn move">
            <span className="shortcut">D</span>
            Move to Output
          </button>
        </div>
      </div>
    </div>
  );
}
