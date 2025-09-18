import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDB } from './db';
import type { AdminUser } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'minibase-secret-key-change-in-production';

export interface AdminSession {
  id: number;
  username: string;
  iat: number;
  exp: number;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
  };
  error?: string;
}

export class AuthService {
  private db = getDB();

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const user = this.db.getAdminUser(username);

      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const isValidPassword = bcrypt.compareSync(password, user.password_hash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  verifyToken(token: string): AdminSession | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminSession;
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async createAdminUser(username: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = this.db.getAdminUser(username);
      if (existingUser) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }

      const user = this.db.createAdminUser(username, password);
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Create admin user error:', error);
      return {
        success: false,
        error: 'Failed to create user'
      };
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Middleware helper for Next.js API routes
  async authenticateRequest(req: any): Promise<{ success: boolean; user?: AdminSession; error?: string }> {
    const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers.authorization;
    const token = this.extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: 'No token provided'
      };
    }

    const user = this.verifyToken(token);
    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    return {
      success: true,
      user
    };
  }
}

// Singleton instance
let authInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authInstance) {
    authInstance = new AuthService();
  }
  return authInstance;
}

export default AuthService;