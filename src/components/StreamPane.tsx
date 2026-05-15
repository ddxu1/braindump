'use client';

import { Output, StreamItem } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import StreamItemComponent from './StreamItemComponent';
import { findDuplicates, InputMatch } from '@/utils/duplicateDetection';
import { CheckIcon, TrashIcon } from './Icons';

interface StreamPaneProps {
  items: StreamItem[];
  inputText: string;
  onInputChange: (text: string) => void;
  onInputBlur: () => void;
  onDeleteItem: (id: string) => void;
  onMoveToStack: (id: string, outputId: string) => void;
  onAddContext: (id: string, context: string) => void;
  onEditItem: (id: string, text: string) => void;
  onMergeItems: (duplicateId: string, originalId: string) => void;
  onMergeAllDuplicates?: () => void;
  matches?: Map<string, InputMatch>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onMoveSelectedToOutput: (outputId: string) => void;
  outputs: Output[];
  additionText: string;
  onAdditionChange: (text: string) => void;
  onAddInputBatch: () => void;
  onStartProcessing?: () => void;
  onClearStream?: () => void;
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
  onMergeAllDuplicates,
  matches,
  selectedIds,
  onSelectionChange,
  onMoveSelectedToOutput,
  outputs,
  additionText,
  onAdditionChange,
  onAddInputBatch,
  onStartProcessing,
  onClearStream,
}: StreamPaneProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAdditionComposer, setShowAdditionComposer] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [lastShiftRangeIds, setLastShiftRangeIds] = useState<string[]>([]);

  const duplicates = useMemo(() => findDuplicates(items), [items]);
  const outputMatchCount = useMemo(
    () => Array.from(matches?.values() ?? []).filter(match => match.source === 'output').length,
    [matches]
  );
  const inputDuplicateCount = duplicates.size;

  useEffect(() => {
    if (inputText) {
      const frame = requestAnimationFrame(() => setLastSaved(new Date()));
      return () => cancelAnimationFrame(frame);
    }
  }, [inputText]);

  const unprocessedCount = items.filter(item => !item.processed).length;
  const selectedCount = selectedIds.size;
  const existingItemTexts = useMemo(() => new Set(items.map(item => item.text)), [items]);
  const draftLineCount = inputText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !existingItemTexts.has(line))
    .length;

  const handleSelectionClick = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastSelectedId) {
      if (lastShiftRangeIds.includes(id)) {
        const next = new Set(selectedIds);
        const rangeIsSelected = lastShiftRangeIds.every(rangeId => next.has(rangeId));

        if (rangeIsSelected) {
          lastShiftRangeIds.forEach(rangeId => next.delete(rangeId));
          onSelectionChange(next);
          setLastShiftRangeIds([]);
          return;
        }
      }

      const startIndex = items.findIndex(item => item.id === lastSelectedId);
      const endIndex = items.findIndex(item => item.id === id);

      if (startIndex !== -1 && endIndex !== -1) {
        const [start, end] = [startIndex, endIndex].sort((a, b) => a - b);
        const next = new Set(selectedIds);
        const range = items.slice(start, end + 1);
        const rangeIsSelected = range.every(item => next.has(item.id));

        range.forEach(item => {
          if (rangeIsSelected) {
            next.delete(item.id);
          } else {
            next.add(item.id);
          }
        });

        onSelectionChange(next);
        setLastShiftRangeIds(range.map(item => item.id));
        return;
      }
    }

    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
    setLastSelectedId(id);
    setLastShiftRangeIds([]);
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

  const handleAddMore = () => {
    onAddInputBatch();
    setShowAdditionComposer(false);
  };

  const handleItemMove = (id: string, outputId: string) => {
    if (selectedIds.size > 0) {
      onMoveSelectedToOutput(outputId);
      return;
    }

    onMoveToStack(id, outputId);
  };

  return (
    <div className="stream-pane">
      <div className="stream-header pane-header">
        <div className="pane-title-block">
          <div className="pane-title-row">
            <h2>Input</h2>
            <span className="count-pill">{items.length}</span>
          </div>
          <div className="pane-meta-row">
            {items.length > 0 && (
              <span>{unprocessedCount > 0 ? `${unprocessedCount} to process` : 'All processed'}</span>
            )}
            {selectedCount > 0 && (
              <span>{selectedCount} selected</span>
            )}
            {outputMatchCount > 0 && (
              <span className="duplicate-count">
                {outputMatchCount} already in output
              </span>
            )}
            {inputDuplicateCount > 0 && (
              <span className="duplicate-count">
                {inputDuplicateCount} duplicate{inputDuplicateCount === 1 ? '' : 's'}
              </span>
            )}
            {lastSaved && (
              <span className="save-indicator">
                <CheckIcon />
                Saved locally
              </span>
            )}
          </div>
        </div>

        <div className="stream-actions pane-actions">
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
          placeholder="Dump raw notes here. One line becomes one input item."
          autoFocus
          rows={items.length > 0 ? 4 : 8}
        />
        {draftLineCount > 0 && (
          <div className="capture-row">
            <span>{draftLineCount} new item{draftLineCount === 1 ? '' : 's'}</span>
            <button className="process-stream-btn" onClick={onInputBlur}>
              Add to Input
            </button>
          </div>
        )}
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
              onMoveToStack={(outputId) => handleItemMove(item.id, outputId)}
              onAddContext={(context) => onAddContext(item.id, context)}
              onEditText={(text) => onEditItem(item.id, text)}
              onSelectClick={(shiftKey) => handleSelectionClick(item.id, shiftKey)}
              isDuplicate={isDuplicate}
              duplicateOfText={match?.source === 'output' ? `${match.outputName}: ${match.text}` : duplicateOfItem?.text}
              duplicateSource={match?.source}
              onMerge={match?.source !== 'output' && duplicateOfId ? () => onMergeItems(item.id, duplicateOfId) : undefined}
              outputTargets={outputs}
            />
          );
        })}
      </div>

      {items.length > 0 && (
        showAdditionComposer ? (
          <div className="bottom-composer">
            <textarea
              value={additionText}
              onChange={(e) => onAdditionChange(e.target.value)}
              placeholder="Add more input..."
              rows={3}
              autoFocus
            />
            <div className="composer-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowAdditionComposer(false)}
              >
                Cancel
              </button>
              <button
                className="process-stream-btn"
                onClick={handleAddMore}
                disabled={additionText.trim() === ''}
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <div className="bottom-add-row">
            <button className="secondary-btn" onClick={() => setShowAdditionComposer(true)}>
              Add more input
            </button>
          </div>
        )
      )}
    </div>
  );
}
