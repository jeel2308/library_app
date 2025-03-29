'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Loader } from './Loader';

export function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for show login modal event
    const handleShowLogin = () => {
      setIsLoginModalOpen(true);
    };

    document.addEventListener('show-login-modal', handleShowLogin);
    return () => document.removeEventListener('show-login-modal', handleShowLogin);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoginModalOpen(false);
        window.dispatchEvent(new CustomEvent('auth-status-change'));
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      
      const data = await response.json();
      if (response.ok) {
        setIsSignupModalOpen(false);
        setIsLoginModalOpen(true);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new CustomEvent('auth-status-change'));
  }

  return (
    <>
      {isLoading && <Loader />}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Link Library</h1>
          <div className="space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">Welcome, {user.name}</span>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsLoginModalOpen(true)}>
                  Login
                </Button>
                <Button onClick={() => setIsSignupModalOpen(true)}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                required
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
              <div className="flex justify-end space-x-4">
                <Button variant="secondary" onClick={() => setIsLoginModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Login</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSignupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Sign Up</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Name"
                required
                value={authForm.name}
                onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                required
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                required
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
              <div className="flex justify-end space-x-4">
                <Button variant="secondary" onClick={() => setIsSignupModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Sign Up</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}