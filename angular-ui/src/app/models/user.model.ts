export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'emp' | 'mgr' | 'hr';
  department: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  role: string;
  department: string;
}
