# MiniBase Client Usage Examples

This document shows how to use the MiniBase client library in your applications.

## Installation & Setup

```typescript
import { createClient } from './lib/minibase-client';

// Create a client instance
const minibase = createClient('http://localhost:3000', {
  apiKey: 'your-admin-token' // Optional, can be set later via auth
});
```

## Authentication

### Admin Login
```typescript
// Login as admin to get access token
const { data, error } = await minibase.auth.signIn({
  username: 'admin',
  password: 'admin123'
});

if (error) {
  console.error('Login failed:', error);
} else {
  console.log('Logged in:', data.user);
  // Token is automatically stored and used for subsequent requests
}
```

### Check Session
```typescript
const { data, error } = await minibase.auth.getSession();
if (data) {
  console.log('Active session found');
} else {
  console.log('No active session');
}
```

### Logout
```typescript
await minibase.auth.signOut();
```

## Database Operations

### Basic CRUD Operations

#### Select All Records
```typescript
const { data, error } = await minibase
  .from('users')
  .select()
  .execute();

if (error) {
  console.error('Error:', error);
} else {
  console.log('Users:', data);
}
```

#### Select Specific Columns
```typescript
const { data, error } = await minibase
  .from('users')
  .select('id, email, username')
  .execute();
```

#### Select with Limit and Offset
```typescript
const { data, error } = await minibase
  .from('users')
  .select()
  .limit(10)
  .offset(20)
  .execute();
```

#### Get Single Record by ID
```typescript
const { data, error } = await minibase
  .from('users')
  .getById(1);

if (error) {
  console.error('User not found:', error);
} else {
  console.log('User:', data);
}
```

#### Insert New Record
```typescript
const { data, error } = await minibase
  .from('users')
  .insert({
    email: 'john@example.com',
    username: 'john_doe',
    password_hash: 'hashed_password_here'
  });

if (error) {
  console.error('Insert failed:', error);
} else {
  console.log('New user created:', data);
}
```

#### Update Record
```typescript
const { data, error } = await minibase
  .from('users')
  .update(1, {
    email: 'john.doe@example.com',
    username: 'john.doe'
  });

if (error) {
  console.error('Update failed:', error);
} else {
  console.log('User updated:', data);
}
```

#### Delete Record
```typescript
const { data, error } = await minibase
  .from('users')
  .delete(1);

if (error) {
  console.error('Delete failed:', error);
} else {
  console.log('User deleted');
}
```

## Advanced Usage

### Working with Different Tables

```typescript
// Blog posts
const { data: posts } = await minibase.from('posts').select().execute();

// Comments
const { data: comments } = await minibase.from('comments').select().execute();

// Products
const { data: products } = await minibase.from('products').select().execute();
```

### Error Handling

```typescript
const handleDatabaseOperation = async () => {
  try {
    const { data, error } = await minibase
      .from('users')
      .select()
      .execute();

    if (error) {
      // Handle API errors
      console.error('API Error:', error);
      return;
    }

    // Process successful data
    console.log('Retrieved users:', data);

  } catch (err) {
    // Handle network or other errors
    console.error('Network Error:', err);
  }
};
```

### TypeScript Support

```typescript
interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
}

// Type-safe operations
const { data, error } = await minibase
  .from<User>('users')
  .select()
  .execute();

// data is now typed as User[]

const newPost = await minibase
  .from<Post>('posts')
  .insert({
    title: 'My First Post',
    content: 'Hello World!',
    author_id: 1
  });
```

### React Integration Example

```typescript
import React, { useState, useEffect } from 'react';
import { createClient } from './lib/minibase-client';

const minibase = createClient('http://localhost:3000');

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await minibase
      .from('users')
      .select()
      .execute();

    if (error) {
      setError(error);
    } else {
      setUsers(data.data || []);
    }
    setLoading(false);
  };

  const createUser = async (userData) => {
    const { data, error } = await minibase
      .from('users')
      .insert(userData);

    if (!error) {
      fetchUsers(); // Refresh list
    }
  };

  const deleteUser = async (userId) => {
    const { error } = await minibase
      .from('users')
      .delete(userId);

    if (!error) {
      fetchUsers(); // Refresh list
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} ({user.email})
            <button onClick={() => deleteUser(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
```

## API Reference

### Client Methods

- `createClient(url, options)` - Create a new MiniBase client
- `from(tableName)` - Get table interface for operations
- `auth.signIn(credentials)` - Admin login
- `auth.signOut()` - Logout
- `auth.getSession()` - Get current session

### Table Methods

- `select(columns?)` - Start a select query
- `insert(data)` - Insert new record
- `update(id, data)` - Update existing record
- `delete(id)` - Delete record
- `getById(id)` - Get single record by ID

### Query Builder Methods

- `eq(column, value)` - WHERE column = value
- `neq(column, value)` - WHERE column != value
- `gt(column, value)` - WHERE column > value
- `lt(column, value)` - WHERE column < value
- `limit(count)` - LIMIT clause
- `offset(count)` - OFFSET clause
- `execute()` - Execute the query

All methods return a response object with `{ data, error }` structure, similar to Supabase.