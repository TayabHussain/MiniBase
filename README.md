# MiniBase

A lightweight, self-hosted Supabase alternative built with SQLite. MiniBase provides a complete database management system with auto-generated APIs, admin dashboard, and a client library for easy integration.

## Features

🔐 **Admin Authentication** - Secure JWT-based authentication system
🗄️ **SQLite Database** - Fast, reliable, and file-based database
🎛️ **Admin Dashboard** - Web-based interface for database management
🔌 **Auto-Generated APIs** - RESTful CRUD endpoints for all tables
👥 **User Management** - Built-in user tables and authentication
📊 **Data Browser** - View, edit, and manage table data
🔍 **API Explorer** - Test and document your APIs
📦 **Client Library** - TypeScript/JavaScript client for easy integration
🛡️ **SQL Injection Protection** - Prepared statements throughout

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/minibase.git
cd minibase
npm install
npm run dev
```

### First Login

1. Visit `http://localhost:3000`
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Change the default password immediately!

### Create Your First Table

1. Go to **Tables** in the admin dashboard
2. Click **Create Table**
3. Add columns and configure types
4. Your REST APIs are automatically generated!

## Using the Client Library

### Installation in Your App

```typescript
import { createClient } from './lib/minibase-client';

const minibase = createClient('http://localhost:3000');

// Login
await minibase.auth.signIn({
  username: 'admin',
  password: 'admin123'
});

// Query data
const { data, error } = await minibase
  .from('users')
  .select()
  .execute();

// Insert data
await minibase.from('users').insert({
  email: 'user@example.com',
  username: 'newuser'
});
```

See [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md) for complete documentation.

## Auto-Generated APIs

For every table you create, MiniBase automatically generates:

- `GET /api/rest/{table}` - List all records
- `GET /api/rest/{table}/{id}` - Get single record
- `POST /api/rest/{table}` - Create new record
- `PUT /api/rest/{table}/{id}` - Update record
- `DELETE /api/rest/{table}/{id}` - Delete record

### Example API Usage

```bash
# Get all users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/rest/users

# Create a new user
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"newuser"}' \
  http://localhost:3000/api/rest/users

# Update user
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"updated@example.com"}' \
  http://localhost:3000/api/rest/users/1

# Delete user
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/rest/users/1
```

## Architecture

MiniBase follows the Supabase architecture pattern:

```
Your Application
       ↓
  MiniBase Client
       ↓
┌─────────────────────────────────┐
│         MiniBase Core           │
├─────────┬─────────┬─────────────┤
│  Auth   │  REST   │   Admin     │
│ System  │  APIs   │ Dashboard   │
└─────────┴─────────┴─────────────┘
       ↓
  SQLite Database
```

## Project Structure

```
minibase/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── database/      # Database management APIs
│   │   │   └── rest/          # Auto-generated CRUD APIs
│   │   ├── dashboard/         # Admin dashboard pages
│   │   └── login/             # Login page
│   └── lib/
│       ├── auth.ts            # Authentication logic
│       ├── db.ts              # Database connection
│       └── minibase-client.ts # Client library
├── database.sqlite            # SQLite database file
└── package.json
```

## Security Features

- **JWT Authentication** - All API endpoints require valid tokens
- **SQL Injection Protection** - Prepared statements prevent injection attacks
- **Admin-only Access** - Database management requires admin authentication
- **CORS Support** - Configurable cross-origin resource sharing
- **Input Validation** - Data validation on all endpoints

## Production Deployment

### Environment Variables

Create a `.env.local` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
```

### Build and Deploy

```bash
npm run build
npm start
```

## Comparison with Supabase

| Feature | MiniBase | Supabase |
|---------|----------|----------|
| Database | SQLite | PostgreSQL |
| Hosting | Self-hosted | Cloud/Self-hosted |
| Real-time | ✅ (planned) | ✅ |
| Auth | Admin + Users | Full auth system |
| File Storage | ✅ (planned) | ✅ |
| Edge Functions | ❌ | ✅ |
| Size | ~50MB | Larger |
| Cost | Free | Freemium |

## Roadmap

- [ ] Real-time subscriptions
- [ ] File storage system
- [ ] Database migrations
- [ ] CLI package for easy setup
- [ ] Multiple admin users
- [ ] Row-level security
- [ ] Export/import functionality
- [ ] Docker image
- [ ] OpenAPI documentation

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/yourusername/minibase.git
cd minibase
npm install
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](./EXAMPLE_USAGE.md)
- 🐛 [Issues](https://github.com/yourusername/minibase/issues)
- 💬 [Discussions](https://github.com/yourusername/minibase/discussions)

---

Built with ❤️ by the MiniBase team. A lightweight alternative to Supabase for those who love SQLite!
