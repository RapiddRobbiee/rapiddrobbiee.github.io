import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

interface SqlOutputDisplayProps {
  sql: string;
}

export const SqlOutputDisplay: React.FC<SqlOutputDisplayProps> = ({ sql }) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard
      .writeText(sql)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy SQL: ', err);
        addToast('Failed to copy SQL to clipboard.', { type: 'error' });
      });
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dokkan_patch_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!sql) {
    return (
      <div className="h-full flex flex-col items-center justify-center card text-center p-6">
        <i className="fas fa-code text-5xl text-[var(--clr-text-muted)] mb-4"></i>
        <h3 className="text-2xl font-bold text-[var(--clr-text-muted)]">No SQL Generated</h3>
        <p className="text-[var(--clr-text-muted)] mt-2 max-w-sm">
          Fill in some data in the other tabs and click the "Generate SQL Patch" button to see the
          output here.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 flex flex-col h-full">
      <div className="flex justify-end mb-4 space-x-3">
        <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-4 rounded-md">
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
        <button onClick={handleDownload} className="btn-secondary text-sm py-2 px-4 rounded-md">
          <i className="fas fa-download mr-2"></i>
          Download .sql
        </button>
      </div>
      <pre className="bg-[var(--clr-bg-main)]/70 p-4 rounded-md text-sm text-[var(--clr-text-accent)] whitespace-pre-wrap break-all overflow-auto flex-grow border border-[var(--clr-border)] font-roboto-mono shadow-inner">
        {sql}
      </pre>
    </div>
  );
};
