'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, DEFAULT_SETTINGS, loadSettings } from '@/utils/settings';
import { StreamItem, StackItem, AppState, Output } from '@/types';
import { loadState, saveState, generateId, normalizeState } from '@/utils/storage';
import { findDuplicates, findInputMatches } from '@/utils/duplicateDetection';
import { copyStackToClipboard } from '@/utils/exportImport';
import { addTasksToTodoist } from '@/utils/todoist';
import { UndoManager, HistoryAction } from '@/utils/undo';
import StreamPane from '@/components/StreamPane';
import StackPane from '@/components/StackPane';
import ThemeToggle from '@/components/ThemeToggle';
import ExportImport from '@/components/ExportImport';
import ProcessingMode from '@/components/ProcessingMode';
import Settings from '@/components/Settings';
import { BrainIcon, CopyIcon, UndoIcon } from '@/components/Icons';
import './styles.css';

const EISENHOWER_OUTPUTS = ['Do now', 'Schedule', 'Delegate', 'Later'];

export default function Home() {
  const [state, setState] = useState<AppState>(() => normalizeState({}));
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [inputText, setInputText] = useState('');
  const [additionText, setAdditionText] = useState('');
  const [selectedInputIds, setSelectedInputIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [todoistBusy, setTodoistBusy] = useState(false);
  const undoManager = useRef(new UndoManager());

  const activeOutput = useMemo(
    () => state.outputs.find(output => output.id === state.activeOutputId) ?? state.outputs[0],
    [state.outputs, state.activeOutputId]
  );

  const inputMatches = useMemo(
    () => findInputMatches(state.streamItems, state.outputs),
    [state.streamItems, state.outputs]
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const loadedState = loadState();
      setState(loadedState);
      setSettings(loadSettings());
      setInputText(loadedState.streamItems.map(item => item.text).join('\n'));
      setIsHydrated(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timeoutId = setTimeout(() => {
      saveState(state);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state, isHydrated]);

  const saveForUndo = (type: HistoryAction['type'], description: string) => {
    undoManager.current.push({
      type,
      description,
      previousState: { ...state },
      timestamp: Date.now(),
    });
    setCanUndo(true);
  };

  const handleUndo = () => {
    const action = undoManager.current.pop();
    if (!action) return;

    setState(action.previousState);
    setUndoMessage(`Undid: ${action.description}`);
    setTimeout(() => setUndoMessage(null), 3000);
    setInputText(action.previousState.streamItems.map(item => item.text).join('\n'));
    setSelectedInputIds(new Set());
    setCanUndo(undoManager.current.canUndo());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoManager.current.canUndo()) {
          handleUndo();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        const unprocessedCount = state.streamItems.filter(item => !item.processed).length;
        if (unprocessedCount > 0 && !isProcessing) {
          setIsProcessing(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.streamItems, isProcessing]);

  const addInputBatch = useCallback((text: string, source: 'initial' | 'addition' | 'import') => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const existingTexts = new Set(state.streamItems.map(item => item.text));
    const newItems: StreamItem[] = lines
      .filter(line => !existingTexts.has(line))
      .map(line => ({
        id: generateId(),
        text: line,
        createdAt: Date.now(),
        processed: false,
        context: null,
        duplicateOf: null,
      }));

    if (newItems.length === 0) return;

    setState(prev => ({
      ...prev,
      streamItems: [...prev.streamItems, ...newItems],
      inputBatches: [
        ...prev.inputBatches,
        {
          id: generateId(),
          text,
          createdAt: Date.now(),
          itemIds: newItems.map(item => item.id),
          source,
        },
      ],
    }));
  }, [state.streamItems]);

  const handleInputBlur = () => {
    addInputBatch(inputText, state.inputBatches.length === 0 ? 'initial' : 'addition');
  };

  const handleAddInputBatch = () => {
    addInputBatch(additionText, 'addition');
    setAdditionText('');
  };

  const updateActiveOutput = (updater: (items: StackItem[]) => StackItem[]) => {
    setState(prev => ({
      ...prev,
      outputs: prev.outputs.map(output =>
        output.id === prev.activeOutputId
          ? { ...output, items: updater(output.items) }
          : output
      ),
    }));
  };

  const handleDeleteInputItem = (id: string) => {
    const itemToDelete = state.streamItems.find(item => item.id === id);
    if (itemToDelete) {
      saveForUndo('delete-stream', `Delete "${itemToDelete.text.substring(0, 30)}..."`);
    }

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => item.id !== id),
    }));
    setSelectedInputIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (itemToDelete) {
      setInputText(inputText.split('\n').filter(line => line !== itemToDelete.text).join('\n'));
    }
  };

  const handleClearInput = () => {
    if (state.streamItems.length === 0 && inputText.trim() === '') return;

    const confirmed = window.confirm(`Clear all ${state.streamItems.length} items from Input?`);
    if (!confirmed) return;

    saveForUndo('clear-stream', `Clear all ${state.streamItems.length} items from Input`);
    setState(prev => ({ ...prev, streamItems: [] }));
    setInputText('');
    setSelectedInputIds(new Set());
    setIsProcessing(false);
  };

  const moveInputItemsToOutput = (ids: Set<string>) => {
    const movingItems = state.streamItems.filter(item => ids.has(item.id));
    if (!activeOutput || movingItems.length === 0) return;

    saveForUndo('move-to-stack', `Move ${movingItems.length} item${movingItems.length === 1 ? '' : 's'} to ${activeOutput.name}`);

    const outputItems: StackItem[] = movingItems.map((streamItem, index) => ({
      id: generateId(),
      text: streamItem.text,
      context: streamItem.context,
      category: activeOutput.preset === 'category' ? activeOutput.name : null,
      priority: null,
      dueDate: null,
      order: activeOutput.items.length + index,
    }));

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => !ids.has(item.id)),
      outputs: prev.outputs.map(output =>
        output.id === prev.activeOutputId
          ? { ...output, items: [...output.items, ...outputItems] }
          : output
      ),
    }));
    setInputText(prev => prev.split('\n').filter(line => !movingItems.some(item => item.text === line)).join('\n'));
    setSelectedInputIds(new Set());
  };

  const handleMoveToOutput = (id: string) => moveInputItemsToOutput(new Set([id]));
  const handleMoveSelectedToOutput = () => moveInputItemsToOutput(selectedInputIds);

  const handleAddContext = (id: string, context: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item => item.id === id ? { ...item, context } : item),
    }));
  };

  const handleEditInputItem = (id: string, text: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item => item.id === id ? { ...item, text } : item),
    }));
    const updatedItems = state.streamItems.map(item => item.id === id ? { ...item, text } : item);
    setInputText(updatedItems.map(item => item.text).join('\n'));
  };

  const handleEditOutputItem = (id: string, text: string) => {
    updateActiveOutput(items => items.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleDeleteOutputItem = (id: string) => {
    const itemToDelete = activeOutput?.items.find(item => item.id === id);
    if (itemToDelete) {
      saveForUndo('delete-stack', `Delete "${itemToDelete.text.substring(0, 30)}..."`);
    }
    updateActiveOutput(items => items.filter(item => item.id !== id));
  };

  const handleClearActiveOutput = () => {
    if (!activeOutput || activeOutput.items.length === 0) return;
    const confirmed = window.confirm(`Clear all ${activeOutput.items.length} items from ${activeOutput.name}?`);
    if (!confirmed) return;
    saveForUndo('clear-all', `Clear ${activeOutput.name}`);
    updateActiveOutput(() => []);
  };

  const handleReorderOutput = (reorderedItems: StackItem[]) => {
    saveForUndo('reorder', `Reorder ${activeOutput?.name ?? 'Output'} items`);
    updateActiveOutput(() => reorderedItems);
  };

  const handleImport = (importedState: AppState) => {
    const normalized = normalizeState(importedState);
    setState(normalized);
    saveState(normalized);
    setInputText(normalized.streamItems.map(item => item.text).join('\n'));
    setSelectedInputIds(new Set());
  };

  const handleMergeInputItems = (duplicateId: string, originalId: string) => {
    const duplicateItem = state.streamItems.find(item => item.id === duplicateId);
    const originalItem = state.streamItems.find(item => item.id === originalId);
    if (!duplicateItem || !originalItem) return;

    saveForUndo('merge-duplicates', `Merge duplicate input`);
    const mergedContext = duplicateItem.context
      ? (originalItem.context ? `${originalItem.context}; ${duplicateItem.context}` : duplicateItem.context)
      : originalItem.context;

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems
        .filter(item => item.id !== duplicateId)
        .map(item => item.id === originalId ? { ...item, context: mergedContext } : item),
    }));
    setInputText(prev => prev.split('\n').filter(line => line !== duplicateItem.text).join('\n'));
  };

  const handleMergeAllInputDuplicates = () => {
    const duplicateMap = findDuplicates(state.streamItems);
    if (duplicateMap.size === 0) return;

    const duplicateIds = new Set(duplicateMap.keys());
    saveForUndo('merge-duplicates', `Merge ${duplicateMap.size} input duplicate${duplicateMap.size === 1 ? '' : 's'}`);
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => !duplicateIds.has(item.id)),
    }));
    setInputText(prev => prev.split('\n').filter(line => !state.streamItems.some(item => duplicateIds.has(item.id) && item.text === line)).join('\n'));
  };

  const createOutput = (name: string, preset: Output['preset'] = 'custom') => ({
    id: generateId(),
    name,
    preset,
    items: [],
  });

  const handleCreateOutput = () => {
    const name = window.prompt('Output name');
    if (!name?.trim()) return;
    const output = createOutput(name.trim());
    setState(prev => ({
      ...prev,
      outputs: [...prev.outputs, output],
      activeOutputId: output.id,
    }));
  };

  const handleCreateEisenhower = () => {
    const newOutputs = EISENHOWER_OUTPUTS.map(name => createOutput(name, 'eisenhower'));
    setState(prev => ({
      ...prev,
      outputs: [...prev.outputs, ...newOutputs],
      activeOutputId: newOutputs[0].id,
    }));
  };

  const handleCreateCategories = () => {
    const raw = window.prompt('Categories, comma-separated');
    const names = raw?.split(',').map(name => name.trim()).filter(Boolean) ?? [];
    if (names.length === 0) return;
    const newOutputs = names.map(name => createOutput(name, 'category'));
    setState(prev => ({
      ...prev,
      outputs: [...prev.outputs, ...newOutputs],
      activeOutputId: newOutputs[0].id,
    }));
  };

  const handleCopyOutput = async () => {
    if (!activeOutput || activeOutput.items.length === 0) return;
    await copyStackToClipboard(activeOutput.items);
  };

  const handleAddToTodoist = async () => {
    if (!activeOutput || activeOutput.items.length === 0) return;
    setTodoistBusy(true);
    try {
      await addTasksToTodoist(activeOutput.items, settings.todoistApiKey);
      setUndoMessage(`Added ${activeOutput.items.length} item${activeOutput.items.length === 1 ? '' : 's'} to Todoist`);
      setTimeout(() => setUndoMessage(null), 3000);
    } catch (err) {
      setUndoMessage(err instanceof Error ? err.message : 'Todoist sync failed');
      setTimeout(() => setUndoMessage(null), 5000);
    } finally {
      setTodoistBusy(false);
    }
  };

  const getUnprocessedItems = () => state.streamItems.filter(item => !item.processed);

  const handleProcessingStay = (id: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item => item.id === id ? { ...item, processed: true } : item),
    }));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="brain-icon">
              <BrainIcon size={36} />
            </span>
            <div>
              <h1>BrainDump</h1>
              <p>Input your raw notes, shape them into outputs</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="undo-btn icon-btn"
              data-tooltip={canUndo ? 'Undo (Ctrl/Cmd+Z)' : 'Nothing to undo'}
              data-tooltip-position="bottom"
              aria-label="Undo"
            >
              <UndoIcon />
            </button>
            <button
              onClick={handleCopyOutput}
              disabled={!activeOutput || activeOutput.items.length === 0}
              className="icon-btn"
              data-tooltip={!activeOutput || activeOutput.items.length === 0 ? 'Output is empty' : 'Copy Output as markdown'}
              data-tooltip-position="bottom"
              aria-label="Copy Output"
            >
              <CopyIcon />
            </button>
            <ExportImport state={state} onImport={handleImport} />
            <Settings onChange={setSettings} />
            <ThemeToggle />
          </div>
        </div>
        {undoMessage && <div className="undo-toast">{undoMessage}</div>}
      </header>

      <div className="main-layout">
        <StreamPane
          items={state.streamItems}
          batchCount={state.inputBatches.length}
          inputText={inputText}
          onInputChange={setInputText}
          onInputBlur={handleInputBlur}
          onDeleteItem={handleDeleteInputItem}
          onMoveToStack={handleMoveToOutput}
          onAddContext={handleAddContext}
          onEditItem={handleEditInputItem}
          onMergeItems={handleMergeInputItems}
          onMergeAllDuplicates={handleMergeAllInputDuplicates}
          matches={inputMatches}
          selectedIds={selectedInputIds}
          onSelectionChange={setSelectedInputIds}
          onMoveSelected={handleMoveSelectedToOutput}
          additionText={additionText}
          onAdditionChange={setAdditionText}
          onAddInputBatch={handleAddInputBatch}
          onStartProcessing={() => setIsProcessing(true)}
          onClearStream={handleClearInput}
        />
        <StackPane
          outputs={state.outputs}
          activeOutputId={state.activeOutputId}
          onSelectOutput={(id) => setState(prev => ({ ...prev, activeOutputId: id }))}
          onCreateOutput={handleCreateOutput}
          onCreateEisenhower={handleCreateEisenhower}
          onCreateCategories={handleCreateCategories}
          onDeleteItem={handleDeleteOutputItem}
          onEditItem={handleEditOutputItem}
          onClearAll={handleClearActiveOutput}
          onReorder={handleReorderOutput}
          onAddToTodoist={handleAddToTodoist}
          todoistEnabled={settings.todoistApiKey.trim() !== ''}
          todoistBusy={todoistBusy}
        />
      </div>

      {isProcessing && (
        <ProcessingMode
          items={getUnprocessedItems()}
          onKeep={handleProcessingStay}
          onMoveToStack={handleMoveToOutput}
          onDelete={handleDeleteInputItem}
          onClose={() => setIsProcessing(false)}
        />
      )}
    </div>
  );
}
