'use client';

import { useState, useEffect } from 'react';

interface DatabaseStats {
  totalTables: number;
  totalRows: number;
  tables: Array<{
    name: string;
    rowCount: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch('/api/database/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to load database statistics');
      }
    } catch (error) {
      setError('Network error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MiniBase</h1>
        <p className="text-gray-600">
          Your self-hosted SQLite database management system. Manage tables, browse data, and explore auto-generated APIs.
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 text-lg">🗂️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tables</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalTables || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalRows || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <span className="text-purple-600 text-lg">🔌</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">API Endpoints</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(stats?.totalTables || 0) * 4}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables overview */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tables Overview</h3>
        </div>
        <div className="p-6">
          {stats?.tables && stats.tables.length > 0 ? (
            <div className="space-y-3">
              {stats.tables.map((table, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🗂️</span>
                    <span className="font-medium text-gray-900">{table.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {table.rowCount} records
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📝</span>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h4>
              <p className="text-gray-500 mb-4">
                Get started by creating your first table or importing data.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Create Table
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-lg mr-3">➕</span>
                <span className="font-medium">Create New Table</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-lg mr-3">🔍</span>
                <span className="font-medium">Browse Data</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-lg mr-3">🔌</span>
                <span className="font-medium">Test APIs</span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Database Type:</span>
              <span className="font-medium">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Version:</span>
              <span className="font-medium">MiniBase v0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="text-green-600 font-medium">●  Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}