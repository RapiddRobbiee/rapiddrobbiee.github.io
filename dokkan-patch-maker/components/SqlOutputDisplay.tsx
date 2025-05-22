
import React, { useState } from 'react';

interface SqlOutputDisplayProps {
  sql: string;
}

export const SqlOutputDisplay: React.FC<SqlOutputDisplayProps> = ({ sql }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy SQL: ', err);
      alert('Failed to copy SQL to clipboard.');
    });
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dokkan_patch_${new Date().toISOString().slice(0,10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!sql) {
    return <p className="text-center text-indigo-300 italic font-rajdhani text-lg">No SQL generated yet. Fill in some data and click "Generate SQL Patch".</p>;
  }

  return (
    <div className="bg-indigo-800 bg-opacity-30 p-4 rounded-lg shadow-inner border border-indigo-700">
      <div className="flex justify-end mb-4 space-x-3">
        <button
          onClick={handleCopy}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
        <button
          onClick={handleDownload}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <i className="fas fa-download mr-2"></i>
          Download .sql
        </button>
      </div>
      <pre className="bg-gray-900 bg-opacity-75 p-4 rounded-md text-sm text-indigo-200 whitespace-pre-wrap break-all overflow-x-auto h-96 max-h-[70vh] border border-indigo-600 font-roboto-mono shadow-inner">
        {sql}
      </pre>
    </div>
  );
};