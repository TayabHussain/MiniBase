/**
 * MiniBase Client Library
 * A TypeScript client for interacting with MiniBase APIs
 * Similar to supabase-js but for SQLite-based MiniBase
 */

export interface MiniBaseConfig {
  url: string;
  apiKey?: string;
  fetch?: typeof fetch;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
}

export interface CreateResponse<T> {
  data: T;
  error: null;
}

export interface ErrorResponse {
  data: null;
  error: string;
}

export type MiniBaseResponse<T> = CreateResponse<T> | ErrorResponse;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  error: null;
}

export interface AuthResponse {
  data: {
    token: string;
    user: {
      id: number;
      username: string;
    };
  } | null;
  error: string | null;
}

export class MiniBaseQueryBuilder<T = any> {
  private tableName: string;
  private client: MiniBaseClient;
  private selectColumns: string = '*';
  private whereConditions: Array<{ column: string; operator: string; value: any }> = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(tableName: string, client: MiniBaseClient) {
    this.tableName = tableName;
    this.client = client;
  }

  /**
   * Select specific columns
   */
  select(columns: string = '*'): this {
    this.selectColumns = columns;
    return this;
  }

  /**
   * Add WHERE clause for equality
   */
  eq(column: string, value: any): this {
    this.whereConditions.push({ column, operator: 'eq', value });
    return this;
  }

  /**
   * Add WHERE clause for not equal
   */
  neq(column: string, value: any): this {
    this.whereConditions.push({ column, operator: 'neq', value });
    return this;
  }

  /**
   * Add WHERE clause for greater than
   */
  gt(column: string, value: any): this {
    this.whereConditions.push({ column, operator: 'gt', value });
    return this;
  }

  /**
   * Add WHERE clause for less than
   */
  lt(column: string, value: any): this {
    this.whereConditions.push({ column, operator: 'lt', value });
    return this;
  }

  /**
   * Add LIMIT clause
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Add OFFSET clause
   */
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  /**
   * Execute the query and return results
   */
  async execute(): Promise<MiniBaseResponse<T[]> | PaginatedResponse<T>> {
    try {
      let url = `/api/rest/${this.tableName}`;
      const params = new URLSearchParams();

      if (this.limitValue) params.append('limit', this.limitValue.toString());
      if (this.offsetValue) params.append('offset', this.offsetValue.toString());

      // Note: For simplicity, we're not implementing full WHERE clause support in this demo
      // In a production version, you'd want to add query parameter support for filtering

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await this.client.request('GET', url);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Request failed' };
      }

      const data = await response.json();
      return { ...data, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class MiniBaseTable<T = any> {
  private tableName: string;
  private client: MiniBaseClient;

  constructor(tableName: string, client: MiniBaseClient) {
    this.tableName = tableName;
    this.client = client;
  }

  /**
   * Select data from table
   */
  select(columns?: string): MiniBaseQueryBuilder<T> {
    return new MiniBaseQueryBuilder<T>(this.tableName, this.client).select(columns);
  }

  /**
   * Insert new record
   */
  async insert(data: Partial<T>): Promise<MiniBaseResponse<T>> {
    try {
      const response = await this.client.request('POST', `/api/rest/${this.tableName}`, data);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Insert failed' };
      }

      const responseData = await response.json();
      return { data: responseData.data, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update record by ID
   */
  async update(id: number | string, data: Partial<T>): Promise<MiniBaseResponse<T>> {
    try {
      const response = await this.client.request('PUT', `/api/rest/${this.tableName}/${id}`, data);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Update failed' };
      }

      const responseData = await response.json();
      return { data: responseData.data, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: number | string): Promise<MiniBaseResponse<{ message: string }>> {
    try {
      const response = await this.client.request('DELETE', `/api/rest/${this.tableName}/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Delete failed' };
      }

      const responseData = await response.json();
      return { data: { message: responseData.message }, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get single record by ID
   */
  async getById(id: number | string): Promise<MiniBaseResponse<T>> {
    try {
      const response = await this.client.request('GET', `/api/rest/${this.tableName}/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Record not found' };
      }

      const responseData = await response.json();
      return { data: responseData.data, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class MiniBaseAuth {
  private client: MiniBaseClient;

  constructor(client: MiniBaseClient) {
    this.client = client;
  }

  /**
   * Sign in with username and password
   */
  async signIn(credentials: { username: string; password: string }): Promise<AuthResponse> {
    try {
      const response = await this.client.request('POST', '/api/auth/login', credentials);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Authentication failed' };
      }

      const data = await response.json();

      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem('minibase_token', data.token);
      }
      this.client.setApiKey(data.token);

      return {
        data: {
          token: data.token,
          user: data.user
        },
        error: null
      };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('minibase_token');
      }
      this.client.setApiKey(undefined);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { token: string } | null; error: string | null }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('minibase_token') : null;

      if (!token) {
        return { data: null, error: 'No active session' };
      }

      // Verify token
      const response = await this.client.request('GET', '/api/auth/verify');

      if (!response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('minibase_token');
        }
        return { data: null, error: 'Invalid session' };
      }

      return { data: { token }, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class MiniBaseClient {
  private baseURL: string;
  private apiKey?: string;
  private fetchImpl: typeof fetch;

  public auth: MiniBaseAuth;

  constructor(config: MiniBaseConfig) {
    this.baseURL = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.fetchImpl = config.fetch || (typeof window !== 'undefined' ? window.fetch : global.fetch);

    this.auth = new MiniBaseAuth(this);

    // Auto-load token from localStorage if available
    if (typeof window !== 'undefined' && !this.apiKey) {
      const storedToken = localStorage.getItem('minibase_token');
      if (storedToken) {
        this.apiKey = storedToken;
      }
    }
  }

  /**
   * Set or update the API key
   */
  setApiKey(apiKey?: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get table interface for performing operations
   */
  from<T = any>(tableName: string): MiniBaseTable<T> {
    return new MiniBaseTable<T>(tableName, this);
  }

  /**
   * Internal method to make HTTP requests
   */
  async request(method: string, endpoint: string, body?: any): Promise<Response> {
    const url = this.baseURL + endpoint;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    return this.fetchImpl(url, options);
  }

  /**
   * Execute raw SQL (admin only)
   */
  async sql(query: string, params: any[] = []): Promise<MiniBaseResponse<any[]>> {
    try {
      const response = await this.request('POST', '/api/database/sql', { query, params });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'SQL execution failed' };
      }

      const data = await response.json();
      return { data: data.results, error: null };

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * Create a new MiniBase client instance
 */
export function createClient(url: string, options: Omit<MiniBaseConfig, 'url'> = {}): MiniBaseClient {
  return new MiniBaseClient({ url, ...options });
}

// Default export
export default {
  createClient,
  MiniBaseClient,
  MiniBaseTable,
  MiniBaseAuth,
  MiniBaseQueryBuilder
};