export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'intern' | 'researcher' | 'evaluator' | 'guest';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string, email: string, role?: User['role']) => void;
  loginAsGuest: (customName?: string) => void;
  logout: () => void;
}
