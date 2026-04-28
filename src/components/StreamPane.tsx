'use client';

import { StreamItem } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import StreamItemComponent from './StreamItemComponent';
import { findDuplicates } from '@/utils/duplicateDetection';
import { CheckIcon, SparkleIcon } from './Icons';

interface StreamPaneProps {
  items: StreamItem[];
  inputText: string;
  onInputChange: (text: string) => void;
  onInputBlur: () => void;
  onDeleteItem: (id: string) => void;
  onMoveToStack: (id: string) => void;
  onAddContext: (id: string, context: string) => void;
  onEditItem: (id: string, text: string) => void;
  onMergeItems: (duplicateId: string, originalId: string) => void;
  onStartProcessing?: () => void;
  onAIEdit?: () => void;
  aiEditing?: boolean;
  aiMessage?: string | null;
  aiError?: string | null;
}

export default function StreamPane({
  items,
  inputText,
  onInputChange,
  onInputBlur,
  onDeleteItem,
  onMoveToStack,
  onAddContext,
  onEditItem,
  onMergeItems,
  onStartProcessing,
  onAIEdit,
  aiEditing = false,
  aiMessage,
  aiError,
}: StreamPaneProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const duplicates = useMemo(() => findDuplicates(items), [items]);

  useEffect(() => {
    if (inputText) {
      setLastSaved(new Date());
    }
  }, [inputText]);

  const unprocessedCount = items.filter(item => !item.processed).length;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const pastedText = e.clipboardData.getData('text');

    const cleanedText = pastedText
      .split('\n')
      .map(line => {
        let cleaned = line;

        cleaned = cleaned.replace(/^[\s]*[-*]\s*\[\s*[xX✓]\s*]\s*/, '');
        cleaned = cleaned.replace(/^[\s]*[-*]\s*\[\s*]\s*/, '');

        cleaned = cleaned.replace(/^[\s]*[-*•]\s+/, '');

        cleaned = cleaned.replace(/^[\s]*\d+\.\s+/, '');

        return cleaned.trim();
      })
      .join('\n');

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue =
      inputText.substring(0, start) +
      cleanedText +
      inputText.substring(end);

    onInputChange(newValue);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + cleanedText.length;
    }, 0);
  };

  return (
    <div className="stream-pane">
      <div className="stream-header">
        <h2>STREAM</h2>
        {lastSaved && (
          <div className="save-indicator">
            <CheckIcon />
            <span>Saved {lastSaved.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="stream-actions">
        {onStartProcessing && (
          <button
            className="process-stream-btn"
            onClick={onStartProcessing}
            disabled={unprocessedCount === 0}
            data-tooltip="Step through items one at a time (Cmd/Ctrl+P)"
            data-tooltip-position="bottom"
          >
            Process Stream ({unprocessedCount} items)
          </button>
        )}
        {onAIEdit && (
          <button
            className="ai-edit-btn"
            onClick={onAIEdit}
            disabled={aiEditing || items.length === 0}
            data-tooltip={aiEditing ? 'AI editing…' : 'AI Edit — clean up notes and find duplicates'}
            data-tooltip-position="bottom"
            aria-label="AI Edit"
          >
            <SparkleIcon size={18} />
          </button>
        )}
      </div>

      {aiError && <div className="message error-message inline">{aiError}</div>}
      {aiMessage && <div className="message success-message inline">{aiMessage}</div>}

      <div className="input-area">
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onBlur={onInputBlur}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setTimeout(() => onInputBlur(), 0);
            }
          }}
          placeholder="Brain dump here... each line becomes an item (press Enter to create)"
          autoFocus
          rows={8}
        />
      </div>

      <div className="items-list">
        {items.map((item) => {
          const duplicateOfId = duplicates.get(item.id);
          const isDuplicate = !!duplicateOfId;
          const duplicateOfItem = isDuplicate ? items.find(i => i.id === duplicateOfId) : null;

          return (
            <StreamItemComponent
              key={item.id}
              item={item}
              onDelete={() => onDeleteItem(item.id)}
              onMoveToStack={() => onMoveToStack(item.id)}
              onAddContext={(context) => onAddContext(item.id, context)}
              onEditText={(text) => onEditItem(item.id, text)}
              isDuplicate={isDuplicate}
              duplicateOfText={duplicateOfItem?.text}
              onMerge={isDuplicate && duplicateOfId ? () => onMergeItems(item.id, duplicateOfId) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
