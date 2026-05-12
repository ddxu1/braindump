import { AppState, StackItem } from '@/types';
import { BulletStyle, formatBullet, loadSettings } from './settings';
import { normalizeState } from './storage';

export const buildMarkdown = (stackItems: StackItem[], style?: BulletStyle): string => {
  const bulletStyle = style ?? loadSettings().bulletStyle;
  return stackItems.map(item => formatBullet(item.text, bulletStyle)).join('\n');
};

export const copyStackToClipboard = async (
  stackItems: StackItem[],
  style?: BulletStyle,
): Promise<void> => {
  const markdown = buildMarkdown(stackItems, style);
  await navigator.clipboard.writeText(markdown);

  const alert = document.createElement('div');
  alert.textContent = 'Copied to clipboard';
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1db954;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => document.body.removeChild(alert), 300);
  }, 2000);
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

        const data = normalizeState(JSON.parse(result));

        if (!data.streamItems || !data.outputs) {
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
