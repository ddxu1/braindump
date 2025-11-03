import { AppState, StackItem } from '@/types';

export const exportToMarkdown = async (stackItems: StackItem[]): Promise<void> => {
  // Generate markdown content - just the item text as a clean list
  const lines = stackItems.map(item => `- [ ] ${item.text}`);
  const markdown = lines.join('\n');

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(markdown);

    // Show temporary alert
    const alert = document.createElement('div');
    alert.textContent = 'Copied to clipboard!';
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(alert);

    // Remove after 2 seconds
    setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(alert), 300);
    }, 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
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
