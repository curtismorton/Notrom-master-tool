import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@shared/schema';
import { auth } from '@/lib/firebase';
import { createUser } from '@/lib/firestore';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut
} from 'firebase/auth';

type FirebaseUser = any; // Not using real Firebase

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo session first - immediate loading
    const demoUserStr = sessionStorage.getItem('demoUser');
    if (demoUserStr) {
      try {
        const demoUser = JSON.parse(demoUserStr);
        setUser(demoUser);
        setLoading(false);
        return;
      } catch (error) {
        sessionStorage.removeItem('demoUser');
      }
    }

    // Set loading to false immediately - no Firebase delays
    setLoading(false);

    // Skip Firebase auth completely in demo mode
    console.log('Auth running in demo mode - Firebase disabled');
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check if we're using demo credentials
    const isDemoUser = email.endsWith('@demo.com') && password === 'password123';
    
    if (isDemoUser) {
      // Create mock user for demo
      const role = email.split('@')[0] as 'admin' | 'staff' | 'client';
      const demoUser: User = {
        id: `demo-${role}-${Date.now()}`,
        email,
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Store in sessionStorage for persistence
      sessionStorage.setItem('demoUser', JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }
    
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile
    const newUser: Omit<User, 'id'> = {
      email,
      name,
      role: 'client',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await createUser({ ...newUser, id: result.user.uid });
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    // Clear demo session if exists
    sessionStorage.removeItem('demoUser');
    setUser(null);
    setFirebaseUser(null);
    
    try {
      await signOut(auth);
    } catch (error) {
      // Ignore Firebase signOut errors in demo mode
      console.log('Firebase signOut skipped in demo mode');
    }
  };

  const value = {
    user,
    firebaseUser,
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
