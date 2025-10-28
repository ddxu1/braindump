'use client';

import { StreamItem } from '@/types';
import { useEffect } from 'react';

interface ProcessingModeProps {
  items: StreamItem[];
  currentIndex: number;
  onKeep: () => void;
  onMoveToStack: () => void;
  onDelete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function ProcessingMode({
  items,
  currentIndex,
  onKeep,
  onMoveToStack,
  onDelete,
  onSkip,
  onClose,
}: ProcessingModeProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        onKeep();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onMoveToStack();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onDelete();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeep, onMoveToStack, onDelete, onSkip, onClose]);

  if (items.length === 0) {
    return (
      <div className="processing-mode">
        <div className="processing-modal">
          <div className="processing-header">
            <h3>Processing Complete!</h3>
            <button onClick={onClose} className="close-processing">×</button>
          </div>
          <div className="processing-item">
            <div className="processing-item-text">
              All items have been processed. Great job! 🎉
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

  // Cycle through items indefinitely
  const actualIndex = currentIndex % items.length;
  const currentItem = items[actualIndex];
  const itemAge = Math.floor((Date.now() - currentItem.createdAt) / (1000 * 60 * 60)); // hours

  return (
    <div className="processing-mode">
      <div className="processing-modal">
        <div className="processing-header">
          <h3>Process Stream</h3>
          <div className="processing-progress">
            Item {actualIndex + 1} of {items.length}
          </div>
          <button onClick={onClose} className="close-processing" title="Press Esc to close">×</button>
        </div>

        <div className="processing-item">
          <div className="processing-item-text">
            {currentItem.text}
          </div>
          <div className="processing-item-meta">
            Created {itemAge < 1 ? 'less than an hour ago' : `${itemAge} hours ago`}
            {currentItem.context && ` • Context: ${currentItem.context}`}
          </div>
        </div>

        <div className="processing-actions">
          <button onClick={onKeep} className="processing-btn keep">
            <span className="shortcut">K</span>
            Keep in Stream
          </button>
          <button onClick={onMoveToStack} className="processing-btn move">
            <span className="shortcut">M</span>
            Move to Stack
          </button>
          <button onClick={onDelete} className="processing-btn delete">
            <span className="shortcut">D</span>
            Delete
          </button>
          <button onClick={onSkip} className="processing-btn skip">
            <span className="shortcut">S</span>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
