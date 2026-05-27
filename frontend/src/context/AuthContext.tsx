import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/api/client';
import * as authApi from '@/api/services/auth/requests';
import { TOKEN_KEY, USER_KEY } from '../api/config';
import { UserRole, UserRoleType } from '../constants/userRole';
import { components } from '../api/schema';

type LoginDto = components['schemas']['LoginDto'];

export interface AuthContextType {
  token: string | null;
  user: authApi.PublicUserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  hasRole: (roles: UserRoleType[]) => boolean;
  bootstrapping: boolean;
  bootstrap: () => Promise<void>;
  login: (payload: LoginDto) => Promise<authApi.PublicUserDto>;
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
  const queryClient = useQueryClient();

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    queryClient.setQueryData(['me'], null);
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    return () => setUnauthorizedHandler(() => {});
  }, [clearAuth]);

  const {
    data: user = null,
    isLoading: bootstrapping,
    refetch,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      return me;
    },
    enabled: !!token,
    retry: false, // Don't retry on 401
    initialData: stored.user,
  });

  const persistAuth = useCallback(
    (accessToken: string, authUser: authApi.PublicUserDto) => {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setToken(accessToken);
      queryClient.setQueryData(['me'], authUser);
    },
    [queryClient],
  );

  const bootstrap = useCallback(async () => {
    if (token) {
      await refetch();
    }
  }, [token, refetch]);

  const login = useCallback(
    async (payload: LoginDto) => {
      const data = await authApi.login(payload);
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
      bootstrapping: bootstrapping && !user, // Only true if we don't have initial data
      bootstrap,
      login,
      logout,
    }),
    [token, user, bootstrapping, bootstrap, login, logout],
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
