'use client';

import { StreamItem } from '@/types';
import { useState, useEffect } from 'react';
import StreamItemComponent from './StreamItemComponent';

interface StreamPaneProps {
  items: StreamItem[];
  inputText: string;
  onInputChange: (text: string) => void;
  onInputBlur: () => void;
  onCheckItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveToStack: (id: string) => void;
  onAddContext: (id: string, context: string) => void;
  onEditItem: (id: string, text: string) => void;
}

export default function StreamPane({
  items,
  inputText,
  onInputChange,
  onInputBlur,
  onCheckItem,
  onDeleteItem,
  onMoveToStack,
  onAddContext,
  onEditItem,
}: StreamPaneProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (inputText) {
      setLastSaved(new Date());
    }
  }, [inputText]);

  return (
    <div className="stream-pane">
      <div className="stream-header">
        <h2>STREAM</h2>
        <p className="subtitle">Brain Dump Zone</p>
        {lastSaved && (
          <div className="save-indicator">
            ✓ Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="input-area">
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onBlur={onInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Small delay to let the newline character be added first
              setTimeout(() => onInputBlur(), 0);
            }
          }}
          placeholder="Brain dump here... each line becomes an item (press Enter to create)"
          autoFocus
          rows={8}
        />
      </div>

      <div className="items-list">
        {items.map((item) => (
          <StreamItemComponent
            key={item.id}
            item={item}
            onCheck={() => onCheckItem(item.id)}
            onDelete={() => onDeleteItem(item.id)}
            onMoveToStack={() => onMoveToStack(item.id)}
            onAddContext={(context) => onAddContext(item.id, context)}
            onEditText={(text) => onEditItem(item.id, text)}
          />
        ))}
      </div>
    </div>
  );
}
