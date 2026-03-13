'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<any>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Force local persistence to ensure login sticks on mobile
        await setPersistence(auth, browserLocalPersistence);
        
        // Handle redirect result for mobile logins
        const result = await getRedirectResult(auth);
        if (result?.user && isMounted) {
          setUser(result.user);
        }
      } catch (err) {
        console.error("Auth initialization/redirect error:", err);
      }

      // Listen for all auth state changes
      const unsub = onAuthStateChanged(auth, (u) => {
        if (isMounted) {
          setUser(u);
          setLoading(false);
        }
      });

      return unsub;
    };

    const cleanupPromise = initializeAuth();

    return () => {
      isMounted = false;
      cleanupPromise.then(unsub => unsub?.());
    };
  }, []);

  const loginWithGoogle = async () => {
    // Better mobile support for Google login
    // Some mobile browsers block popups or fail to return state to the opening window.
    // Redirect is significantly more reliable on mobile devices.
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      return await signInWithRedirect(auth, googleProvider);
    } else {
      try {
        return await signInWithPopup(auth, googleProvider);
      } catch (err: any) {
        // Fallback for desktop browsers blocking popups
        if (err.code === 'auth/popup-blocked') {
          return await signInWithRedirect(auth, googleProvider);
        }
        throw err;
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (res.user) {
      await updateProfile(res.user, { displayName });
      // Reload user to get updated profile
      await res.user.reload();
      setUser(auth.currentUser);
    }
  };

  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, updateUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);