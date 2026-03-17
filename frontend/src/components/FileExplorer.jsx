import React, { useState } from "react";

const FileExplorerNode = ({
  item,
  files,
  level,
  activeFile,
  expandedFolders,
  toggleFolder,
  onFileSelect,
  renamingItem,
  renameValue,
  setRenameValue,
  handleRename,
  startRename,
  onItemDelete,
  startCreate,
}) => {
  const children = files.filter((f) => f.parentId === item.id);
  const isExpanded = expandedFolders.has(item.id);
  const isFolder = item.type === "folder";

  return (
    <div className="w-full">
      <div
        className={`group flex items-center justify-between py-1.5 cursor-pointer transition-colors ${
          activeFile === item.id && !isFolder
            ? "bg-indigo-600 text-white"
            : "text-zinc-300 hover:bg-zinc-800"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px`, paddingRight: "8px" }}
        onClick={() => {
          if (isFolder) {
            toggleFolder(item.id);
          } else {
            onFileSelect(item.id);
          }
        }}
      >
        {renamingItem === item.id ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(item.id);
              if (e.key === "Escape") handleRename(null);
            }}
            onBlur={() => handleRename(item.id)}
            autoFocus
            className="w-full bg-zinc-700 text-white text-xs px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-indigo-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isFolder ? (
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 shrink-0 opacity-0"
                  fill="none"
                  viewBox="0 0 24 24"
                ></svg>
              )}

              {isFolder ? (
                <svg
                  className="w-3.5 h-3.5 shrink-0 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 shrink-0 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              <span className="truncate text-xs">{item.name}</span>
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isFolder && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startCreate("file", item.id);
                      toggleFolder(item.id, true);
                    }}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
                    title="New File"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startCreate("folder", item.id);
                      toggleFolder(item.id, true);
                    }}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
                    title="New Folder"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(item);
                }}
                className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400"
                title="Rename"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete ${item.name}?`))
                    onItemDelete(item.id);
                }}
                className="p-1 hover:bg-red-500 rounded transition-colors text-zinc-400 hover:text-white"
                title="Delete"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {isFolder && isExpanded && (
        <div className="w-full">
          {children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <FileExplorerNode
                key={child.id}
                item={child}
                files={files}
                level={level + 1}
                activeFile={activeFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onFileSelect={onFileSelect}
                renamingItem={renamingItem}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                handleRename={handleRename}
                startRename={startRename}
                onItemDelete={onItemDelete}
                startCreate={startCreate}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({
  files,
  activeFile,
  onFileSelect,
  onItemCreate,
  onItemDelete,
  onItemRename,
}) => {
  // Creating state: { type: 'file'|'folder', parentId: string|null }
  const [isCreating, setIsCreating] = useState(null);
  const [newItemName, setNewItemName] = useState("");

  const [renamingItem, setRenamingItem] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (folderId, forceExpand = false) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (forceExpand) next.add(folderId);
      else if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCreate = () => {
    if (newItemName.trim() && isCreating) {
      onItemCreate(newItemName.trim(), isCreating.type, isCreating.parentId);
      setNewItemName("");
      setIsCreating(null);
    } else {
      setIsCreating(null);
      setNewItemName("");
    }
  };

  const handleRename = (itemId) => {
    if (!itemId) {
      setRenamingItem(null);
      setRenameValue("");
      return;
    }
    if (renameValue.trim()) {
      onItemRename(itemId, renameValue.trim());
      setRenamingItem(null);
      setRenameValue("");
    }
  };

  const startRename = (item) => {
    setRenamingItem(item.id);
    setRenameValue(item.name);
  };

  const startCreate = (type, parentId = null) => {
    setIsCreating({ type, parentId });
    setNewItemName("");
  };

  // Root level items
  const rootItems = files
    .filter((f) => !f.parentId)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-700 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Files</span>
        <div className="flex gap-1">
          <button
            onClick={() => startCreate("file", null)}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
            title="New File"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={() => startCreate("folder", null)}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
            title="New Folder"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto text-sm py-1">
        {/* Render Root Items */}
        {rootItems.map((item) => (
          <FileExplorerNode
            key={item.id}
            item={item}
            files={files}
            level={0}
            activeFile={activeFile}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            onFileSelect={onFileSelect}
            renamingItem={renamingItem}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            handleRename={handleRename}
            startRename={startRename}
            onItemDelete={onItemDelete}
            startCreate={startCreate}
          />
        ))}

        {/* Global Create Input (always at the bottom for root items) */}
        {isCreating && isCreating.parentId === null && (
          <div
            className="px-2 py-1 flex items-center gap-1.5"
            style={{ paddingLeft: "24px" }}
          >
            {isCreating.type === "folder" ? (
              <svg
                className="w-3.5 h-3.5 shrink-0 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 shrink-0 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(null);
                  setNewItemName("");
                }
              }}
              onBlur={handleCreate}
              autoFocus
              placeholder={
                isCreating.type === "folder" ? "folder name" : "filename.ext"
              }
              className="w-full bg-zinc-700 text-white text-xs px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Create Input for Nested Items */}
        {isCreating && isCreating.parentId !== null && (
          <div
            className="px-2 py-1 flex items-center gap-1.5 mt-1"
            style={{ paddingLeft: "24px" }}
          >
            <span className="text-zinc-500 text-[10px] whitespace-nowrap">
              Create inside selected folder &rarr;
            </span>
            {isCreating.type === "folder" ? (
              <svg
                className="w-3.5 h-3.5 shrink-0 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 shrink-0 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(null);
                  setNewItemName("");
                }
              }}
              onBlur={handleCreate}
              autoFocus
              placeholder={
                isCreating.type === "folder" ? "folder name" : "filename.ext"
              }
              className="w-full bg-zinc-700 text-white text-xs px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {files.length === 0 && !isCreating && (
          <div className="px-3 py-4 text-center text-zinc-500 text-xs">
            No files yet. Use the + buttons above to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
