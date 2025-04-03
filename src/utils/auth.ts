import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";

export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store auth data in localStorage
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      })
    );

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign in",
    };
  }
};
