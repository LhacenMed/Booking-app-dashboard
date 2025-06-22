// import { supabase } from "@/supabase/client";
// import { createContext, useContext, useState, useEffect } from "react";
// import { Session } from "@supabase/supabase-js";

// const AuthContext = createContext();
  
// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [session, setSession] = useState<Session | null>(null);

//   // Sign up new user
//   const signUpNewUser = async (email: string, password: string) => {
//     const { data, error } = await supabase.auth.signUp({
//       email: email,
//       password: password,
//     });

//     if (error) {
//       console.error("there was an error signing up", error);
//       return { success: false, error };
//     }
//     return { success: true, data };
//   };

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//     });

//     supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });
//   }, []);

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) {
//       console.error("there was an error signing out: ", error);
//     }
//   };

//   if (!session) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <AuthContext.Provider value={{ session, signUpNewUser, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   )
// };

// export const useAuth = () => {
//   return useContext(AuthContext);
// };