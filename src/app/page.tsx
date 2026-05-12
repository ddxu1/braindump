'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StreamItem, StackItem, AppState } from '@/types';
import { loadState, saveState, generateId } from '@/utils/storage';
import { loadSettings } from '@/utils/settings';
import { cleanupWithGrok } from '@/utils/grok';
import { copyStackToClipboard } from '@/utils/exportImport';
import { UndoManager, HistoryAction } from '@/utils/undo';
import StreamPane from '@/components/StreamPane';
import StackPane from '@/components/StackPane';
import ThemeToggle from '@/components/ThemeToggle';
import ExportImport from '@/components/ExportImport';
import ProcessingMode from '@/components/ProcessingMode';
import Settings from '@/components/Settings';
import { BrainIcon, CopyIcon, UndoIcon } from '@/components/Icons';
import './styles.css';

export default function Home() {
  const [state, setState] = useState<AppState>({
    streamItems: [],
    stackItems: [],
  });
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [aiEditing, setAiEditing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const undoManager = useRef(new UndoManager());
  const canUndo = undoManager.current.canUndo();

  useEffect(() => {
    const loadedState = loadState();
    setState(loadedState);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveState(state);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state]);

  const saveForUndo = (type: HistoryAction['type'], description: string) => {
    undoManager.current.push({
      type,
      description,
      previousState: { ...state },
      timestamp: Date.now(),
    });
  };

  const handleUndo = () => {
    const action = undoManager.current.pop();
    if (action) {
      setState(action.previousState);
      setUndoMessage(`Undid: ${action.description}`);
      setTimeout(() => setUndoMessage(null), 3000);

      const newInputText = action.previousState.streamItems.map(item => item.text).join('\n');
      setInputText(newInputText);
    }
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
          handleStartProcessing();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.streamItems, isProcessing]);

  const syncInputToItems = useCallback((text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const existingTexts = state.streamItems.map(item => item.text);

    const newItems: StreamItem[] = [];
    lines.forEach(line => {
      if (!existingTexts.includes(line)) {
        newItems.push({
          id: generateId(),
          text: line,
          createdAt: Date.now(),
          processed: false,
          context: null,
          duplicateOf: null,
        });
      }
    });

    if (newItems.length > 0) {
      setState(prev => ({
        ...prev,
        streamItems: [...prev.streamItems, ...newItems],
      }));
    }
  }, [state.streamItems]);

  const handleInputChange = (text: string) => {
    setInputText(text);
  };

  const handleInputBlur = () => {
    syncInputToItems(inputText);
  };

  const handleDeleteStreamItem = (id: string) => {
    const itemToDelete = state.streamItems.find(item => item.id === id);
    if (itemToDelete) {
      saveForUndo('delete-stream', `Delete "${itemToDelete.text.substring(0, 30)}..."`);
    }

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => item.id !== id),
    }));

    if (itemToDelete) {
      const newText = inputText
        .split('\n')
        .filter(line => line !== itemToDelete.text)
        .join('\n');
      setInputText(newText);
    }
  };

  const handleMoveToStack = (id: string) => {
    const streamItem = state.streamItems.find(item => item.id === id);
    if (!streamItem) return;

    saveForUndo('move-to-stack', `Move "${streamItem.text.substring(0, 30)}..." to Stack`);

    const stackItem: StackItem = {
      id: generateId(),
      text: streamItem.text,
      context: streamItem.context,
      category: null,
      priority: null,
      dueDate: null,
      order: state.stackItems.length,
    };

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => item.id !== id),
      stackItems: [...prev.stackItems, stackItem],
    }));

    const newText = inputText
      .split('\n')
      .filter(line => line !== streamItem.text)
      .join('\n');
    setInputText(newText);
  };

  const handleAddContext = (id: string, context: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item =>
        item.id === id ? { ...item, context } : item
      ),
    }));
  };

  const handleEditStreamItem = (id: string, text: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item =>
        item.id === id ? { ...item, text } : item
      ),
    }));

    const updatedItems = state.streamItems.map(item =>
      item.id === id ? { ...item, text } : item
    );
    const newInputText = updatedItems.map(item => item.text).join('\n');
    setInputText(newInputText);
  };

  const handleEditStackItem = (id: string, text: string) => {
    setState(prev => ({
      ...prev,
      stackItems: prev.stackItems.map(item =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  const handleDeleteStackItem = (id: string) => {
    const itemToDelete = state.stackItems.find(item => item.id === id);
    if (itemToDelete) {
      saveForUndo('delete-stack', `Delete "${itemToDelete.text.substring(0, 30)}..."`);
    }

    setState(prev => ({
      ...prev,
      stackItems: prev.stackItems.filter(item => item.id !== id),
    }));
  };

  const handleClearAllStack = () => {
    if (state.stackItems.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to clear all ${state.stackItems.length} items from the Stack?`);
    if (confirmed) {
      saveForUndo('clear-all', `Clear all ${state.stackItems.length} items from Stack`);
      setState(prev => ({
        ...prev,
        stackItems: [],
      }));
    }
  };

  const handleReorderStack = (reorderedItems: StackItem[]) => {
    saveForUndo('reorder', 'Reorder Stack items');
    setState(prev => ({
      ...prev,
      stackItems: reorderedItems,
    }));
  };

  const handleImport = (importedState: AppState) => {
    setState(importedState);
    saveState(importedState);

    const newInputText = importedState.streamItems.map(item => item.text).join('\n');
    setInputText(newInputText);
  };

  const handleMergeItems = (duplicateId: string, originalId: string) => {
    setState(prev => {
      const duplicateItem = prev.streamItems.find(item => item.id === duplicateId);
      const originalItem = prev.streamItems.find(item => item.id === originalId);

      if (!duplicateItem || !originalItem) return prev;

      const mergedContext = duplicateItem.context
        ? (originalItem.context ? `${originalItem.context}; ${duplicateItem.context}` : duplicateItem.context)
        : originalItem.context;

      return {
        ...prev,
        streamItems: prev.streamItems
          .filter(item => item.id !== duplicateId)
          .map(item =>
            item.id === originalId
              ? { ...item, context: mergedContext }
              : item
          ),
      };
    });

    const itemToDelete = state.streamItems.find(item => item.id === duplicateId);
    if (itemToDelete) {
      const newText = inputText
        .split('\n')
        .filter(line => line !== itemToDelete.text)
        .join('\n');
      setInputText(newText);
    }
  };

  const handleAIEdit = async () => {
    setAiError(null);
    setAiMessage(null);

    const settings = loadSettings();
    if (!settings.grokApiKey) {
      setAiError('Add your Grok API key in Settings first.');
      setTimeout(() => setAiError(null), 4000);
      return;
    }
    if (state.streamItems.length === 0) return;

    setAiEditing(true);
    try {
      const result = await cleanupWithGrok(
        state.streamItems.map(item => ({
          id: item.id,
          text: item.text,
          context: item.context,
        })),
        settings.grokApiKey,
        settings.grokModel,
      );

      saveForUndo('edit-stream', 'AI cleanup');

      const cleanMap = new Map(result.items.map(i => [i.originalId, i.cleanedText]));
      const dupToPrimary = new Map<string, string>();
      for (const group of result.duplicateGroups) {
        for (const dupId of group.duplicateIds) {
          dupToPrimary.set(dupId, group.primaryId);
        }
      }

      let renamed = 0;
      let removed = 0;

      setState(prev => {
        const updatedItems = prev.streamItems
          .map(item => {
            const cleaned = cleanMap.get(item.id);
            if (cleaned !== undefined && cleaned !== item.text) {
              renamed += 1;
              return { ...item, text: cleaned, duplicateOf: dupToPrimary.get(item.id) ?? null };
            }
            return { ...item, duplicateOf: dupToPrimary.get(item.id) ?? null };
          })
          .filter(item => {
            const isDup = dupToPrimary.has(item.id);
            if (isDup) removed += 1;
            return !isDup;
          });

        const newInputText = updatedItems.map(item => item.text).join('\n');
        setInputText(newInputText);

        return { ...prev, streamItems: updatedItems };
      });

      const parts: string[] = [];
      if (renamed > 0) parts.push(`${renamed} cleaned`);
      if (removed > 0) parts.push(`${removed} duplicate${removed === 1 ? '' : 's'} merged`);
      setAiMessage(parts.length ? `AI edit: ${parts.join(', ')}` : 'AI edit: no changes needed');
      setTimeout(() => setAiMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setAiError(err instanceof Error ? err.message : 'AI edit failed');
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiEditing(false);
    }
  };

  const handleCopyStack = async () => {
    if (state.stackItems.length === 0) return;
    try {
      await copyStackToClipboard(state.stackItems);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartProcessing = () => {
    setIsProcessing(true);
  };

  const handleCloseProcessing = () => {
    setIsProcessing(false);
  };

  const getUnprocessedItems = () => {
    return state.streamItems.filter(item => !item.processed);
  };

  const handleProcessingStay = (id: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item =>
        item.id === id ? { ...item, processed: true } : item
      ),
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
              <p>Stream your thoughts, stack your actions</p>
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
              onClick={handleCopyStack}
              disabled={state.stackItems.length === 0}
              className="icon-btn"
              data-tooltip={state.stackItems.length === 0 ? 'Stack is empty' : 'Copy Stack as markdown'}
              data-tooltip-position="bottom"
              aria-label="Copy Stack"
            >
              <CopyIcon />
            </button>
            <ExportImport state={state} onImport={handleImport} />
            <Settings />
            <ThemeToggle />
          </div>
        </div>
        {undoMessage && (
          <div className="undo-toast">
            {undoMessage}
          </div>
        )}
      </header>

      <div className="main-layout">
        <StreamPane
          items={state.streamItems}
          inputText={inputText}
          onInputChange={handleInputChange}
          onInputBlur={handleInputBlur}
          onDeleteItem={handleDeleteStreamItem}
          onMoveToStack={handleMoveToStack}
          onAddContext={handleAddContext}
          onEditItem={handleEditStreamItem}
          onMergeItems={handleMergeItems}
          onStartProcessing={handleStartProcessing}
          onAIEdit={handleAIEdit}
          aiEditing={aiEditing}
          aiMessage={aiMessage}
          aiError={aiError}
        />
        <StackPane
          items={state.stackItems}
          onDeleteItem={handleDeleteStackItem}
          onEditItem={handleEditStackItem}
          onClearAll={handleClearAllStack}
          onReorder={handleReorderStack}
        />
      </div>

      {isProcessing && (
        <ProcessingMode
          items={getUnprocessedItems()}
          onKeep={handleProcessingStay}
          onMoveToStack={handleMoveToStack}
          onDelete={handleDeleteStreamItem}
          onClose={handleCloseProcessing}
        />
      )}
    </div>
  );
}
