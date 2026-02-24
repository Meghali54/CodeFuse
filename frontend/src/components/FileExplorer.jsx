import React, { useState } from 'react';

const FileExplorer = ({ 
  files, 
  activeFile, 
  onFileSelect, 
  onFileCreate, 
  onFileDelete, 
  onFileRename 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRenameFile = (fileId) => {
    if (renameValue.trim()) {
      onFileRename(fileId, renameValue.trim());
      setRenamingFile(null);
      setRenameValue('');
    }
  };

  const startRename = (file) => {
    setRenamingFile(file.id);
    setRenameValue(file.name);
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-700 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Files</span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
          title="New File"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto text-sm">
        {isCreating && (
          <div className="px-2 py-1 bg-zinc-800 border-b border-zinc-700">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              onBlur={handleCreateFile}
              autoFocus
              placeholder="filename.ext"
              className="w-full bg-zinc-700 text-white text-xs px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {files.map((file) => (
          <div
            key={file.id}
            className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors ${
              activeFile === file.id
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {renamingFile === file.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFile(file.id);
                  if (e.key === 'Escape') {
                    setRenamingFile(null);
                    setRenameValue('');
                  }
                }}
                onBlur={() => handleRenameFile(file.id)}
                autoFocus
                className="w-full bg-zinc-700 text-white text-xs px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <>
                <div
                  onClick={() => onFileSelect(file.id)}
                  className="flex items-center gap-2 flex-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate text-xs">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(file);
                    }}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors"
                    title="Rename"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${file.name}?`)) {
                        onFileDelete(file.id);
                      }
                    }}
                    className="p-1 hover:bg-red-500 rounded transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {files.length === 0 && !isCreating && (
          <div className="px-3 py-4 text-center text-zinc-500 text-xs">
            No files yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
