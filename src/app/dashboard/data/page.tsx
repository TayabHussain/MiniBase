'use client';

import { useState, useEffect } from 'react';

interface TableInfo {
  name: string;
  rowCount: number;
}

interface TableData {
  data: any[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export default function DataBrowserPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState<any>({});

  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable, currentPage]);

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
      } else {
        setError('Failed to load tables');
      }
    } catch (error) {
      setError('Network error loading tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable) return;

    setDataLoading(true);
    try {
      const token = localStorage.getItem('minibase_token');
      const offset = currentPage * pageSize;
      const response = await fetch(`/api/rest/${selectedTable}?limit=${pageSize}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTableData(data);
      } else {
        setError('Failed to load table data');
      }
    } catch (error) {
      setError('Network error loading data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleEdit = (row: any, index: number) => {
    setEditingRow(index);
    setEditingData({ ...row });
  };

  const handleSave = async (rowId: number) => {
    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch(`/api/rest/${selectedTable}/${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingData)
      });

      if (response.ok) {
        setEditingRow(null);
        setEditingData({});
        fetchTableData(); // Refresh data
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update record');
      }
    } catch (error) {
      setError('Network error updating record');
    }
  };

  const handleDelete = async (rowId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch(`/api/rest/${selectedTable}/${rowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTableData(); // Refresh data
        fetchTables(); // Refresh table counts
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete record');
      }
    } catch (error) {
      setError('Network error deleting record');
    }
  };

  const handleAdd = async () => {
    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch(`/api/rest/${selectedTable}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRecord)
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewRecord({});
        fetchTableData(); // Refresh data
        fetchTables(); // Refresh table counts
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create record');
      }
    } catch (error) {
      setError('Network error creating record');
    }
  };

  const getColumns = () => {
    if (!tableData || tableData.data.length === 0) return [];
    return Object.keys(tableData.data[0]);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
        <p className="text-gray-500">Create tables first to browse their data</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Browser</h1>
          <p className="page-subtitle">Browse and edit your table data</p>
        </div>

        {selectedTable && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-success"
          >
            + Add Record
          </button>
        )}
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

      {/* Table Selection */}
      <div className="card">
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Select Table:</label>
            <select
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value);
                setCurrentPage(0);
              }}
              className="form-select max-w-md"
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

      {/* Data Table */}
      {selectedTable && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">
                Table: {selectedTable}
              </h3>
              {tableData && (
                <span className="text-sm text-gray-500">
                  Showing {tableData.pagination.offset + 1}-
                  {Math.min(tableData.pagination.offset + tableData.pagination.limit, tableData.pagination.total)} of {tableData.pagination.total} records
                </span>
              )}
            </div>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : tableData && tableData.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      {getColumns().map((column) => (
                        <th key={column} className="table-header-cell">
                          {column}
                        </th>
                      ))}
                      <th className="table-header-cell text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {tableData.data.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-gray-50">
                        {getColumns().map((column) => (
                          <td key={column} className="table-cell">
                            {editingRow === index ? (
                              <input
                                type="text"
                                value={editingData[column] || ''}
                                onChange={(e) => setEditingData({
                                  ...editingData,
                                  [column]: e.target.value
                                })}
                                className="form-input"
                              />
                            ) : (
                              <span className="max-w-xs truncate block">
                                {formatValue(row[column])}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="table-cell text-right">
                          {editingRow === index ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleSave(row.id)}
                                className="btn btn-sm btn-success"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRow(null);
                                  setEditingData({});
                                }}
                                className="btn btn-sm btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleEdit(row, index)}
                                className="btn btn-sm btn-primary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="btn btn-sm btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {tableData.pagination.total > pageSize && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-500">
                    Page {currentPage + 1} of {Math.ceil(tableData.pagination.total / pageSize)}
                  </span>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!tableData.pagination.hasMore}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h4>
              <p className="text-gray-500 mb-4">This table is empty</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add First Record
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Record Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Record</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {getColumns().filter(col => col !== 'id').map((column) => (
                <div key={column}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column}
                  </label>
                  <input
                    type="text"
                    value={newRecord[column] || ''}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      [column]: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${column}`}
                  />
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRecord({});
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}