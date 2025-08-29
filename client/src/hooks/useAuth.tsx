import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, createUser } from '@/lib/firestore';
import type { User } from '@shared/schema';

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

    // Set loading to false quickly to show login options
    setLoading(false);

    // Firebase auth with timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('Firebase auth timeout - using demo mode');
      setLoading(false);
    }, 2000); // 2 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeoutId);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let userData = await getUserById(firebaseUser.uid);
          
          if (!userData) {
            // Create user profile if it doesn't exist
            const newUser: Omit<User, 'id'> = {
              email: firebaseUser.email!,
              name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              role: 'client', // Default role
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            
            await createUser({ ...newUser, id: firebaseUser.uid });
            userData = { ...newUser, id: firebaseUser.uid };
          }
          
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Handle Google sign-in redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User signed in successfully
          console.log('Google sign-in successful');
        }
      })
      .catch((error) => {
        console.error('Google sign-in error:', error);
      });

    return unsubscribe;
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
