/**
 * Candidature API Service
 * Provides typed API calls for the candidature multi-step workflow
 */

import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

// Types
export interface CandidatureProgress {
  steps: Record<string, boolean>;
  completed: number;
  total: number;
  percent: number;
}

export interface Candidature {
  id: number;
  user_id: number;
  current_step: number;
  status: "draft" | "submitted" | "blocked" | "approved" | "rejected";
  submitted_at: string | null;
  locked_at: string | null;
  progress: CandidatureProgress;
  created_at: string;
  updated_at: string;
  profile?: CandidatureProfile;
  enseignements?: CandidatureEnseignement[];
  pfes?: CandidaturePfe[];
  activites?: CandidatureActivite[];
  documents?: CandidatureDocument[];
}

export interface CandidatureProfile {
  id: number;
  candidature_id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  etablissement: string;
  ville: string;
  departement: string;
  grade_actuel: string;
  date_recrutement_es: string;
  date_recrutement_fp: string | null;
  numero_som: string | null;
  telephone: string;
  specialite: string;
  a_demande_avancement: boolean;
  a_dossier_en_cours: boolean;
  is_complete: boolean;
  // Backend currently returns an object; keep number for backwards-compat.
  anciennete:
    | number
    | {
        years: number;
        months: number;
        total_months: number;
      };
}

export interface CandidatureEnseignement {
  id: number;
  candidature_id: number;
  annee_universitaire: string;
  intitule: string;
  type_enseignement: "CM" | "TD" | "TP";
  type_module: "Module" | "Element de module";
  niveau: string;
  volume_horaire: number;
  equivalent_tp: number;
}

export interface CandidaturePfe {
  id: number;
  candidature_id: number;
  annee_universitaire: string;
  intitule: string;
  niveau: "DUT" | "Licence" | "Master" | "Ingénieur" | "Doctorat" | "Autre";
  volume_horaire: number;
}

export interface CandidatureActivite {
  id: number;
  candidature_id: number;
  type: "enseignement" | "recherche";
  category: string;
  subcategory: string;
  count: number;
  document?: CandidatureDocument;
}

export interface CandidatureDocument {
  id: number;
  candidature_id: number;
  activite_id: number | null;
  type: string;
  original_name: string;
  mime_type: string;
  size: number;
  is_verified: boolean;
  created_at: string;
}

export interface Deadline {
  id: number;
  stage: string;
  due_at: string;
  due_at_formatted: string;
  days_remaining: number;
  is_expired: boolean;
}

export interface ApiError {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Helper for API requests
async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
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
    const error: ApiError = data ?? {};
    throw new ApiRequestError(
      error.message || error.error || "Request failed",
      response.status,
      error.errors
    );
  }

  return data as T;
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const error: ApiError = data ?? {};
    throw new ApiRequestError(
      error.message || error.error || "Upload failed",
      response.status,
      error.errors
    );
  }

  return data as T;
}

export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }

  getFieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  getAllErrors(): string[] {
    if (!this.errors) return [this.message];
    return Object.values(this.errors).flat();
  }
}

// =============================================================================
// CANDIDATURE API
// =============================================================================

export const candidatureApi = {
  /**
   * Get or create candidature with all related data
   */
  async getCandidature(): Promise<{
    candidature: Candidature;
    progress: CandidatureProgress;
    deadline: Deadline | null;
    is_locked: boolean;
    can_edit: boolean;
  }> {
    return requestJson("/candidat/candidature", { method: "GET" });
  },

  /**
   * Get candidature status and progress
   */
  async getStatus(): Promise<{
    exists: boolean;
    step: number;
    status: string;
    progress?: CandidatureProgress;
    is_locked: boolean;
    submitted_at: string | null;
  }> {
    return requestJson("/candidat/candidature/status", { method: "GET" });
  },

  /**
   * Submit candidature for review
   */
  async submit(): Promise<{ message: string; candidature: Candidature }> {
    return requestJson("/candidat/candidature/submit", { method: "POST" });
  },
};

// =============================================================================
// PROFILE API (Step 1)
// =============================================================================

export const profileApi = {
  /**
   * Get profile data (with user pre-fill if new)
   */
  async getProfile(): Promise<{
    profile: CandidatureProfile | null;
    user: { name: string; email: string };
  }> {
    return requestJson("/candidat/profile", { method: "GET" });
  },

  /**
   * Save complete profile
   */
  async saveProfile(
    data: Omit<CandidatureProfile, "id" | "candidature_id" | "is_complete" | "anciennete">
  ): Promise<{ message: string; profile: CandidatureProfile }> {
    return requestJson("/candidat/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Autosave partial profile data
   */
  async autosave(
    data: Partial<CandidatureProfile>
  ): Promise<{ message: string; profile: CandidatureProfile }> {
    return requestJson("/candidat/profile/autosave", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// =============================================================================
// ENSEIGNEMENTS API (Step 2)
// =============================================================================

export const enseignementsApi = {
  /**
   * Get all enseignements with totals
   */
  async getAll(): Promise<{
    enseignements: CandidatureEnseignement[];
    totals: { volume_horaire: number; equivalent_tp: number; count: number };
    by_year: Record<string, { items: CandidatureEnseignement[]; volume_horaire: number; equivalent_tp: number }>;
  }> {
    return requestJson("/candidat/enseignements", { method: "GET" });
  },

  /**
   * Add a new enseignement
   */
  async add(
    data: Omit<CandidatureEnseignement, "id" | "candidature_id" | "equivalent_tp">
  ): Promise<{ message: string; enseignement: CandidatureEnseignement }> {
    return requestJson("/candidat/enseignements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete an enseignement
   */
  async delete(id: number): Promise<{ message: string }> {
    return requestJson(`/candidat/enseignements/${id}`, { method: "DELETE" });
  },

  /**
   * Bulk save (replace all)
   */
  async bulkSave(
    enseignements: Omit<CandidatureEnseignement, "id" | "candidature_id" | "equivalent_tp">[]
  ): Promise<{ message: string; enseignements: CandidatureEnseignement[] }> {
    return requestJson("/candidat/enseignements/bulk", {
      method: "POST",
      body: JSON.stringify({ enseignements }),
    });
  },
};

// =============================================================================
// PFE API (Step 3)
// =============================================================================

export const pfesApi = {
  /**
   * Get all PFE records with totals
   */
  async getAll(): Promise<{
    pfes: CandidaturePfe[];
    totals: { volume_horaire: number; count: number };
    by_year: Record<string, { items: CandidaturePfe[]; volume_horaire: number }>;
    by_niveau: Record<string, { count: number; volume_horaire: number }>;
  }> {
    return requestJson("/candidat/pfes", { method: "GET" });
  },

  /**
   * Add a new PFE record
   */
  async add(
    data: Omit<CandidaturePfe, "id" | "candidature_id">
  ): Promise<{ message: string; pfe: CandidaturePfe }> {
    return requestJson("/candidat/pfes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a PFE record
   */
  async update(
    id: number,
    data: Partial<Omit<CandidaturePfe, "id" | "candidature_id">>
  ): Promise<{ message: string; pfe: CandidaturePfe }> {
    return requestJson(`/candidat/pfes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a PFE record
   */
  async delete(id: number): Promise<{ message: string }> {
    return requestJson(`/candidat/pfes/${id}`, { method: "DELETE" });
  },

  /**
   * Bulk save (replace all)
   */
  async bulkSave(
    pfes: Omit<CandidaturePfe, "id" | "candidature_id">[]
  ): Promise<{ message: string; pfes: CandidaturePfe[] }> {
    return requestJson("/candidat/pfes/bulk", {
      method: "POST",
      body: JSON.stringify({ pfes }),
    });
  },
};

// =============================================================================
// ACTIVITES API (Steps 4-5)
// =============================================================================

export type ActiviteType = "enseignement" | "recherche";

export interface CategoryDefinitions {
  [category: string]: string[];
}

export const activitesApi = {
  /**
   * Get all activities by type
   */
  async getAll(type: ActiviteType): Promise<{
    activites: CandidatureActivite[];
    by_category: Record<string, { items: CandidatureActivite[]; total_count: number; has_all_documents: boolean }>;
    categories: CategoryDefinitions;
  }> {
    return requestJson(`/candidat/activites?type=${type}`, { method: "GET" });
  },

  /**
   * Save/update a single activity (upsert)
   */
  async save(data: {
    type: ActiviteType;
    category: string;
    subcategory: string;
    count: number;
  }): Promise<{ message: string; activite: CandidatureActivite }> {
    return requestJson("/candidat/activites", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Bulk save activities of a type
   */
  async bulkSave(
    type: ActiviteType,
    activites: { category: string; subcategory: string; count: number }[]
  ): Promise<{ message: string; activites: CandidatureActivite[] }> {
    return requestJson("/candidat/activites/bulk", {
      method: "POST",
      body: JSON.stringify({ type, activites }),
    });
  },

  /**
   * Delete an activity
   */
  async delete(id: number): Promise<{ message: string }> {
    return requestJson(`/candidat/activites/${id}`, { method: "DELETE" });
  },

  /**
   * Get category definitions
   */
  async getCategories(type: ActiviteType): Promise<{ categories: CategoryDefinitions }> {
    return requestJson(`/candidat/activites/categories?type=${type}`, { method: "GET" });
  },
};

// =============================================================================
// DOCUMENTS API
// =============================================================================

export const documentsApi = {
  /**
   * Get all documents
   */
  async getAll(type?: string): Promise<{ documents: CandidatureDocument[] }> {
    const params = type ? `?type=${type}` : "";
    return requestJson(`/candidat/documents${params}`, { method: "GET" });
  },

  /**
   * Upload document for an activity
   */
  async uploadForActivite(
    activiteId: number,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ message: string; document: CandidatureDocument }> {
    const formData = new FormData();
    formData.append("file", file);

    // If progress tracking needed, use XMLHttpRequest
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new ApiRequestError(error.error || "Upload failed", xhr.status, error.errors));
            } catch {
              reject(new ApiRequestError("Upload failed", xhr.status));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new ApiRequestError("Network error", 0));
        });

        xhr.open("POST", `${API_BASE_URL}/candidat/documents/activite/${activiteId}`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    }

    return requestFormData(`/candidat/documents/activite/${activiteId}`, formData);
  },

  /**
   * Upload general document
   */
  async upload(
    file: File,
    type: "profile_pdf" | "enseignements_pdf" | "pfe_pdf" | "signed_document",
    onProgress?: (percent: number) => void
  ): Promise<{ message: string; document: CandidatureDocument }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new ApiRequestError(error.error || "Upload failed", xhr.status, error.errors));
            } catch {
              reject(new ApiRequestError("Upload failed", xhr.status));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new ApiRequestError("Network error", 0));
        });

        xhr.open("POST", `${API_BASE_URL}/candidat/documents`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    }

    return requestFormData("/candidat/documents", formData);
  },

  /**
   * Download document
   */
  async download(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/candidat/documents/${id}/download`, {
      credentials: "include",
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new ApiRequestError(data?.error || "Download failed", response.status);
    }

    return response.blob();
  },

  /**
   * Get inline preview URL
   */
  getPreviewUrl(id: number): string {
    return `${API_BASE_URL}/candidat/documents/${id}/preview`;
  },

  /**
   * Delete a document
   */
  async delete(id: number): Promise<{ message: string }> {
    return requestJson(`/candidat/documents/${id}`, { method: "DELETE" });
  },
};

// =============================================================================
// DEADLINE API (Public)
// =============================================================================

export const deadlinesApi = {
  /**
   * Get active deadlines
   */
  async getActive(): Promise<{ data: Deadline[] }> {
    return requestJson("/deadlines/active", { method: "GET" });
  },
};
