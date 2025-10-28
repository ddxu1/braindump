'use client';

import { StreamItem } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import StreamItemComponent from './StreamItemComponent';
import { findDuplicates } from '@/utils/duplicateDetection';

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
}: StreamPaneProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Calculate duplicates
  const duplicates = useMemo(() => findDuplicates(items), [items]);

  useEffect(() => {
    if (inputText) {
      setLastSaved(new Date());
    }
  }, [inputText]);

  const unprocessedCount = items.filter(item => !item.processed).length;

  // Handle paste event to clean up common formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    // Get the pasted text
    const pastedText = e.clipboardData.getData('text');

    // Clean up common bullet point and checkbox formats
    const cleanedText = pastedText
      .split('\n')
      .map(line => {
        // Remove common prefixes from Apple Notes, Obsidian, Notion, etc.
        let cleaned = line;

        // First, handle checkboxes (must be before simple bullets)
        cleaned = cleaned.replace(/^[\s]*[-*]\s*\[\s*[xX✓]\s*]\s*/, '');  // "- [x] " or "* [X] " (checked)
        cleaned = cleaned.replace(/^[\s]*[-*]\s*\[\s*]\s*/, '');   // "- [ ] " or "* [ ] " (unchecked)

        // Then handle simple bullets
        cleaned = cleaned.replace(/^[\s]*[-*•]\s+/, '');           // "- " or "* " or "• "

        // Handle numbered lists
        cleaned = cleaned.replace(/^[\s]*\d+\.\s+/, '');           // "1. " numbered lists

        return cleaned.trim();
      })
      .join('\n');

    // Get current cursor position
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insert cleaned text at cursor position
    const newValue =
      inputText.substring(0, start) +
      cleanedText +
      inputText.substring(end);

    onInputChange(newValue);

    // Set cursor position after pasted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + cleanedText.length;
    }, 0);
  };

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

      {onStartProcessing && (
        <button
          className="process-stream-btn"
          onClick={onStartProcessing}
          disabled={unprocessedCount === 0}
        >
          Process Stream ({unprocessedCount} items)
        </button>
      )}

      <div className="input-area">
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onBlur={onInputBlur}
          onPaste={handlePaste}
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
