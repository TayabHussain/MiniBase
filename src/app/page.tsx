'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('minibase_token');

    if (token) {
      // Verify token is valid
      fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          router.replace('/dashboard');
        } else {
          localStorage.removeItem('minibase_token');
          router.replace('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('minibase_token');
        router.replace('/login');
      });
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading MiniBase...</p>
      </div>
    </div>
  );
}
