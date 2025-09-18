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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tables</h1>
          <p className="page-subtitle">Manage your database tables and schema</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          + Create Table
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Tables List */}
      <div className="grid gap-6">
        {tables.map((table) => (
          <div key={table.name} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title">{table.name}</h3>
                  <p className="text-sm text-gray-500">{table.rowCount} records</p>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-sm btn-secondary">
                    View Data
                  </button>
                  {!['admin_users', 'app_users'].includes(table.name) && (
                    <button
                      onClick={() => handleDeleteTable(table.name)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Column</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Nullable</th>
                      <th className="table-header-cell">Default</th>
                      <th className="table-header-cell">Primary Key</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {table.schema.columns.map((column, index) => (
                      <tr key={index}>
                        <td className="table-cell font-medium">{column.name}</td>
                        <td className="table-cell">{column.type}</td>
                        <td className="table-cell">
                          {column.notnull ? 'No' : 'Yes'}
                        </td>
                        <td className="table-cell">
                          {column.dflt_value || '-'}
                        </td>
                        <td className="table-cell">
                          {column.pk ? 'Yes' : 'No'}
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
          <div className="card text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
            <p className="text-gray-500 mb-4">Create your first table to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
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
              <div className="card-header">
                <h3 className="card-title">Create New Table</h3>
              </div>

              <div className="card-body space-y-4">
                {/* Table Name */}
                <div className="form-group">
                  <label className="form-label">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="form-input"
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
                              ×
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