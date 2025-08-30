
import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo session - immediate loading
    const demoUserStr = sessionStorage.getItem('demoUser');
    if (demoUserStr) {
      try {
        const demoUser = JSON.parse(demoUserStr);
        setUser(demoUser);
      } catch (error) {
        sessionStorage.removeItem('demoUser');
      }
    }
    
    // Always set loading to false immediately - no Firebase delays
    setLoading(false);
    console.log('Demo auth initialized - no Firebase needed');
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check if demo credentials
    const isDemoUser = email.endsWith('@demo.com') && password === 'password123';
    
    if (isDemoUser) {
      const role = email.split('@')[0] as 'admin' | 'staff' | 'client';
      const demoUser: User = {
        id: `demo-${role}-${Date.now()}`,
        email,
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      sessionStorage.setItem('demoUser', JSON.stringify(demoUser));
      setUser(demoUser);
    } else {
      throw new Error('Only demo credentials are supported: use @demo.com emails with password123');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Create demo user for signup
    const demoUser: User = {
      id: `demo-signup-${Date.now()}`,
      email,
      name,
      role: 'client',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    sessionStorage.setItem('demoUser', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const signInWithGoogle = async () => {
    console.log('Google sign-in not available in demo mode');
  };

  const logout = async () => {
    sessionStorage.removeItem('demoUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
