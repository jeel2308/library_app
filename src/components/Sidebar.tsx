import React from 'react';

interface SidebarProps {
  tags: string[];
  selectedTag: string;
  tagCounts: Record<string, number>;
  onSelectTag: (tag: string) => void;
}

export function Sidebar({ tags, selectedTag, tagCounts, onSelectTag }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
      <nav>
        <div className="space-y-1">
          <button
            onClick={() => onSelectTag('')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              !selectedTag
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Links
            <span className="ml-2 text-gray-500">({tags.reduce((acc, tag) => acc + (tagCounts[tag] || 0), 0)})</span>
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                selectedTag === tag
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tag}
              <span className="ml-2 text-gray-500">({tagCounts[tag] || 0})</span>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}