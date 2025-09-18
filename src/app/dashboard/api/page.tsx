'use client';

import { useState, useEffect } from 'react';

interface TableInfo {
  name: string;
  rowCount: number;
}

interface ApiResponse {
  data?: any;
  error?: string;
  status: number;
}

export default function ApiExplorerPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('');
  const [recordId, setRecordId] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      updateEndpoint();
    }
  }, [selectedTable, method, recordId]);

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

  const updateEndpoint = () => {
    if (!selectedTable) return;

    let newEndpoint = `/api/rest/${selectedTable}`;

    if ((method === 'PUT' || method === 'DELETE') && recordId) {
      newEndpoint += `/${recordId}`;
    } else if (method === 'GET' && recordId) {
      newEndpoint += `/${recordId}`;
    }

    setEndpoint(newEndpoint);
  };

  const executeRequest = async () => {
    if (!endpoint) return;

    setLoading(true);
    setResponse(null);

    try {
      const token = localStorage.getItem('minibase_token');
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if ((method === 'POST' || method === 'PUT') && requestBody) {
        try {
          JSON.parse(requestBody); // Validate JSON
          options.body = requestBody;
        } catch (error) {
          setResponse({
            error: 'Invalid JSON in request body',
            status: 400
          });
          setLoading(false);
          return;
        }
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      setResponse({
        data,
        status: res.status
      });

    } catch (error) {
      setResponse({
        error: 'Network error',
        status: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getExampleRequestBody = () => {
    if (!selectedTable) return '';

    const examples: Record<string, any> = {
      app_users: {
        email: "user@example.com",
        username: "newuser",
        password_hash: "hashed_password_here"
      },
      posts: {
        title: "My First Post",
        content: "This is the content of my post",
        author_id: 1
      },
      default: {
        name: "Example Name",
        description: "Example description",
        active: true
      }
    };

    return JSON.stringify(examples[selectedTable] || examples.default, null, 2);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Explorer</h1>
        <p className="text-gray-600">Test your auto-generated CRUD APIs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request</h3>

            {/* Table Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {tables.map((table) => (
                  <option key={table.name} value={table.name}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Method:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`px-3 py-2 rounded-md text-sm font-medium border ${
                      method === m
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Record ID (for single record operations) */}
            {(method === 'PUT' || method === 'DELETE' || method === 'GET') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record ID {method === 'GET' ? '(optional)' : '(required)'}:
                </label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter record ID"
                />
              </div>
            )}

            {/* Endpoint Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint:
              </label>
              <div className="flex">
                <span className={`px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm font-medium ${
                  method === 'GET' ? 'text-blue-600' :
                  method === 'POST' ? 'text-green-600' :
                  method === 'PUT' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {method}
                </span>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Request Body (for POST/PUT) */}
            {(method === 'POST' || method === 'PUT') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Request Body (JSON):
                  </label>
                  <button
                    onClick={() => setRequestBody(getExampleRequestBody())}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Load Example
                  </button>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={executeRequest}
              disabled={loading || !endpoint}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Executing...' : 'Execute Request'}
            </button>
          </div>

          {/* API Documentation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Documentation</h3>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900">Available Endpoints:</h4>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li><code className="bg-gray-100 px-1 rounded">GET /api/rest/{selectedTable}</code> - List all records</li>
                  <li><code className="bg-gray-100 px-1 rounded">GET /api/rest/{selectedTable}/{'{id}'}</code> - Get single record</li>
                  <li><code className="bg-gray-100 px-1 rounded">POST /api/rest/{selectedTable}</code> - Create new record</li>
                  <li><code className="bg-gray-100 px-1 rounded">PUT /api/rest/{selectedTable}/{'{id}'}</code> - Update record</li>
                  <li><code className="bg-gray-100 px-1 rounded">DELETE /api/rest/{selectedTable}/{'{id}'}</code> - Delete record</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Authentication:</h4>
                <p className="mt-1 text-gray-600">
                  All API endpoints require a valid JWT token in the Authorization header:
                  <br />
                  <code className="bg-gray-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code>
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Query Parameters:</h4>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li><code className="bg-gray-100 px-1 rounded">limit</code> - Number of records to return (default: 100)</li>
                  <li><code className="bg-gray-100 px-1 rounded">offset</code> - Number of records to skip (default: 0)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Response Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Response</h3>

          {response ? (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`text-sm font-medium ${getStatusColor(response.status)}`}>
                  {response.status}
                </span>
              </div>

              {/* Response Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Body:
                </label>
                <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto border border-gray-200">
                  {JSON.stringify(response.data || { error: response.error }, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">🔌</span>
              <p>Execute a request to see the response</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}