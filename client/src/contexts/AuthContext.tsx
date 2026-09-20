import React, { createContext, useContext, useState, useEffect } from "react";
import { UserDTO, Role } from "../types";
import { apiRequest } from "../api/client";
import { 
  auth, 
  firestore 
} from "../api/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: UserDTO) => void;
  refreshUser: () => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const profile = await apiRequest<UserDTO>("/auth/me");
      setUser(profile);
    } catch (e) {
      console.warn("Failed to refresh user profile:", e);
    }
  };

  const updateUser = (updatedUser: UserDTO) => {
    setUser(updatedUser);
  };

  // Sync Firebase Auth & Backend Session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Check Firestore user doc
          const userDoc = await getDoc(doc(firestore, "users", fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserDTO;
            setUser(data);
          }
        } catch (e) {
          console.warn("Firestore user sync:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await apiRequest<UserDTO>("/auth/me");
        setUser(profile);
      } catch (e) {
        console.warn("Invalid session token, logging out");
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string, role?: Role) => {
    // 1. Authenticate with backend API for JWT & structured DTO
    const res = await apiRequest<{ token: string; user: UserDTO }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });

    localStorage.setItem("auth_token", res.token);
    setToken(res.token);
    setUser(res.user);

    // 2. Authenticate with Firebase Authentication & sync Firestore
    try {
      let fbUserCred;
      try {
        fbUserCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (fbErr: any) {
        if (fbErr.code === "auth/user-not-found" || fbErr.code === "auth/invalid-credential") {
          // If first time in firebase, create account
          fbUserCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        }
      }

      if (fbUserCred && res.user) {
        // Save user profile in Firestore
        await setDoc(doc(firestore, "users", fbUserCred.user.uid), res.user, { merge: true });
      }
    } catch (fbSyncErr) {
      console.warn("Firebase Auth sync warning:", fbSyncErr);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase SignOut error:", e);
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
