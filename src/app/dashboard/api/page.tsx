'use client';

import { useState, useEffect } from 'react';

interface TableInfo {
  name: string;
  rowCount: number;
}

export default function ApiExplorerPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');

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
        setTables(data.tables.map((t: any) => ({ name: t.name, rowCount: t.rowCount })));
        if (data.tables.length > 0 && !selectedTable) {
          setSelectedTable(data.tables[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">API Endpoints</h1>
          <p className="page-subtitle">Available CRUD API endpoints for your tables</p>
        </div>
      </div>

      {/* Table Selection */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Select Table</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Table:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="form-select"
            >
              {tables.map((table) => (
                <option key={table.name} value={table.name}>
                  {table.name} ({table.rowCount} records)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* API Endpoints Display */}
      {selectedTable && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">API Endpoints for {selectedTable}</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* GET All Records */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded mr-4">
                    GET
                  </span>
                  <div className="flex-1">
                    <code className="text-lg font-mono">/api/rest/{selectedTable}</code>
                    <p className="text-sm text-gray-600 mt-1">Get all records from {selectedTable}</p>
                  </div>
                </div>

                {/* GET Single Record */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded mr-4">
                    GET
                  </span>
                  <div className="flex-1">
                    <code className="text-lg font-mono">/api/rest/{selectedTable}/&#123;id&#125;</code>
                    <p className="text-sm text-gray-600 mt-1">Get a specific record by ID from {selectedTable}</p>
                  </div>
                </div>

                {/* POST Create Record */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded mr-4">
                    POST
                  </span>
                  <div className="flex-1">
                    <code className="text-lg font-mono">/api/rest/{selectedTable}</code>
                    <p className="text-sm text-gray-600 mt-1">Create a new record in {selectedTable}</p>
                  </div>
                </div>

                {/* PUT Update Record */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded mr-4">
                    PUT
                  </span>
                  <div className="flex-1">
                    <code className="text-lg font-mono">/api/rest/{selectedTable}/&#123;id&#125;</code>
                    <p className="text-sm text-gray-600 mt-1">Update a specific record by ID in {selectedTable}</p>
                  </div>
                </div>

                {/* DELETE Record */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded mr-4">
                    DELETE
                  </span>
                  <div className="flex-1">
                    <code className="text-lg font-mono">/api/rest/{selectedTable}/&#123;id&#125;</code>
                    <p className="text-sm text-gray-600 mt-1">Delete a specific record by ID from {selectedTable}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Authentication</h3>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-600 mb-3">
                All API endpoints require authentication using a JWT token in the Authorization header:
              </p>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">Authorization: Bearer &lt;your-token&gt;</code>
              </div>
            </div>
          </div>

          {/* Query Parameters Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Query Parameters</h3>
            </div>
            <div className="card-body">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <code className="bg-gray-100 px-2 py-1 rounded">limit</code>
                  <span className="text-gray-600">Number of records to return (default: 100)</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 px-2 py-1 rounded">offset</code>
                  <span className="text-gray-600">Number of records to skip (default: 0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}