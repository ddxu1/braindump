'use client';

import { useState, useEffect, useCallback } from 'react';
import { StreamItem, StackItem, AppState } from '@/types';
import { loadState, saveState, generateId } from '@/utils/storage';
import { playDeleteSound } from '@/utils/sound';
import StreamPane from '@/components/StreamPane';
import StackPane from '@/components/StackPane';
import ThemeToggle from '@/components/ThemeToggle';
import ExportImport from '@/components/ExportImport';
import ProcessingMode from '@/components/ProcessingMode';
import './styles.css';

export default function Home() {
  const [state, setState] = useState<AppState>({
    streamItems: [],
    stackItems: [],
  });
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadedState = loadState();
    setState(loadedState);
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveState(state);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + P to start processing mode
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

  // Convert input text to stream items
  const syncInputToItems = useCallback((text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const existingTexts = state.streamItems.map(item => item.text);

    // Add new items for new lines
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
    playDeleteSound();

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => item.id !== id),
    }));

    // Also remove from input text
    const itemToDelete = state.streamItems.find(item => item.id === id);
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

    const stackItem: StackItem = {
      id: generateId(),
      text: streamItem.text,
      context: streamItem.context,
      category: null,
      priority: null,
      dueDate: null,
      order: state.stackItems.length,
      isUrgent: false,
      isImportant: false,
    };

    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.filter(item => item.id !== id),
      stackItems: [...prev.stackItems, stackItem],
    }));

    // Remove from input text
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

    // Also update the input text
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
    playDeleteSound();

    setState(prev => ({
      ...prev,
      stackItems: prev.stackItems.filter(item => item.id !== id),
    }));
  };

  const handleToggleUrgent = (id: string) => {
    setState(prev => ({
      ...prev,
      stackItems: prev.stackItems.map(item =>
        item.id === id ? { ...item, isUrgent: !item.isUrgent } : item
      ),
    }));
  };

  const handleToggleImportant = (id: string) => {
    setState(prev => ({
      ...prev,
      stackItems: prev.stackItems.map(item =>
        item.id === id ? { ...item, isImportant: !item.isImportant } : item
      ),
    }));
  };

  const handleImport = (importedState: AppState) => {
    setState(importedState);
    saveState(importedState);

    // Update input text to match imported stream items
    const newInputText = importedState.streamItems.map(item => item.text).join('\n');
    setInputText(newInputText);
  };

  const handleMergeItems = (duplicateId: string, originalId: string) => {
    setState(prev => {
      const duplicateItem = prev.streamItems.find(item => item.id === duplicateId);
      const originalItem = prev.streamItems.find(item => item.id === originalId);

      if (!duplicateItem || !originalItem) return prev;

      // Merge context if the duplicate has any
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

    // Remove from input text
    const itemToDelete = state.streamItems.find(item => item.id === duplicateId);
    if (itemToDelete) {
      const newText = inputText
        .split('\n')
        .filter(line => line !== itemToDelete.text)
        .join('\n');
      setInputText(newText);
    }
  };

  const handleStartProcessing = () => {
    setIsProcessing(true);
    setProcessingIndex(0);
  };

  const handleCloseProcessing = () => {
    setIsProcessing(false);
    setProcessingIndex(0);
  };

  const getUnprocessedItems = () => {
    return state.streamItems.filter(item => !item.processed);
  };

  const handleProcessingKeep = () => {
    const unprocessedItems = getUnprocessedItems();
    if (unprocessedItems.length > 0) {
      const actualIndex = processingIndex % unprocessedItems.length;
      const currentItem = unprocessedItems[actualIndex];
      setState(prev => ({
        ...prev,
        streamItems: prev.streamItems.map(item =>
          item.id === currentItem.id ? { ...item, processed: true } : item
        ),
      }));
      setProcessingIndex(prev => prev + 1);
    }
  };

  const handleProcessingMoveToStack = () => {
    const unprocessedItems = getUnprocessedItems();
    if (unprocessedItems.length > 0) {
      const actualIndex = processingIndex % unprocessedItems.length;
      const currentItem = unprocessedItems[actualIndex];
      handleMoveToStack(currentItem.id);
      // Don't increment index since the item was removed
    }
  };

  const handleProcessingDelete = () => {
    const unprocessedItems = getUnprocessedItems();
    if (unprocessedItems.length > 0) {
      const actualIndex = processingIndex % unprocessedItems.length;
      const currentItem = unprocessedItems[actualIndex];
      handleDeleteStreamItem(currentItem.id);
      // Don't increment index since the item was removed
    }
  };

  const handleProcessingSkip = () => {
    setProcessingIndex(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="brain-icon">🧠</span>
            <div>
              <h1>BrainDump</h1>
              <p>Stream your thoughts, stack your actions</p>
            </div>
          </div>
          <div className="header-actions">
            <ExportImport state={state} onImport={handleImport} />
            <ThemeToggle />
          </div>
        </div>
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
        />
        <StackPane
          items={state.stackItems}
          onDeleteItem={handleDeleteStackItem}
          onEditItem={handleEditStackItem}
          onToggleUrgent={handleToggleUrgent}
          onToggleImportant={handleToggleImportant}
        />
      </div>

      {isProcessing && (
        <ProcessingMode
          items={getUnprocessedItems()}
          currentIndex={processingIndex}
          onKeep={handleProcessingKeep}
          onMoveToStack={handleProcessingMoveToStack}
          onDelete={handleProcessingDelete}
          onSkip={handleProcessingSkip}
          onClose={handleCloseProcessing}
        />
      )}
    </div>
  );
}
