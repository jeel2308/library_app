'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

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

export default function Home() {
  const [links, setLinks] = useState<Link[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newLink, setNewLink] = useState({
    url: '',
    title: '',
    description: '',
    tags: '',
    isPublic: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchLinks();
    }

    // Listen for login/logout events
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

  async function fetchLinks() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/links', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized access
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
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login to create links');
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
        fetchLinks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
    }
  }

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white px-8 py-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-black mb-4">Welcome to Link Library</h1>
          <p className="text-gray-600 mb-8">Your personal workspace for organizing and managing links</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => {
              const header = document.querySelector('header');
              if (header) {
                header.dispatchEvent(new CustomEvent('show-login-modal', { bubbles: true }));
              }
            }}>
              Login to Access Your Links
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white px-8 py-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">My Links</h1>
      </div>
      
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Link</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit">Add Link</Button>
        </form>
      </div>

      {links.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600">You haven't added any links yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map(link => (
            <div key={link.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2">
                <a href={link.url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-700 hover:text-blue-800 hover:underline">
                  {link.title}
                </a>
              </h3>
              {link.description && (
                <p className="text-gray-700 mb-2">{link.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {link.tags.map(tag => (
                  <span key={tag.name} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
