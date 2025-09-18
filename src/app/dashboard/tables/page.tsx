'use client';

import { useState, useEffect } from 'react';

interface TableColumn {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

interface TableInfo {
  name: string;
  schema: {
    name: string;
    columns: TableColumn[];
  };
  rowCount: number;
}

interface NewColumn {
  name: string;
  type: string;
  constraints: string;
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // New table form state
  const [newTableName, setNewTableName] = useState('');
  const [newColumns, setNewColumns] = useState<NewColumn[]>([
    { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT' },
    { name: 'created_at', type: 'DATETIME', constraints: 'DEFAULT CURRENT_TIMESTAMP' }
  ]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch('/api/database/tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTables(data.tables);
      } else {
        setError('Failed to load tables');
      }
    } catch (error) {
      setError('Network error loading tables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch('/api/database/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tableName: newTableName,
          columns: newColumns
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewTableName('');
        setNewColumns([
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT' },
          { name: 'created_at', type: 'DATETIME', constraints: 'DEFAULT CURRENT_TIMESTAMP' }
        ]);
        fetchTables(); // Refresh tables list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create table');
      }
    } catch (error) {
      setError('Network error creating table');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete table "${tableName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch(`/api/database/tables/${tableName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTables(); // Refresh tables list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete table');
      }
    } catch (error) {
      setError('Network error deleting table');
    }
  };

  const addNewColumn = () => {
    setNewColumns([...newColumns, { name: '', type: 'TEXT', constraints: '' }]);
  };

  const updateColumn = (index: number, field: keyof NewColumn, value: string) => {
    const updated = [...newColumns];
    updated[index][field] = value;
    setNewColumns(updated);
  };

  const removeColumn = (index: number) => {
    if (newColumns.length > 1) {
      setNewColumns(newColumns.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-600">Manage your database tables and schema</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ Create Table
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tables List */}
      <div className="grid gap-6">
        {tables.map((table) => (
          <div key={table.name} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{table.name}</h3>
                  <p className="text-sm text-gray-500">{table.rowCount} records</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    View Data
                  </button>
                  {!['admin_users', 'app_users'].includes(table.name) && (
                    <button
                      onClick={() => handleDeleteTable(table.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Column</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Nullable</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Default</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Primary Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.schema.columns.map((column, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-sm font-medium text-gray-900">{column.name}</td>
                        <td className="py-2 text-sm text-gray-600">{column.type}</td>
                        <td className="py-2 text-sm text-gray-600">
                          {column.notnull ? '❌' : '✅'}
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          {column.dflt_value || '-'}
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          {column.pk ? '🔑' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-4xl mb-4 block">📝</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
            <p className="text-gray-500 mb-4">Create your first table to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Table
            </button>
          </div>
        )}
      </div>

      {/* Create Table Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateTable}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Create New Table</h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Table Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="users, posts, orders..."
                    required
                  />
                </div>

                {/* Columns */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Columns
                    </label>
                    <button
                      type="button"
                      onClick={addNewColumn}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Column
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newColumns.map((column, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={column.name}
                            onChange={(e) => updateColumn(index, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Column name"
                            required
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={column.type}
                            onChange={(e) => updateColumn(index, 'type', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="TEXT">TEXT</option>
                            <option value="INTEGER">INTEGER</option>
                            <option value="REAL">REAL</option>
                            <option value="BOOLEAN">BOOLEAN</option>
                            <option value="DATETIME">DATETIME</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={column.constraints}
                            onChange={(e) => updateColumn(index, 'constraints', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="NOT NULL, DEFAULT..."
                          />
                        </div>
                        <div className="col-span-1">
                          {newColumns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeColumn(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTableName}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}