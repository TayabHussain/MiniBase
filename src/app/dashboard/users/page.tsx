'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch('/api/rest/app_users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      setError('Network error loading users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('minibase_token');

      // Simple password hashing (in production, use proper hashing)
      const hashedPassword = btoa(newUser.password); // Basic base64 encoding

      const response = await fetch('/api/rest/app_users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUser.email,
          username: newUser.username,
          password_hash: hashedPassword
        })
      });

      if (response.ok) {
        setNewUser({ email: '', username: '', password: '' });
        setShowCreateForm(false);
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Network error creating user');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('minibase_token');
      const response = await fetch(`/api/rest/app_users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        setError('Failed to delete user');
      }
    } catch (error) {
      setError('Network error deleting user');
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
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage application users</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Add User
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Create user form */}
      {showCreateForm && (
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-4">Create New User</h3>
            <form onSubmit={createUser} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUser({ email: '', username: '', password: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Application Users</h3>
        </div>

        {users.length === 0 ? (
          <div className="card-body text-center py-12">
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h4>
            <p className="text-gray-500 mb-4">
              Create your first application user to get started.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Add User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">ID</th>
                  <th className="table-header-cell">Username</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-cell">{user.id}</td>
                    <td className="table-cell">
                      <div className="font-medium">{user.username}</div>
                    </td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="card">
        <div className="card-body">
          <h3 className="card-title mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="stats-value text-blue-600">{users.length}</p>
              <p className="stats-label">Total Users</p>
            </div>
            <div className="text-center">
              <p className="stats-value text-green-600">
                {users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
              <p className="stats-label">New This Week</p>
            </div>
            <div className="text-center">
              <p className="stats-value text-purple-600">
                {users.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </p>
              <p className="stats-label">New Today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}