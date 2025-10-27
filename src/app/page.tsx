'use client';

import { useState, useEffect, useCallback } from 'react';
import { StreamItem, StackItem, AppState } from '@/types';
import { loadState, saveState, generateId } from '@/utils/storage';
import StreamPane from '@/components/StreamPane';
import StackPane from '@/components/StackPane';
import ThemeToggle from '@/components/ThemeToggle';
import ExportImport from '@/components/ExportImport';
import './styles.css';

export default function Home() {
  const [state, setState] = useState<AppState>({
    streamItems: [],
    stackItems: [],
    archivedItems: [],
  });
  const [inputText, setInputText] = useState('');

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
          completed: false,
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

  const handleCheckStreamItem = (id: string) => {
    setState(prev => ({
      ...prev,
      streamItems: prev.streamItems.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleDeleteStreamItem = (id: string) => {
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
      completed: false,
      order: state.stackItems.length,
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

  const handleCheckStackItem = (id: string) => {
    const stackItem = state.stackItems.find(item => item.id === id);
    if (!stackItem) return;

    if (!stackItem.completed) {
      // Moving to archive
      setState(prev => ({
        ...prev,
        stackItems: prev.stackItems.filter(item => item.id !== id),
        archivedItems: [...prev.archivedItems, { ...stackItem, completed: true }],
      }));
    }
  };

  const handleDeleteStackItem = (id: string) => {
    setState(prev => ({
      ...prev,
      stackItems: prev.stackItems.filter(item => item.id !== id),
    }));
  };

  const handleImport = (importedState: AppState) => {
    setState(importedState);
    saveState(importedState);

    // Update input text to match imported stream items
    const newInputText = importedState.streamItems.map(item => item.text).join('\n');
    setInputText(newInputText);
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
          onCheckItem={handleCheckStreamItem}
          onDeleteItem={handleDeleteStreamItem}
          onMoveToStack={handleMoveToStack}
          onAddContext={handleAddContext}
          onEditItem={handleEditStreamItem}
        />
        <StackPane
          items={state.stackItems}
          onCheckItem={handleCheckStackItem}
          onDeleteItem={handleDeleteStackItem}
          onEditItem={handleEditStackItem}
        />
      </div>
    </div>
  );
}
