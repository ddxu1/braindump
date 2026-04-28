'use client';

import { AppState } from '@/types';
import { exportToJSON, importFromJSON } from '@/utils/exportImport';
import { useRef, useState } from 'react';
import { DownloadIcon, UploadIcon } from './Icons';

interface ExportImportProps {
  state: AppState;
  onImport: (state: AppState) => void;
}

export default function ExportImport({ state, onImport }: ExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = () => {
    try {
      exportToJSON(state);
      setSuccess('Backup exported');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export backup');
      console.error(err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedState = await importFromJSON(file);
      onImport(importedState);
      setSuccess('Backup imported');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to import backup. Please check the file format.');
      console.error(err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="export-import">
      <button
        onClick={handleExport}
        className="export-btn icon-btn"
        data-tooltip="Download backup (JSON)"
        data-tooltip-position="bottom"
        aria-label="Download backup"
      >
        <DownloadIcon />
      </button>
      <button
        onClick={handleImportClick}
        className="import-btn icon-btn"
        data-tooltip="Import backup (JSON)"
        data-tooltip-position="bottom"
        aria-label="Import backup"
      >
        <UploadIcon />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {error && <div className="message error-message">{error}</div>}
      {success && <div className="message success-message">{success}</div>}
    </div>
  );
}
