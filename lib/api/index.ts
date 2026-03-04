/**
 * API Module Index
 * Re-exports all API services for convenient imports
 */

// Candidature APIs
export {
  candidatureApi,
  profileApi,
  enseignementsApi,
  pfesApi,
  activitesApi,
  documentsApi,
  generatedDocsApi,
  deadlinesApi,
  ApiRequestError,
} from "./candidature";

export type {
  Candidature,
  CandidatureProfile,
  CandidatureEnseignement,
  CandidaturePfe,
  CandidatureActivite,
  CandidatureDocument,
  Deadline,
  ActiviteType,
  CategoryDefinitions,
  GeneratedDocTypeKey,
  GeneratedDocStatus,
} from "./candidature";

// Commission APIs
export { commissionApi, CommissionApiError } from "./commission";
export type {
  CommissionDossier,
  CommissionDossierDocument,
  EvaluationNote as CommissionEvaluationNote,
  CommissionMeta as CommissionCommissionMeta,
  PaginatedMeta as CommissionPaginatedMeta,
} from "./commission";

// Président APIs
export { presidentApi, PresidentApiError } from "./president";
export type {
  PresidentDossier,
  PresidentDossierDocument,
  EvaluationNote as PresidentEvaluationNote,
  PresidentResult,
  CommissionMeta as PresidentCommissionMeta,
  PaginatedMeta as PresidentPaginatedMeta,
} from "./president";

// Admin APIs
export {
  deadlinesAdminApi,
  usersAdminApi,
  candidaturesAdminApi,
  dossiersAdminApi,
  commissionsAdminApi,
  AdminApiError,
  analyticsAdminApi,
  settingsAdminApi,
  specialitesAdminApi,
  commissionUsersAdminApi,
} from "./admin";

export type {
  Deadline as AdminDeadline,
  CreateDeadlineInput,
  UpdateDeadlineInput,
  AdminUser,
  UserRole,
  CreateCandidateUserInput,
  AdminCandidature,
  AdminDossier,
  AdminDossierDocument,
  AdminCommission,
  AdminCommissionUserRow,
  PaginatedMeta,
  CandidatureStatus,
  AnalyticsOverview,
  AdminSettings,
  Specialite as AdminSpecialite,
  CommissionAssignment,
} from "./admin";
