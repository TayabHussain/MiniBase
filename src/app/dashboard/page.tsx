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
    <div className="page-container">
      {/* Welcome section */}
      <div className="card">
        <div className="card-body">
          <h1 className="page-title mb-2">Welcome to MiniBase</h1>
          <p className="page-subtitle">
            Your self-hosted SQLite database management system. Manage tables, browse data, and explore auto-generated APIs.
          </p>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stats-icon bg-blue-100">
                <span className="text-blue-600 text-sm font-bold">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="stats-label">Total Tables</p>
              <p className="stats-value">
                {stats?.totalTables || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stats-icon bg-green-100">
                <span className="text-green-600 text-sm font-bold">R</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="stats-label">Total Records</p>
              <p className="stats-value">
                {stats?.totalRows || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stats-icon bg-purple-100">
                <span className="text-purple-600 text-sm font-bold">A</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="stats-label">API Endpoints</p>
              <p className="stats-value">
                {(stats?.totalTables || 0) * 4}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables overview */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tables Overview</h3>
        </div>
        <div className="card-body">
          {stats?.tables && stats.tables.length > 0 ? (
            <div className="space-y-3">
              {stats.tables.map((table, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <span className="text-sm mr-3 text-gray-400">•</span>
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h4>
              <p className="text-gray-500 mb-4">
                Get started by creating your first table or importing data.
              </p>
              <button className="btn btn-primary">
                Create Table
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-sm mr-3 text-gray-400">+</span>
                  <span className="font-medium">Create New Table</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-sm mr-3 text-gray-400">•</span>
                  <span className="font-medium">Browse Data</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-sm mr-3 text-gray-400">•</span>
                  <span className="font-medium">Test APIs</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-4">System Info</h3>
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
                <span className="text-green-600 font-medium">Running</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}