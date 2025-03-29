'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Loader } from './Loader';

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
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    name: '',
  } as Error);
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

  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      return 'Please enter a valid email address';
    }
    if (name === 'password' && value.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const validateForm = (isSignup = false) => {
    const errors:Error = {
      email: '',
      password: '',
      name: '',
    };
    
    Object.entries(authForm).forEach(([field, value]) => {
      // Skip name validation if not signing up
      if (field === 'name' && !isSignup) {
        return;
      }
      
      if (field in errors) {
        const error = validateField(field, value);
        if (error) {
          errors[field as keyof typeof errors] = error;
        }
      }
    });
    
    // Only consider it an error if any error message is non-empty
    const hasErrors = Object.values(errors).some(error => error !== '');
    return hasErrors ? errors : {} as Error;
  };

  const handleFieldChange = (field: string, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
    // Only clear error if the new value passes validation
    const error = validateField(field, value);
    if (!error) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field: string, value: string) => {


    // Ensure value is trimmed when validating on blur
    const error = validateField(field, value.trim());
    if (error) {
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate all fields except name for login
    const errors = validateForm(false);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoginModalOpen(false);
        // Reset form
        setAuthForm({ email: '', password: '', name: '' });
        setFormErrors({ email: '', password: '', name: '' });
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
    
    // Validate all fields including name for signup
    const errors = validateForm(true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSignupModalOpen(false);
        // Handle successful signup
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={authForm.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                onBlur={e => handleFieldBlur('email', e.target.value)}
                error={formErrors.email}
              />
              <Input
                label="Password"
                type="password"
                required
                value={authForm.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                onBlur={e => handleFieldBlur('password', e.target.value)}
                error={formErrors.password}
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
                onChange={e => handleFieldChange('name', e.target.value)}
                onBlur={e => handleFieldBlur('name', e.target.value)}
                error={formErrors.name}
              />
              <Input
                label="Email"
                type="email"
                required
                value={authForm.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                onBlur={e => handleFieldBlur('email', e.target.value)}
                error={formErrors.email}
              />
              <Input
                label="Password"
                type="password"
                required
                value={authForm.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                onBlur={e => handleFieldBlur('password', e.target.value)}
                error={formErrors.password}
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