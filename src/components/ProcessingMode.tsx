'use client';

import { StreamItem } from '@/types';
import { useEffect, useState } from 'react';

type Action = 'stayed' | 'deleted' | 'moved';

interface ProcessingModeProps {
  items: StreamItem[];
  onKeep: (id: string) => void;
  onMoveToStack: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function ProcessingMode({
  items,
  onKeep,
  onMoveToStack,
  onDelete,
  onClose,
}: ProcessingModeProps) {
  const [queue] = useState<StreamItem[]>(() => items);
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [index, setIndex] = useState(0);
  const [openedAt] = useState(() => Date.now());

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          onClose();
        }
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'w') {
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
        <div className="processing-modal">
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
      <div className="processing-modal">
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
            <div className="deck-text">{current.text}</div>
            <div className="deck-meta">
              {itemAge < 1 ? 'just created' : `${itemAge}h old`}
              {current.context && ` • ${current.context}`}
            </div>
          </div>

          {renderUpcoming(next1, 'n1')}
          {renderUpcoming(next2, 'n2')}
        </div>

        <div className="processing-actions">
          <button onClick={handleDelete} className="processing-btn delete">
            <span className="shortcut">W</span>
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
