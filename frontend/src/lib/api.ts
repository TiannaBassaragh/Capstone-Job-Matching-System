const API_BASE_URL = 'http://localhost:8000';

// Types based on backend schemas
export interface RegisterRequest {
  f_name: string;
  l_name: string;
  email: string;
  password: string;
  account_type: 'applicant' | 'recruiter';
  company_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  user_id: number;
  f_name: string;
  l_name: string;
  email: string;
  account_type: string;
  created_at: string;
}

export interface MeResponse {
  user_id: number;
  f_name: string;
  l_name: string;
  email: string;
  account_type: string;
  created_at: string;
  candidate_id?: number;
  employer_id?: number;
  company_name?: string;
}

// Auth API calls
export const authAPI = {
  register: async (data: RegisterRequest): Promise<{ message: string; user_id: number }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },
};

// Users API calls
export const usersAPI = {
  getMe: async (token: string): Promise<MeResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user info');
    }

    return response.json();
  },

  updateMe: async (token: string, data: Partial<{ f_name: string; l_name: string; email: string; password: string }>): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user');
    }

    return response.json();
  },
};

// Add more API modules as needed (jobs, resumes, matches, competencies)