import { getApiBaseUrl } from "./api-base-url";

export type UserRole = "Candidat" | "Système" | "Admin" | "Commission" | "Président";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

const API_BASE_URL = getApiBaseUrl();

const roleRedirects: Record<UserRole, string> = {
  Candidat: "/candidat",
  "Système": "/systeme",
  Admin: "/admin",
  Commission: "/commission",
  "Président": "/president",
};

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message = data?.message ?? "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await requestJson<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return data.user;
}

export async function logout(): Promise<void> {
  await requestJson("/auth/logout", { method: "POST" });
}

export async function me(): Promise<AuthUser> {
  const data = await requestJson<{ user: AuthUser }>("/auth/me", {
    method: "GET",
  });

  return data.user;
}

export function googleStart(): void {
  window.location.href = `${API_BASE_URL}/auth/google/redirect`;
}

export function redirectForRole(role: UserRole): string {
  return roleRedirects[role] ?? "/login";
}
