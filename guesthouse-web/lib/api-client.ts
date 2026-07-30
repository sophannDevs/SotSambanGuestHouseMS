import { useAuthStore } from "@/lib/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Refresh tokens are single-use and rotated server-side (see AuthService#refreshToken) —
// presenting an already-used one revokes the whole session family. Concurrent 401s must
// share one in-flight refresh instead of each spending the same refresh token.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, user, setSession, clearSession } = useAuthStore.getState();

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      clearSession();
      return null;
    }

    const refreshData = await refreshResponse.json();
    if (!refreshData.success || !refreshData.data) {
      clearSession();
      return null;
    }

    const newAccessToken = refreshData.data.accessToken;
    const newRefreshToken = refreshData.data.refreshToken;

    if (user) {
      setSession(user, newAccessToken, newRefreshToken);
    }

    return newAccessToken;
  } catch {
    clearSession();
    return null;
  }
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, { ...options, headers });

  // Handle Token Expiry & Silent Refresh
  if (response.status === 401 && useAuthStore.getState().refreshToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;

    if (newAccessToken) {
      // Retry original request with new token
      headers["Authorization"] = `Bearer ${newAccessToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      window.location.href = "/login";
    }
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data.data;
}
