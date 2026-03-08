// ─────────────────────────────────────────────────────────────────
//  ForgeTomorrow — Search Client
//  Lives in your Next.js app (Vercel), calls the Render service.
// ─────────────────────────────────────────────────────────────────

export type EntityType = 'jobs' | 'candidates';

export interface SearchQuery {
  query: string;
  entity: EntityType;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  context?: string;
}

export interface SearchResult {
  id: string | number;
  entity: EntityType;
  score: number;
  matchReasons?: string[];
  data: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: {
    raw: string;
    normalized: string;
    terms: string[];
    phrases: string[];
  };
  executionMs: number;
}

export async function searchService(query: SearchQuery): Promise<SearchResponse> {
  const searchServiceUrl = process.env.SEARCH_SERVICE_URL;
  const searchServiceApiKey = process.env.SEARCH_SERVICE_API_KEY;

  if (!searchServiceUrl) {
    throw new Error('Missing env var: SEARCH_SERVICE_URL');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (searchServiceApiKey) {
    headers['x-api-key'] = searchServiceApiKey;
  }

  const res = await fetch(`${searchServiceUrl}/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify(query),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Search service error ${res.status}: ${err.error ?? 'Unknown'}`);
  }

  return res.json() as Promise<SearchResponse>;
}