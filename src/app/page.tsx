'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Form, Field } from '@/components/Form';
import { Loader } from '@/components/Loader';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { LinkCard } from '@/components/LinkCard';

interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: { name: string }[];
  user: { name: string };
  createdAt: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface EditingLink extends Omit<Link, 'tags'> {
  tags: { name: string }[] | string;
}

export default function Home() {
  const [links, setLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [editingLink, setEditingLink] = useState<EditingLink | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    url: '',
    title: '',
    description: '',
    tags: '',
    isPublic: false,
  });
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  // Effect for auth status
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchLinks();
    }

    const handleLoginStatus = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        fetchLinks();
      } else {
        setUser(null);
        setLinks([]);
      }
    };

    window.addEventListener('auth-status-change', handleLoginStatus);
    return () => window.removeEventListener('auth-status-change', handleLoginStatus);
  }, []);

  // Effect for filtering links
  useEffect(() => {
    if (!links.length) {
      setFilteredLinks([]);
      return;
    }

    let filtered = [...links];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        link =>
          link.title.toLowerCase().includes(searchLower) ||
          link.description?.toLowerCase().includes(searchLower) ||
          link.tags.some(tag => tag.name.toLowerCase().includes(searchLower))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(link =>
        link.tags.some(tag => tag.name === selectedTag)
      );
    }

    setFilteredLinks(filtered);
  }, [links, search, selectedTag]);

  async function fetchLinks() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = selectedTag
        ? `/api/links?tag=${encodeURIComponent(selectedTag)}`
        : '/api/links';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch links');
      }

      const data = await response.json();
      setLinks(data.links);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login to create links');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newLink,
          tags: newLink.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setNewLink({
          url: '',
          title: '',
          description: '',
          tags: '',
          isPublic: false,
        });
        setIsAddModalOpen(false);
        fetchLinks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('Failed to create link',error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLink) return;

    setIsLoading(true);
    const token = localStorage.getItem('token');

    // Validate required fields
    if (!editingLink.url.trim()) {
      alert('URL is required');
      setIsLoading(false);
      return;
    }

    if (!editingLink.title.trim()) {
      alert('Title is required');
      setIsLoading(false);
      return;
    }

    if (typeof editingLink.tags === 'string' && !editingLink.tags.trim()) {
      alert('At least one tag is required');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingLink.id,
          url: editingLink.url,
          title: editingLink.title,
          description: editingLink.description,
          tags: typeof editingLink.tags === 'string'
            ? editingLink.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
            : editingLink.tags.map(t => t.name),
        }),
      });

      if (response.ok) {
        setEditingLink(null);
        fetchLinks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update link');
      }
    } catch (error) {
      console.error('Error updating link:', error);
      // Error state is already being handled in the UI
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/links?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchLinks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Failed to delete link',error);
      // Error state is already being handled in the UI
    } finally {
      setIsLoading(false);
      setDeletingLinkId(null);
    }
  }

  // Get unique tags from all links
  const uniqueTags = Array.from(new Set(
    links.flatMap(link => link.tags.map(tag => tag.name))
  )).sort();

  // Count links per tag
  const tagCounts = links.reduce((acc, link) => {
    link.tags.forEach(tag => {
      acc[tag.name] = (acc[tag.name] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const addLinkFields: Field[] = [
    { 
      name: 'url', 
      label: 'URL', 
      type: 'url', 
      required: true, 
      value: newLink.url,
      validation: {
        pattern: /^https?:\/\/.+/,
        message: 'Please enter a valid URL starting with http:// or https://'
      }
    },
    { 
      name: 'title', 
      label: 'Title', 
      required: true, 
      value: newLink.title 
    },
    { 
      name: 'description', 
      label: 'Description', 
      value: newLink.description 
    },
    { 
      name: 'tags', 
      label: 'Tags (comma-separated)', 
      required: true, 
      value: newLink.tags,
      validation: {
        pattern: /^[\w\s]+(,[\w\s]+)*$/,
        message: 'Please enter tags separated by commas'
      }
    },
  ];

  const handleAddLinkChange = (field: string, value: string) => {
    setNewLink(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Link Library
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Save, organize, and share your favorite links effortlessly. Join us today and take control of your online resources.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
              Sign Up
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300">
              Learn More
            </button>
          </div>
        </div>

        {/* Illustration */}
        <div className="mt-12">
          <Image
            src="/undraw_file-search_cbur.svg" // Corrected the path to the SVG file
            alt="Hero Illustration"
            width={400}
            height={400}
          />
        </div>

        {/* Features Section */}
        <div className="mt-16 px-8 w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Why Choose Link Library?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <Image
                src="/public/globe.svg"
                alt="Organize Links"
                width={80}
                height={80}
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Organize Your Links
              </h3>
              <p className="text-gray-600">
                Keep all your favorite links in one place and access them anytime, anywhere.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <Image
                src="/public/placeholder.png"
                alt="Share Effortlessly"
                width={80}
                height={80}
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Share Effortlessly
              </h3>
              <p className="text-gray-600">
                Share your collections with friends, family, or colleagues with just a click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <Image
                src="/public/window.svg"
                alt="Stay Organized"
                width={80}
                height={80}
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Stay Organized
              </h3>
              <p className="text-gray-600">
                Use tags and categories to keep your links neatly organized and easy to find.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <Sidebar
        tags={uniqueTags}
        selectedTag={selectedTag}
        tagCounts={tagCounts}
        onSelectTag={setSelectedTag}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {isLoading && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[60]">
            <Loader />
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                {selectedTag ? `Links tagged "${selectedTag}"` : 'All Links'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filteredLinks.length} {filteredLinks.length === 1 ? 'link' : 'links'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search links..."
                className="w-64"
              />
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="tooltip-content" sideOffset={5}>
                      Add Link
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="p-8">
          {filteredLinks.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600">
                {links.length === 0
                  ? "You haven't added any links yet"
                  : "No links match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-start"> {/* Changed alignment to left */}
              {filteredLinks.map(link => (
                <div key={link.id} className="w-full max-w-md"> {/* Added key to the wrapping div */}
                  <LinkCard
                    link={link}
                    onEdit={setEditingLink as any}
                    onDelete={setDeletingLinkId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Link Modal */}
      {isAddModalOpen && (
        <Form
          title="Add New Link"
          fields={addLinkFields}
          onSubmit={handleSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          onChange={handleAddLinkChange}
          isLoading={isLoading}
          submitText="Add Link"
        />
      )}

      {editingLink && (
        <Form
          title="Edit Link"
          fields={[
            { 
              name: 'url', 
              label: 'URL', 
              type: 'url', 
              required: true, 
              value: editingLink.url,
              validation: {
                pattern: /^https?:\/\/.+/,
                message: 'Please enter a valid URL starting with http:// or https://'
              }
            },
            { 
              name: 'title', 
              label: 'Title', 
              required: true, 
              value: editingLink.title 
            },
            { 
              name: 'description', 
              label: 'Description', 
              value: editingLink.description || '' 
            },
            { 
              name: 'tags', 
              label: 'Tags (comma-separated)', 
              required: true, 
              value: typeof editingLink.tags === 'string' ? editingLink.tags : editingLink.tags.map(t => t.name).join(', '),
              validation: {
                pattern: /^[\w\s]+(,[\w\s]+)*$/,
                message: 'Please enter tags separated by commas'
              }
            },
          ]}
          onSubmit={handleUpdate}
          onCancel={() => setEditingLink(null)}
          onChange={(field, value) => setEditingLink({ ...editingLink, [field]: value })}
          isLoading={isLoading}
          submitText="Save Changes"
        />
      )}

      {deletingLinkId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Delete Link</h2>
              <button
                onClick={() => setDeletingLinkId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this link? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setDeletingLinkId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deletingLinkId)}
                className="!bg-red-600 hover:!bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
