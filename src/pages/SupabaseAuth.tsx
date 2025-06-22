import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

export default function SupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/supabase-auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/supabase-auth");
      }
      console.log(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/supabase-auth",
      },
    });

    if (error) {
      console.error("Error signing up:", error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        {/* <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
        /> */}
        <button
          onClick={signUp}
          className="text-white bg-blue-500 p-2 rounded-md"
        >
          Sign Up with Google
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-4 justify-center items-center h-screen bg-black">
        <img
          src={session?.user?.user_metadata?.avatar_url}
          alt="User Avatar"
          className="w-20 h-20 rounded-full"
        />
        <h1 className="text-white">
          Welcome, {session?.user?.user_metadata?.full_name}
        </h1>
        <h2 className="text-white">You are logged in!</h2>
        <button
          onClick={signOut}
          className="text-white bg-red-500 p-2 rounded-md"
        >
          Sign Out
        </button>
      </div>
    );
  }
}
