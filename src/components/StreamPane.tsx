'use client';

import { StreamItem } from '@/types';
import { useState, useEffect, useMemo, useRef } from 'react';
import StreamItemComponent from './StreamItemComponent';
import { findDuplicates, InputMatch } from '@/utils/duplicateDetection';
import { CheckIcon, TrashIcon } from './Icons';

interface StreamPaneProps {
  items: StreamItem[];
  batchCount: number;
  inputText: string;
  onInputChange: (text: string) => void;
  onInputBlur: () => void;
  onDeleteItem: (id: string) => void;
  onMoveToStack: (id: string) => void;
  onAddContext: (id: string, context: string) => void;
  onEditItem: (id: string, text: string) => void;
  onMergeItems: (duplicateId: string, originalId: string) => void;
  onMergeAllDuplicates?: () => void;
  matches?: Map<string, InputMatch>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onMoveSelected: () => void;
  additionText: string;
  onAdditionChange: (text: string) => void;
  onAddInputBatch: () => void;
  onStartProcessing?: () => void;
  onClearStream?: () => void;
}

export default function StreamPane({
  items,
  batchCount,
  inputText,
  onInputChange,
  onInputBlur,
  onDeleteItem,
  onMoveToStack,
  onAddContext,
  onEditItem,
  onMergeItems,
  onMergeAllDuplicates,
  matches,
  selectedIds,
  onSelectionChange,
  onMoveSelected,
  additionText,
  onAdditionChange,
  onAddInputBatch,
  onStartProcessing,
  onClearStream,
}: StreamPaneProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const dragSelectionRef = useRef<Set<string>>(new Set());

  const duplicates = useMemo(() => findDuplicates(items), [items]);
  const outputMatchCount = useMemo(
    () => Array.from(matches?.values() ?? []).filter(match => match.source === 'output').length,
    [matches]
  );
  const duplicateCount = duplicates.size + outputMatchCount;

  useEffect(() => {
    if (inputText) {
      const frame = requestAnimationFrame(() => setLastSaved(new Date()));
      return () => cancelAnimationFrame(frame);
    }
  }, [inputText]);

  const unprocessedCount = items.filter(item => !item.processed).length;
  const selectedCount = selectedIds.size;

  const toggleSelected = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const beginDragSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    dragSelectionRef.current = next;
    setIsSelecting(true);
    onSelectionChange(new Set(next));
  };

  const extendDragSelection = (id: string) => {
    if (!isSelecting || dragSelectionRef.current.has(id)) return;
    const next = new Set(dragSelectionRef.current);
    next.add(id);
    dragSelectionRef.current = next;
    onSelectionChange(new Set(next));
  };

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
    <div
      className="stream-pane"
      onPointerUp={() => setIsSelecting(false)}
      onPointerLeave={() => setIsSelecting(false)}
    >
      <div className="stream-header pane-header">
        <div className="pane-title-block">
          <div className="pane-title-row">
            <h2>Input</h2>
            <span className="count-pill">{items.length}</span>
          </div>
          <div className="pane-meta-row">
            <span>{unprocessedCount} unprocessed</span>
            {batchCount > 0 && (
              <span>{batchCount} batch{batchCount === 1 ? '' : 'es'} saved</span>
            )}
            {selectedCount > 0 && (
              <span>{selectedCount} selected</span>
            )}
            {duplicateCount > 0 && (
              <span className="duplicate-count">{duplicateCount} match{duplicateCount === 1 ? '' : 'es'}</span>
            )}
            {lastSaved && (
              <span className="save-indicator">
                <CheckIcon />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="stream-actions pane-actions">
          {selectedCount > 0 && (
            <button className="process-stream-btn" onClick={onMoveSelected}>
              Move {selectedCount}
            </button>
          )}
          {onMergeAllDuplicates && duplicates.size > 0 && (
            <button
              className="merge-duplicates-btn"
              onClick={onMergeAllDuplicates}
              data-tooltip={`Merge ${duplicates.size} input duplicate${duplicates.size === 1 ? '' : 's'}`}
              data-tooltip-position="bottom"
            >
              Merge input duplicates
            </button>
          )}
          {onStartProcessing && (
            <button
              className="process-stream-btn"
              onClick={onStartProcessing}
              disabled={unprocessedCount === 0}
              data-tooltip="Process Input (Cmd/Ctrl+P)"
              data-tooltip-position="bottom"
            >
              Process
            </button>
          )}
          {onClearStream && (
            <button
              className="stream-clear-btn"
              onClick={onClearStream}
              disabled={items.length === 0 && inputText.trim() === ''}
              data-tooltip={items.length === 0 && inputText.trim() === '' ? 'Input is empty' : 'Clear Input'}
              data-tooltip-position="bottom"
              aria-label="Clear Input"
            >
              <TrashIcon size={18} />
            </button>
          )}
        </div>
      </div>

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
          placeholder="Paste the first corpus here..."
          autoFocus
          rows={8}
        />
      </div>

      <div className="items-list">
        {items.length === 0 && inputText.trim() === '' ? (
          <div className="empty-state stream-empty">
            Input is clear.
          </div>
        ) : items.map((item) => {
          const match = matches?.get(item.id);
          const duplicateOfId = match?.source === 'input' ? match.id : duplicates.get(item.id);
          const isDuplicate = !!match || !!duplicateOfId;
          const duplicateOfItem = duplicateOfId ? items.find(i => i.id === duplicateOfId) : null;

          return (
            <StreamItemComponent
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onDelete={() => onDeleteItem(item.id)}
              onMoveToStack={() => onMoveToStack(item.id)}
              onAddContext={(context) => onAddContext(item.id, context)}
              onEditText={(text) => onEditItem(item.id, text)}
              onToggleSelect={() => toggleSelected(item.id)}
              onPointerSelectStart={() => beginDragSelection(item.id)}
              onPointerSelectEnter={() => extendDragSelection(item.id)}
              isDuplicate={isDuplicate}
              duplicateOfText={match?.source === 'output' ? `${match.outputName}: ${match.text}` : duplicateOfItem?.text}
              duplicateSource={match?.source}
              onMerge={match?.source !== 'output' && duplicateOfId ? () => onMergeItems(item.id, duplicateOfId) : undefined}
            />
          );
        })}
      </div>

      <div className="bottom-composer">
        <textarea
          value={additionText}
          onChange={(e) => onAdditionChange(e.target.value)}
          placeholder="Add more input at the bottom..."
          rows={3}
        />
        <button
          className="process-stream-btn"
          onClick={onAddInputBatch}
          disabled={additionText.trim() === ''}
        >
          Add input
        </button>
      </div>
    </div>
  );
}
