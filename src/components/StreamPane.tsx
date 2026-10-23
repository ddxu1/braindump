'use client';

import { Output, StreamItem } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import StreamItemComponent from './StreamItemComponent';
import { findDuplicates, InputMatch } from '@/utils/duplicateDetection';
import { CheckIcon, TrashIcon } from './Icons';

interface StreamPaneProps {
  items: StreamItem[];
  inputText: string;
  draftSaveFailed: boolean;
  onInputChange: (text: string) => void;
  onAddInputs: () => { addedCount: number; saved: boolean };
  onDeleteItem: (id: string) => void;
  onDeleteItems: (ids: Set<string>) => void;
  onMoveToStack: (id: string, outputId: string) => void;
  onAddContext: (id: string, context: string) => void;
  onEditItem: (id: string, text: string) => void;
  onMergeItems: (duplicateId: string, originalId: string) => void;
  onMergeAllDuplicates?: () => void;
  onRemoveOutputMatches?: () => void;
  matches?: Map<string, InputMatch>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onMoveSelectedToOutput: (outputId: string) => void;
  outputs: Output[];
  onStartProcessing?: () => void;
  onClearStream?: () => void;
}

export default function StreamPane({
  items,
  inputText,
  draftSaveFailed,
  onInputChange,
  onAddInputs,
  onDeleteItem,
  onDeleteItems,
  onMoveToStack,
  onAddContext,
  onEditItem,
  onMergeItems,
  onMergeAllDuplicates,
  onRemoveOutputMatches,
  matches,
  selectedIds,
  onSelectionChange,
  onMoveSelectedToOutput,
  outputs,
  onStartProcessing,
  onClearStream,
}: StreamPaneProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [addStatus, setAddStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [keyboardCursorId, setKeyboardCursorId] = useState<string | null>(null);
  const [lastShiftRangeIds, setLastShiftRangeIds] = useState<string[]>([]);

  const duplicates = useMemo(() => findDuplicates(items), [items]);
  const outputMatchCount = useMemo(
    () => Array.from(matches?.values() ?? []).filter(match => match.source === 'output').length,
    [matches]
  );
  const inputDuplicateCount = duplicates.size;

  useEffect(() => {
    if (items.length > 0) {
      const frame = requestAnimationFrame(() => setLastSaved(new Date()));
      return () => cancelAnimationFrame(frame);
    }
  }, [items]);

  const unprocessedCount = items.filter(item => !item.processed).length;
  const selectedCount = selectedIds.size;
  const draftLineCount = inputText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .length;

  const handleSelectionClick = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastSelectedId) {
      if (lastShiftRangeIds.includes(id)) {
        const next = new Set(selectedIds);
        const rangeIsSelected = lastShiftRangeIds.every(rangeId => next.has(rangeId));

        if (rangeIsSelected) {
          lastShiftRangeIds.forEach(rangeId => next.delete(rangeId));
          onSelectionChange(next);
          setKeyboardCursorId(id);
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
        setKeyboardCursorId(id);
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
    setKeyboardCursorId(id);
    setLastShiftRangeIds([]);
  };

  useEffect(() => {
    const handleRowKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.defaultPrevented) return;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (target && target !== document.body && !target.closest('.stream-pane')) return;
      if (document.querySelector('.processing-mode, .app-dialog-overlay, .settings-overlay')) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (items.length === 0) return;
        e.preventDefault();

        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const cursorId = [keyboardCursorId, lastSelectedId, ...Array.from(selectedIds)]
          .find(id => id && items.some(item => item.id === id));
        const cursorIndex = cursorId ? items.findIndex(item => item.id === cursorId) : -1;
        const nextIndex = cursorIndex === -1
          ? (direction === 1 ? 0 : items.length - 1)
          : Math.max(0, Math.min(items.length - 1, cursorIndex + direction));
        const nextId = items[nextIndex].id;

        if (e.shiftKey) {
          const anchorId = lastSelectedId && items.some(item => item.id === lastSelectedId)
            ? lastSelectedId
            : (cursorId ?? nextId);
          const anchorIndex = Math.max(0, items.findIndex(item => item.id === anchorId));
          const [start, end] = [anchorIndex, nextIndex].sort((a, b) => a - b);
          onSelectionChange(new Set(items.slice(start, end + 1).map(item => item.id)));
          if (!lastSelectedId || !items.some(item => item.id === lastSelectedId)) {
            setLastSelectedId(anchorId);
          }
        } else {
          onSelectionChange(new Set([nextId]));
          setLastSelectedId(nextId);
        }

        setKeyboardCursorId(nextId);
        requestAnimationFrame(() => {
          const row = Array.from(document.querySelectorAll<HTMLElement>('[data-input-id]'))
            .find(element => element.dataset.inputId === nextId);
          row?.focus({ preventScroll: true });
          row?.scrollIntoView({ block: 'nearest' });
        });
        return;
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 0) {
        e.preventDefault();
        const idsToDelete = new Set(selectedIds);
        const firstDeletedIndex = items.findIndex(item => idsToDelete.has(item.id));
        const remainingItems = items.filter(item => !idsToDelete.has(item.id));
        const nextItem = remainingItems[Math.min(
          Math.max(firstDeletedIndex, 0),
          Math.max(remainingItems.length - 1, 0)
        )];

        onDeleteItems(idsToDelete);
        const nextSelection = nextItem ? new Set([nextItem.id]) : new Set<string>();
        onSelectionChange(nextSelection);
        setLastSelectedId(nextItem?.id ?? null);
        setKeyboardCursorId(nextItem?.id ?? null);
        setLastShiftRangeIds([]);
      }
    };

    window.addEventListener('keydown', handleRowKeyDown);
    return () => window.removeEventListener('keydown', handleRowKeyDown);
  }, [items, keyboardCursorId, lastSelectedId, onDeleteItems, onSelectionChange, selectedIds]);

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

  const handleCommitInputs = () => {
    const { addedCount, saved } = onAddInputs();
    setAddStatus({
      message: !saved
        ? 'Could not save inputs. Your draft is still here.'
        : addedCount > 0
          ? `${addedCount} input${addedCount === 1 ? '' : 's'} added below`
          : 'No new inputs added',
      isError: !saved,
    });
  };

  const handleDraftChange = (text: string) => {
    setAddStatus(null);
    onInputChange(text);
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
          {onRemoveOutputMatches && outputMatchCount > 0 && (
            <button
              className="resolve-matches-btn"
              onClick={onRemoveOutputMatches}
              data-tooltip="Keep the output copies and remove these from Input"
              data-tooltip-position="bottom"
            >
              Remove {outputMatchCount} already in output
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
          onChange={(e) => handleDraftChange(e.target.value)}
          onPaste={handlePaste}
          placeholder="Type or paste inputs here. Press Enter for a new line."
          autoFocus
          rows={items.length > 0 ? 4 : 8}
        />
        {draftLineCount > 0 && (
          <div className="capture-row">
            <span>{draftLineCount} line{draftLineCount === 1 ? '' : 's'} ready</span>
            <button className="process-stream-btn" onClick={handleCommitInputs}>
              Add inputs
            </button>
          </div>
        )}
        {addStatus && (
          <div className={`input-add-status ${addStatus.isError ? 'error' : ''}`} role="status">
            {!addStatus.isError && <CheckIcon />}
            {addStatus.message}
          </div>
        )}
        {draftSaveFailed && !addStatus?.isError && (
          <div className="input-add-status error" role="alert">
            Draft is not saved locally. Keep this tab open or export your workspace.
          </div>
        )}
      </div>

      <div className="items-list">
        {items.length === 0 ? (
          <div className="empty-state stream-empty">
            {inputText.trim() === '' ? 'Input is clear.' : 'Draft ready — click Add inputs to create rows.'}
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

    </div>
  );
}
