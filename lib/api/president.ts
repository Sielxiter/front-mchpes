/**
 * Président API Service
 */

import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

type ApiError = {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

export class PresidentApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "PresidentApiError";
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
    throw new PresidentApiError(
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
    throw new PresidentApiError(
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

export type PresidentDossier = {
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

export type PresidentDossierDocument = {
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

export type PresidentResult = {
  audition_score: number | null;
  final_score: number | null;
  pv_text: string | null;
  validated_at: string | null;
};

export const presidentApi = {
  async getDossiers(params: { page?: number; per_page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));

    return requestJson<{ data: PresidentDossier[]; meta: PaginatedMeta & CommissionMeta }>(
      `/president/dossiers${qs.toString() ? `?${qs}` : ""}`,
      { method: "GET" }
    );
  },

  async getDossierById(candidatureId: number) {
    return requestJson<{ data: PresidentDossier }>(
      `/president/dossiers/${candidatureId}`,
      { method: "GET" }
    );
  },

  async getDocuments(candidatureId: number, params: { page?: number; per_page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));

    return requestJson<{ data: PresidentDossierDocument[]; meta: PaginatedMeta }>(
      `/president/dossiers/${candidatureId}/documents${qs.toString() ? `?${qs}` : ""}`,
      { method: "GET" }
    );
  },

  async downloadDocumentBytes(documentId: number, signal?: AbortSignal) {
    return requestArrayBuffer(`/president/documents/${documentId}/download`, {
      method: "GET",
      signal,
    });
  },

  async getNotes(candidatureId: number) {
    return requestJson<{ data: EvaluationNote[] }>(
      `/president/dossiers/${candidatureId}/notes`,
      { method: "GET" }
    );
  },

  async saveNotes(candidatureId: number, items: Array<{ criterion: string; score: number | null; comment: string | null }>) {
    return requestJson<{ message: string }>(
      `/president/dossiers/${candidatureId}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ items }),
      }
    );
  },

  async getResult(candidatureId: number) {
    return requestJson<{ data: PresidentResult }>(
      `/president/dossiers/${candidatureId}/result`,
      { method: "GET" }
    );
  },

  async saveResult(candidatureId: number, payload: { audition_score: number | null; final_score: number | null; pv_text: string | null }) {
    return requestJson<{ message: string }>(
      `/president/dossiers/${candidatureId}/result`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  async validateFinal(candidatureId: number) {
    return requestJson<{ message: string; data: { validated_at: string | null } }>(
      `/president/dossiers/${candidatureId}/validate`,
      { method: "POST" }
    );
  },
};
