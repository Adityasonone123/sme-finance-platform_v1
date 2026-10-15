import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  LoginData,
  RegisterData,
  loginUser,
  registerUser,
  getMe,
  logoutUser,
} from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<UserProfile>;
  register: (data: RegisterData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getMe();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: LoginData): Promise<UserProfile> => {
    const loggedInUser = await loginUser(credentials);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const register = async (data: RegisterData): Promise<UserProfile> => {
    const registeredUser = await registerUser(data);
    setUser(registeredUser);
    setIsAuthenticated(true);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
