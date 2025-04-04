'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Form, Field } from './Form';

type Error = {
  email?: string;
  password?: string;
  name?: string;
}

export function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [formErrors, setFormErrors] = useState({} as Error);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleShowLogin = () => {
      setIsLoginModalOpen(true);
    };

    document.addEventListener('show-login-modal', handleShowLogin);
    return () => document.removeEventListener('show-login-modal', handleShowLogin);
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
    // Clear API errors when user starts typing
    if (formErrors[field as keyof Error]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoginModalOpen(false);
        setAuthForm({ email: '', password: '', name: '' });
        setFormErrors({});
        window.dispatchEvent(new CustomEvent('auth-status-change'));
      } else {
        setFormErrors(prev => ({ ...prev, password: data.error }));
      }
    } catch (error) {
      console.error('Failed to login. Please check your credentials.',error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setIsSignupModalOpen(false);
        setAuthForm({ email: '', password: '', name: '' });
        setFormErrors({});
      } else {
        setFormErrors(prev => ({ ...prev, email: data.error }));
      }
    } catch (error) {
      console.error('Failed to create account. Please try again.',error);
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

  const loginFields: Field[] = [
    { 
      name: 'email', 
      label: 'Email', 
      type: 'email', 
      required: true, 
      value: authForm.email,
      validation: {
        pattern: /\S+@\S+\.\S+/,
        message: 'Please enter a valid email address'
      }
    },
    { 
      name: 'password', 
      label: 'Password', 
      type: 'password', 
      required: true, 
      value: authForm.password,
      validation: {
        minLength: 6,
        message: 'Password must be at least 6 characters long'
      }
    },
  ];

  const signupFields: Field[] = [
    { name: 'name', label: 'Name', required: true, value: authForm.name },
    ...loginFields
  ];

  return (
    <>
      <header className="bg-white shadow-sm">
        <nav className="h-16 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Link Library</h1>
          <div className="flex items-center gap-4">
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
        <Form
          title="Login"
          fields={loginFields}
          onSubmit={handleLogin}
          onCancel={() => setIsLoginModalOpen(false)}
          onChange={handleFieldChange}
          errors={formErrors}
          isLoading={isLoading}
          submitText="Login"
        />
      )}

      {isSignupModalOpen && (
        <Form
          title="Sign Up"
          fields={signupFields}
          onSubmit={handleSignup}
          onCancel={() => setIsSignupModalOpen(false)}
          onChange={handleFieldChange}
          errors={formErrors}
          isLoading={isLoading}
          submitText="Sign Up"
        />
      )}
    </>
  );
}