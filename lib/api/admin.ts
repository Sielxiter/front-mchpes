/**
 * Admin API Service
 * Provides typed API calls for admin functionality
 */

import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

// Types
export interface Deadline {
  id: number;
  stage: string;
  due_at: string;
  due_at_formatted: string;
  reminder_enabled: boolean;
  is_expired: boolean;
  days_remaining: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeadlineInput {
  stage: string;
  due_at: string;
  reminder_enabled?: boolean;
}

export interface UpdateDeadlineInput {
  stage?: string;
  due_at?: string;
  reminder_enabled?: boolean;
}

export interface ApiError {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export type UserRole = "Candidat" | "Système" | "Admin" | "Commission" | "Président";

export interface Specialite {
  id: number;
  name: string;
}

export interface CommissionAssignment {
  id: number;
  commission: { id: number | null; specialite: string | null };
  is_president: boolean;
  created_at: string | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface PaginatedMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface AnalyticsOverview {
  totals: {
    dossiers_total: number;
    dossiers_submitted: number;
    candidats_total: number;
  };
  series: Array<{
    date: string;
    dossiers_created: number;
    dossiers_submitted: number;
  }>;
  recent_candidates: Array<{
    id: number;
    name: string;
    email: string;
    created_at: string | null;
  }>;
  by_status: Record<string, number>;
}

export interface AdminSettings {
  app_name: string;
  contact_email: string;
  candidature_open: boolean;
}

export type CandidatureStatus = "draft" | "submitted" | "blocked" | "approved" | "rejected";

export interface AdminCandidature {
  id: number;
  status: CandidatureStatus;
  current_step: number;
  progress: unknown;
  submitted_at: string | null;
  locked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  candidate: {
    id: number | null;
    name: string | null;
    email: string | null;
  };
  profile: {
    specialite: string | null;
    etablissement: string | null;
  } | null;
}

export interface AdminDossier extends Omit<AdminCandidature, "candidate" | "profile"> {
  candidate: {
    id: number | null;
    name: string | null;
    email: string | null;
    role?: UserRole | string | null;
  };
  profile:
    | {
        specialite: string | null;
        etablissement: string | null;
        nom?: string | null;
        prenom?: string | null;
        date_naissance?: string | null;
        numero_som?: string | null;
        telephone?: string | null;
        ville?: string | null;
        departement?: string | null;
        grade_actuel?: string | null;
      }
    | null;
}

export interface AdminDossierDocument {
  id: number;
  type: string;
  category: string;
  original_name: string;
  mime_type: string;
  size: number | null;
  is_verified: boolean;
  created_at: string | null;
  activite:
    | {
        id: number;
        type: string;
        category: string | null;
        subcategory: string | null;
      }
    | null;
}

export interface AdminCommission {
  id: number;
  specialite: string;
  members_count: number;
  created_at: string | null;
}

export interface AdminCommissionUserRow {
  id: number;
  user: { id: number | null; name: string | null; email: string | null; role: UserRole | string | null };
  is_president: boolean;
  created_at: string | null;
}

export interface CreateCandidateUserInput {
  email: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  etablissement: string;
  ville: string;
  departement: string;
  grade_actuel: string;
  date_recrutement_es: string;
  date_recrutement_fp?: string | null;
  numero_som: string;
  telephone: string;
  specialite: string;
}

// Helper for API requests
async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export class AdminApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.errors = errors;
  }

  getFieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        // Cookie-based JWT expired or not sent.
        window.location.href = "/login";
      }
    }

    const error: ApiError = data ?? {};
    throw new AdminApiError(
      error.message || error.error || "Request failed",
      response.status,
      error.errors
    );
  }

  return data as T;
}

async function requestArrayBuffer(
  path: string,
  options: RequestInit = {}
): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/octet-stream",
        ...(options.headers ?? {}),
      },
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok && response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    const error: ApiError = data ?? {};
    throw new AdminApiError(
      error.message || error.error || "Request failed",
      response.status,
      error.errors
    );
  }

  return response.arrayBuffer();
}

// =============================================================================
// DEADLINES API
// =============================================================================

export const deadlinesAdminApi = {
  /**
   * Get all deadlines
   */
  async getAll(): Promise<{ data: Deadline[] }> {
    return requestJson("/admin/deadlines", { method: "GET" });
  },

  /**
   * Get active deadlines only
   */
  async getActive(): Promise<{ data: Deadline[] }> {
    return requestJson("/admin/deadlines/active", { method: "GET" });
  },

  /**
   * Get a single deadline
   */
  async getById(id: number): Promise<{ data: Deadline }> {
    return requestJson(`/admin/deadlines/${id}`, { method: "GET" });
  },

  /**
   * Create a new deadline
   */
  async create(data: CreateDeadlineInput): Promise<{ message: string; data: Deadline }> {
    return requestJson("/admin/deadlines", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a deadline
   */
  async update(
    id: number,
    data: UpdateDeadlineInput
  ): Promise<{ message: string; data: Deadline }> {
    return requestJson(`/admin/deadlines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a deadline
   */
  async delete(id: number): Promise<{ message: string }> {
    return requestJson(`/admin/deadlines/${id}`, { method: "DELETE" });
  },

  /**
   * Send reminder for a deadline
   */
  async sendReminder(id: number): Promise<{ message: string; deadline_id: number }> {
    return requestJson(`/admin/deadlines/${id}/remind`, { method: "POST" });
  },
};

// =============================================================================
// USERS API
// =============================================================================

export const usersAdminApi = {
  async getAll(params?: {
    q?: string;
    role?: UserRole;
    page?: number;
    per_page?: number;
  }): Promise<{ data: AdminUser[]; meta: PaginatedMeta }> {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.role) search.set("role", params.role);
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return requestJson(`/admin/users${suffix}`, { method: "GET" });
  },

  async createCandidate(
    data: CreateCandidateUserInput
  ): Promise<{ message: string; data: AdminUser }> {
    return requestJson(`/admin/users`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name?: string; role?: UserRole }
  ): Promise<{ message: string; data: AdminUser }> {
    return requestJson(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<{ message: string }> {
    return requestJson(`/admin/users/${id}`, { method: "DELETE" });
  },
};

// =============================================================================
// CANDIDATURES (DOSSIERS) API
// =============================================================================

export const candidaturesAdminApi = {
  async getAll(params?: {
    specialite?: string;
    etablissement?: string;
    status?: CandidatureStatus;
  }): Promise<{ data: AdminCandidature[] }> {
    const search = new URLSearchParams();
    if (params?.specialite) search.set("specialite", params.specialite);
    if (params?.etablissement) search.set("etablissement", params.etablissement);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return requestJson(`/admin/candidatures${suffix}`, { method: "GET" });
  },
};

export const dossiersAdminApi = {
  async getAll(params?: {
    specialite?: string;
    etablissement?: string;
    status?: CandidatureStatus;
    page?: number;
    per_page?: number;
  }): Promise<{ data: AdminDossier[]; meta: PaginatedMeta }> {
    const search = new URLSearchParams();
    if (params?.specialite) search.set("specialite", params.specialite);
    if (params?.etablissement) search.set("etablissement", params.etablissement);
    if (params?.status) search.set("status", params.status);
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return requestJson(`/admin/dossiers${suffix}`, { method: "GET" });
  },

  async getById(id: number): Promise<{ data: AdminDossier }> {
    return requestJson(`/admin/dossiers/${id}`, { method: "GET" });
  },

  async getDocuments(
    candidatureId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<{ data: AdminDossierDocument[]; meta: PaginatedMeta }> {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return requestJson(`/admin/dossiers/${candidatureId}/documents${suffix}`, { method: "GET" });
  },

  async downloadDocumentBytes(documentId: number, signal?: AbortSignal): Promise<ArrayBuffer> {
    return requestArrayBuffer(`/admin/documents/${documentId}/download`, {
      method: "GET",
      signal,
    });
  },
};

// =============================================================================
// COMMISSIONS
// =============================================================================

export const commissionsAdminApi = {
  async getAll(): Promise<{ data: AdminCommission[] }> {
    return requestJson(`/admin/commissions`, { method: "GET" });
  },

  async create(specialite: string): Promise<{ message: string; data: AdminCommission }> {
    return requestJson(`/admin/commissions`, {
      method: "POST",
      body: JSON.stringify({ specialite }),
    });
  },

  async getUsers(commissionId: number): Promise<{ data: AdminCommissionUserRow[]; meta: { commission: { id: number; specialite: string }; count: number } }> {
    return requestJson(`/admin/commissions/${commissionId}/users`, { method: "GET" });
  },
};

// =============================================================================
// ANALYTICS
// =============================================================================

export const analyticsAdminApi = {
  async getOverview(params?: { days?: number; recent_limit?: number }): Promise<{ data: AnalyticsOverview }> {
    const search = new URLSearchParams();
    if (params?.days) search.set("days", String(params.days));
    if (params?.recent_limit) search.set("recent_limit", String(params.recent_limit));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return requestJson(`/admin/analytics/overview${suffix}`, { method: "GET" });
  },
};

// =============================================================================
// SETTINGS
// =============================================================================

export const settingsAdminApi = {
  async get(): Promise<{ data: AdminSettings }> {
    return requestJson(`/admin/settings`, { method: "GET" });
  },

  async update(payload: AdminSettings): Promise<{ message: string; data: AdminSettings }> {
    return requestJson(`/admin/settings`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

// =============================================================================
// SPECIALITES
// =============================================================================

export const specialitesAdminApi = {
  async getAll(): Promise<{ data: Specialite[] }> {
    return requestJson(`/admin/specialites`, { method: "GET" });
  },

  async create(name: string): Promise<{ message: string; data: Specialite }> {
    return requestJson(`/admin/specialites`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
};

// =============================================================================
// COMMISSION USER ASSIGNMENTS
// =============================================================================

export const commissionUsersAdminApi = {
  async getForUser(userId: number): Promise<{ data: { user_id: number; assignments: CommissionAssignment[] } }> {
    return requestJson(`/admin/users/${userId}/commission`, { method: "GET" });
  },

  async assignForUser(userId: number, payload: { specialite: string; is_president: boolean }): Promise<{ message: string; data: unknown }> {
    return requestJson(`/admin/users/${userId}/commission`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async removeForUser(userId: number, payload: { specialite: string }): Promise<{ message: string }> {
    return requestJson(`/admin/users/${userId}/commission`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  },
};
