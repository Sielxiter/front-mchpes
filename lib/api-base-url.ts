export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Backend is configured with apiPrefix: '' (no /api).
  // Accept both values:
  // - http://localhost:8000
  // - http://localhost:8000/api
  const trimmed = (raw && raw.trim().length > 0 ? raw.trim() : "http://localhost:8000").replace(
    /\/+$/,
    ""
  );

  if (trimmed.endsWith("/api")) {
    return trimmed.slice(0, -"/api".length);
  }

  return trimmed;
}
