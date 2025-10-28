import { AppState, StackItem } from '@/types';
import { sortByPriority } from './prioritySort';

export const exportToMarkdown = (stackItems: StackItem[]): void => {
  // Sort items by priority
  const sortedItems = sortByPriority(stackItems);

  // Generate markdown content - just the item text as a clean list
  const lines = sortedItems.map(item => `- ${item.text}`);
  const markdown = lines.join('\n');

  // Create and download the file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `braindump-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (state: AppState): void => {
  const dataStr = JSON.stringify(state, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `braindump-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file content');
        }

        const data = JSON.parse(result) as AppState;

        // Validate the structure
        if (!data.streamItems || !data.stackItems) {
          throw new Error('Invalid backup file structure');
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};
