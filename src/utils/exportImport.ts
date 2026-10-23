import { AppState, Output, StackItem } from '@/types';
import { BulletStyle, formatBullet, loadSettings } from './settings';
import { normalizeState } from './storage';

interface WorkspaceBackup {
  version: 3;
  exportedAt: string;
  state: AppState;
  drafts: {
    inputText: string;
  };
}

export interface ImportedWorkspace {
  state: AppState;
  inputText: string;
}

export const buildMarkdown = (stackItems: StackItem[], style?: BulletStyle): string => {
  const bulletStyle = style ?? loadSettings().bulletStyle;
  return stackItems.map(item => formatBullet(item.text, bulletStyle)).join('\n');
};

export const buildOutputsMarkdown = (outputs: Output[], style?: BulletStyle): string => {
  const bulletStyle = style ?? loadSettings().bulletStyle;

  return outputs
    .filter(output => output.items.length > 0)
    .map(output => [
      output.name,
      ...output.items.map(item => formatBullet(item.text, bulletStyle)),
    ].join('\n'))
    .join('\n\n');
};

const copyMarkdownToClipboard = async (markdown: string): Promise<void> => {
  await navigator.clipboard.writeText(markdown);

  const alert = document.createElement('div');
  alert.textContent = 'Copied to clipboard';
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent);
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

export const copyStackToClipboard = async (
  stackItems: StackItem[],
  style?: BulletStyle,
): Promise<void> => {
  await copyMarkdownToClipboard(buildMarkdown(stackItems, style));
};

export const copyOutputsToClipboard = async (
  outputs: Output[],
  style?: BulletStyle,
): Promise<void> => {
  await copyMarkdownToClipboard(buildOutputsMarkdown(outputs, style));
};

export const exportToJSON = (
  state: AppState,
  drafts: WorkspaceBackup['drafts'],
): void => {
  const backup: WorkspaceBackup = {
    version: 3,
    exportedAt: new Date().toISOString(),
    state,
    drafts,
  };
  const dataStr = JSON.stringify(backup, null, 2);
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

export const importFromJSON = (file: File): Promise<ImportedWorkspace> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file content');
        }

        const parsed = JSON.parse(result);
        const isWorkspaceBackup =
          parsed &&
          typeof parsed === 'object' &&
          (parsed.version === 2 || parsed.version === 3) &&
          parsed.state;
        const data = normalizeState(isWorkspaceBackup ? parsed.state : parsed);

        if (!data.streamItems || !data.outputs) {
          throw new Error('Invalid backup file structure');
        }

        let inputText = '';
        if (isWorkspaceBackup && parsed.version === 3 && typeof parsed.drafts?.inputText === 'string') {
          inputText = parsed.drafts.inputText;
        } else if (isWorkspaceBackup && parsed.version === 2) {
          const committedTexts = new Set(data.streamItems.map(item => item.text));
          const uncommittedInput = typeof parsed.drafts?.inputText === 'string'
            ? parsed.drafts.inputText
              .split('\n')
              .filter((line: string) => line.trim() && !committedTexts.has(line.trim()))
              .join('\n')
            : '';
          const additionDraft = typeof parsed.drafts?.additionText === 'string'
            ? parsed.drafts.additionText
            : '';
          inputText = [uncommittedInput, additionDraft].filter(Boolean).join('\n');
        }

        resolve({ state: data, inputText });
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
