'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('minibase_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Verify token and get user info
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('Invalid token');
      }
    })
    .then(data => {
      setUser(data.user);
    })
    .catch(() => {
      localStorage.removeItem('minibase_token');
      router.replace('/login');
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('minibase_token');
    router.replace('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: '' },
    { name: 'Tables', href: '/dashboard/tables', icon: '' },
    { name: 'Data Browser', href: '/dashboard/data', icon: '' },
    { name: 'API Explorer', href: '/dashboard/api', icon: '' },
    { name: 'Users', href: '/dashboard/users', icon: '' },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className={`${sidebarOpen ? 'block' : 'hidden'} transition-all`}>
              <h1 className="text-xl font-bold text-gray-900">MiniBase</h1>
              <p className="text-sm text-gray-500">Database Admin</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group"
              >
                <span className={`${sidebarOpen ? 'ml-3' : 'hidden'} transition-all`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200">
            <div className={`${sidebarOpen ? 'block' : 'hidden'} mb-3`}>
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">Admin User</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome back, {user.username}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}