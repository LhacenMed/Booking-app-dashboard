import { auth } from "@/config/firebase";
import { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpNewUser: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  signInUser: (params: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; data?: any; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log("[AuthContext] Initial state:", { user, loading });

  // Sign up new user
  const signUpNewUser = async (email: string, password: string) => {
    console.log("[AuthContext] Attempting to sign up user:", email);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("[AuthContext] Sign up successful:", userCredential.user);
      return { success: true, data: userCredential.user };
    } catch (error: any) {
      console.error("[AuthContext] Sign up error:", error);
      return { success: false, error: error.message };
    }
  };

  // Sign in
  const signInUser = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    console.log("[AuthContext] Attempting to sign in user:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("[AuthContext] Sign in successful:", userCredential.user);
      return { success: true, data: userCredential.user };
    } catch (error: any) {
      console.error("[AuthContext] Sign in error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Sign out
  const signOut = async () => {
    console.log("[AuthContext] Attempting to sign out");
    try {
      await firebaseSignOut(auth);
      console.log("[AuthContext] Sign out successful");
    } catch (error) {
      console.error("[AuthContext] Sign out error:", error);
    }
  };

  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("[AuthContext] Auth state changed:", {
        user: user
          ? {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
            }
          : null,
      });
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log("[AuthContext] Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const contextValue = {
    user,
    loading,
    signUpNewUser,
    signInUser,
    signOut,
  };

  console.log("[AuthContext] Current context value:", {
    user: user
      ? {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      : null,
    loading,
  });

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("[useAuth] Hook used outside of AuthProvider!");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("[useAuth] Hook called, returning context:", {
    user: context.user
      ? {
          uid: context.user.uid,
          email: context.user.email,
          emailVerified: context.user.emailVerified,
        }
      : null,
    loading: context.loading,
  });
  return context;
};
