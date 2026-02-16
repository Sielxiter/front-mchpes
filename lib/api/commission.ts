/**
 * Commission API Service
 */

import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

type ApiError = {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

export class CommissionApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "CommissionApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const error: ApiError = data ?? {};
    throw new CommissionApiError(
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

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }

    const data = await parseJsonSafe(response);
    const error: ApiError = data ?? {};
    throw new CommissionApiError(
      error.message || error.error || "Download failed",
      response.status,
      error.errors
    );
  }

  return await response.arrayBuffer();
}

export type CommissionMeta = {
  commission: { id: number; specialite: string } | null;
};

export type PaginatedMeta = {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type CommissionDossier = {
  id: number;
  status: string;
  current_step: number;
  submitted_at: string | null;
  locked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  candidate: { id: number | null; name: string | null; email: string | null; role?: string | null };
  profile: { specialite: string | null; etablissement: string | null; nom?: string | null; prenom?: string | null } | null;
};

export type CommissionDossierDocument = {
  id: number;
  type: string;
  category: string;
  original_name: string;
  mime_type: string;
  size: number | null;
  is_verified: boolean;
  created_at: string | null;
  activite: {
    id: number;
    type: string;
    category: string | null;
    subcategory: string | null;
  } | null;
};

export type EvaluationNote = {
  criterion: string;
  score: number | null;
  comment: string | null;
  updated_at?: string | null;
};

export const commissionApi = {
  async getDossiers(params: { page?: number; per_page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));

    return requestJson<{ data: CommissionDossier[]; meta: PaginatedMeta & CommissionMeta }>(
      `/commission/dossiers${qs.toString() ? `?${qs}` : ""}`,
      { method: "GET" }
    );
  },

  async getDossierById(candidatureId: number) {
    return requestJson<{ data: CommissionDossier }>(
      `/commission/dossiers/${candidatureId}`,
      { method: "GET" }
    );
  },

  async getDocuments(candidatureId: number, params: { page?: number; per_page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));

    return requestJson<{ data: CommissionDossierDocument[]; meta: PaginatedMeta }>(
      `/commission/dossiers/${candidatureId}/documents${qs.toString() ? `?${qs}` : ""}`,
      { method: "GET" }
    );
  },

  async downloadDocumentBytes(documentId: number, signal?: AbortSignal) {
    return requestArrayBuffer(`/commission/documents/${documentId}/download`, {
      method: "GET",
      signal,
    });
  },

  async getNotes(candidatureId: number) {
    return requestJson<{ data: EvaluationNote[] }>(
      `/commission/dossiers/${candidatureId}/notes`,
      { method: "GET" }
    );
  },

  async saveNotes(candidatureId: number, items: Array<{ criterion: string; score: number | null; comment: string | null }>) {
    return requestJson<{ message: string }>(
      `/commission/dossiers/${candidatureId}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ items }),
      }
    );
  },
};
