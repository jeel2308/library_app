import React from 'react';
import Image from 'next/image';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: { name: string }[];
  siteName?: string;
  image?: string;
}

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}

export function LinkCard({ link, onEdit, onDelete }: LinkCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Link Preview Image */}
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative w-full h-48 bg-gray-100 z-10"> {/* Added z-index to ensure image stays below header */}
          <Image
            src={link.image || '/public/placeholder.png'}
            alt={link.title || 'Link preview'}
            fill
            className="object-cover"
          />
        </div>
      </a>

      {/* Link Content */}
      <div className="p-4">
        {/* Site Info */}
        {link.siteName && (
          <div className="text-sm text-gray-600 mb-2">{link.siteName}</div>
        )}

        {/* Title */}
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block font-semibold text-blue-700 hover:text-blue-800 hover:underline mb-1"
        >
          {link.title || link.url}
        </a>

        {/* Description */}
        {link.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {link.description}
          </p>
        )}

        {/* Tags and Actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1">
            {link.tags.map(tag => (
              <span
                key={tag.name}
                className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => onEdit(link)}
                    className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="tooltip-content" sideOffset={5}>
                    Edit Link
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => onDelete(link.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="tooltip-content" sideOffset={5}>
                    Delete Link
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}