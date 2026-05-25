import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { isAbortError, setUnauthorizedHandler } from '@/api/client';
import * as authApi from '../api/auth';
import { TOKEN_KEY, USER_KEY } from '../api/config';
import { UserRole, UserRoleType } from '../constants/userRole';
import { components } from '../api/schema';

type LoginDto = components['schemas']['LoginDto'];
type RegisterDto = components['schemas']['RegisterDto'];

export interface AuthContextType {
  token: string | null;
  user: authApi.PublicUserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  hasRole: (roles: UserRoleType[]) => boolean;
  bootstrapping: boolean;
  bootstrap: (options?: RequestInit) => Promise<void>;
  login: (payload: LoginDto) => Promise<authApi.PublicUserDto>;
  register: (payload: RegisterDto) => Promise<authApi.PublicUserDto>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readStoredAuth(): { token: string | null; user: authApi.PublicUserDto | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!token || !rawUser) return { token: null, user: null };
  try {
    return { token, user: JSON.parse(rawUser) };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readStoredAuth();
  const [token, setToken] = useState<string | null>(stored.token);
  const [user, setUser] = useState<authApi.PublicUserDto | null>(stored.user);
  const [bootstrapping, setBootstrapping] = useState<boolean>(!!stored.token);

  const persistAuth = useCallback((accessToken: string, authUser: authApi.PublicUserDto) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setToken(accessToken);
    setUser(authUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    return () => setUnauthorizedHandler(() => {});
  }, [clearAuth]);

  const bootstrap = useCallback(
    async (options?: RequestInit) => {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setBootstrapping(false);
        return;
      }
      try {
        const me = await authApi.fetchMe(options);
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch (err) {
        if (!isAbortError(err)) {
          clearAuth();
        }
      } finally {
        if (!options?.signal?.aborted) {
          setBootstrapping(false);
        }
      }
    },
    [clearAuth],
  );

  const login = useCallback(
    async (payload: LoginDto) => {
      const data = await authApi.login(payload);
      persistAuth(data.access_token, data.user);
      return data.user;
    },
    [persistAuth],
  );

  const register = useCallback(
    async (payload: RegisterDto) => {
      const data = await authApi.register(payload);
      persistAuth(data.access_token, data.user);
      return data.user;
    },
    [persistAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === UserRole.ADMIN,
      isDriver: user?.role === UserRole.DRIVER,
      hasRole: (roles: UserRoleType[]) => !!user && roles.includes(user.role as UserRoleType),
      bootstrapping,
      bootstrap,
      login,
      register,
      logout,
    }),
    [token, user, bootstrapping, bootstrap, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
