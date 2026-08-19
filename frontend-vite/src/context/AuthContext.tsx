import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../api/auth";
import type { CurrentUser } from "../types/auth";

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = async () => {
    const accessToken = localStorage.getItem("fixtrack_access_token");

    if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      apiLogout();
      setUser(null);
    }
  };

  useEffect(() => {
    reloadUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    await reloadUser();
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, reloadUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider.");
  }

  return context;
}
