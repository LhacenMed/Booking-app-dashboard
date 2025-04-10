import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/config/firebase";

// Simple hook to manage authentication state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
