'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';

interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: { name: string }[];
  user: { name: string };
  createdAt: string;
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

    // Validate required fields
    if (!newLink.url.trim()) {
      alert('URL is required');
      setIsLoading(false);
      return;
    }

    if (!newLink.title.trim()) {
      alert('Title is required');
      setIsLoading(false);
      return;
    }

    if (!newLink.tags.trim()) {
      alert('At least one tag is required');
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
      // Error state is already being handled in the UI
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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
        <nav>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedTag('')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                !selectedTag
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Links
              <span className="ml-2 text-gray-500">({links.length})</span>
            </button>
            
            {uniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {isLoading && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[60]">
            <Loader />
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0">
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
              <Button onClick={() => setIsAddModalOpen(true)}>
                Add Link
              </Button>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredLinks.map(link => (
                <div key={link.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-700 hover:text-blue-800 hover:underline">
                        {link.title}
                      </a>
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingLink(link)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingLinkId(link.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {link.description && (
                    <p className="text-gray-700 mb-2">{link.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {link.tags.map(tag => (
                      <button
                        key={tag.name}
                        onClick={() => setSelectedTag(tag.name)}
                        className={`px-2 py-1 rounded-full text-sm border ${
                          selectedTag === tag.name
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Link Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add New Link</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={(e) => {
              handleSubmit(e);
              setIsAddModalOpen(false);
            }} className="space-y-4">
              <Input
                label="URL"
                type="url"
                required
                value={newLink.url}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
              />
              <Input
                label="Title"
                required
                value={newLink.title}
                onChange={e => setNewLink({ ...newLink, title: e.target.value })}
              />
              <Input
                label="Description"
                value={newLink.description}
                onChange={e => setNewLink({ ...newLink, description: e.target.value })}
              />
              <Input
                label="Tags (comma-separated)"
                value={newLink.tags}
                onChange={e => setNewLink({ ...newLink, tags: e.target.value })}
              />
              <div className="flex justify-end space-x-4">
                <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Link</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Link</h2>
              <button
                onClick={() => setEditingLink(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="URL"
                type="url"
                required
                value={editingLink.url}
                onChange={e => setEditingLink({ ...editingLink, url: e.target.value })}
              />
              <Input
                label="Title"
                required
                value={editingLink.title}
                onChange={e => setEditingLink({ ...editingLink, title: e.target.value })}
              />
              <Input
                label="Description"
                value={editingLink.description || ''}
                onChange={e => setEditingLink({ ...editingLink, description: e.target.value })}
              />
              <Input
                label="Tags (comma-separated)"
                value={typeof editingLink.tags === 'string' ? editingLink.tags : editingLink.tags.map(t => t.name).join(', ')}
                onChange={e => setEditingLink({ 
                  ...editingLink, 
                  tags: e.target.value 
                })}
              />
              <div className="flex justify-end space-x-4">
                <Button variant="secondary" onClick={() => setEditingLink(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
