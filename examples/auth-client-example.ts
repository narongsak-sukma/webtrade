/**
 * Authentication Client Example
 *
 * This file demonstrates how to integrate the authentication system
 * into a frontend application.
 */

interface AuthClientConfig {
  baseURL: string;
}

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
  };
  token?: string;
  error?: string;
}

interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
  };
  error?: string;
}

/**
 * Authentication Client Class
 */
export class AuthClient {
  private config: AuthClientConfig;
  private token: string | null = null;

  constructor(config: AuthClientConfig) {
    this.config = config;

    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${this.config.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.config.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Logout and clear token
   */
  async logout(): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${this.config.baseURL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    this.clearToken();

    return await response.json();
  }

  /**
   * Get current session
   */
  async getSession(): Promise<SessionResponse> {
    if (!this.token) {
      return { authenticated: false };
    }

    const response = await fetch(`${this.config.baseURL}/api/auth/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const data = await response.json();

    // Update token if refreshed
    if (data.tokenRefreshed && response.headers.has('set-cookie')) {
      // Note: Cookies are handled automatically by the browser
      // This is just for reference
    }

    return data;
  }

  /**
   * Set token and store in localStorage
   */
  private setToken(token: string): void {
    this.token = token;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Clear token from memory and localStorage
   */
  private clearToken(): void {
    this.token = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Make authenticated request
   */
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}

/**
 * React Hook Example (for React applications)
 */
export function useAuth(baseURL: string) {
  const authClient = new AuthClient({ baseURL });

  return {
    register: authClient.register.bind(authClient),
    login: authClient.login.bind(authClient),
    logout: authClient.logout.bind(authClient),
    getSession: authClient.getSession.bind(authClient),
    isAuthenticated: authClient.isAuthenticated.bind(authClient),
    getToken: authClient.getToken.bind(authClient),
    authenticatedFetch: authClient.authenticatedFetch.bind(authClient),
  };
}

// Usage Examples

// Example 1: Basic Usage
async function example1() {
  const auth = new AuthClient({ baseURL: 'http://localhost:3000' });

  try {
    // Register
    const registerResult = await auth.register(
      'user@example.com',
      'SecurePass123!@#',
      'John Doe'
    );

    if (registerResult.success) {
      console.log('Registered:', registerResult.user);

      // Get session
      const session = await auth.getSession();
      console.log('Session:', session);

      // Make authenticated request
      const response = await auth.authenticatedFetch(
        '/api/protected-route'
      );
      const data = await response.json();
      console.log('Protected data:', data);

      // Logout
      await auth.logout();
      console.log('Logged out');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 2: Login Flow
async function example2() {
  const auth = new AuthClient({ baseURL: 'http://localhost:3000' });

  try {
    // Login
    const loginResult = await auth.login(
      'user@example.com',
      'SecurePass123!@#'
    );

    if (loginResult.success) {
      console.log('Logged in:', loginResult.user);

      // Check if authenticated
      if (auth.isAuthenticated()) {
        console.log('User is authenticated');
        console.log('Token:', auth.getToken());
      }

      // Get current session
      const session = await auth.getSession();
      if (session.authenticated) {
        console.log('Current user:', session.user);

        // Check if user is admin
        if (session.user?.role === 'admin') {
          console.log('User has admin privileges');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: Error Handling
async function example3() {
  const auth = new AuthClient({ baseURL: 'http://localhost:3000' });

  try {
    // Try to login with wrong credentials
    const result = await auth.login(
      'user@example.com',
      'WrongPassword123!@#'
    );

    if (!result.success) {
      console.error('Login failed:', result.error);

      // Handle specific errors
      if (result.error?.includes('Too many')) {
        console.error('Rate limited. Please try again later.');
      } else if (result.error?.includes('Invalid email or password')) {
        console.error('Check your credentials.');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Example 4: React Component Usage
/*
function MyComponent() {
  const auth = useAuth('http://localhost:3000');
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    const result = await auth.login('user@example.com', 'SecurePass123!@#');

    if (result.success) {
      setUser(result.user);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setUser(null);
  };

  const fetchProtectedData = async () => {
    const response = await auth.authenticatedFetch('/api/protected');
    return await response.json();
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
*/
