import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COLLECTION_NAME = 'mits_documents';
const EMBEDDING_MODEL = 'gemini-embedding-001';

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google embedding error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

function sanitizeUrl(url: string): string {
  return url.replace(/^['"]|['"]$/g, '').trim().replace(/\/+$/, '');
}

async function resolveQdrantBaseUrl(qdrantUrl: string, apiKey: string): Promise<string> {
  const sanitized = sanitizeUrl(qdrantUrl);
  const noPort = sanitized.replace(/:(6333|6334)(?=\/|$)/, '');
  const rawCandidates = [
    sanitized,
    noPort,
    `${sanitized}/v1`,
    `${sanitized}/api`,
    `${noPort}/v1`,
    `${noPort}/api`,
    sanitized.endsWith('/v1') ? sanitized.replace(/\/v1$/, '') : '',
    sanitized.endsWith('/api') ? sanitized.replace(/\/api$/, '') : '',
  ].filter(Boolean);

  const candidates = [...new Set(rawCandidates.map((c) => sanitizeUrl(c)))];

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/collections`, {
        method: 'GET',
        headers: { 'api-key': apiKey },
      });
      if (res.status !== 404) return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Qdrant endpoint not reachable. Tried: ${candidates.join(', ')}`);
}

async function searchQdrant(qdrantBaseUrl: string, apiKey: string, queryVector: number[], limit = 5): Promise<any[]> {
  const endpoints = [
    `${qdrantBaseUrl}/collections/${COLLECTION_NAME}/points/search`,
    `${qdrantBaseUrl}/collections/${COLLECTION_NAME}/points/query`,
  ];

  let lastError = '';

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: queryVector,
        limit,
        with_payload: true,
        score_threshold: 0.3,
      }),
    });

    if (response.status === 404) {
      lastError = await response.text();
      continue;
    }

    if (!response.ok) {
      const err = await response.text();
      console.error('Qdrant search error:', err);
      return [];
    }

    const data = await response.json();
    return data.result || [];
  }

  console.error('Qdrant search endpoints returned 404:', lastError);
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const qdrantUrl = Deno.env.get('QDRANT_URL');
    const qdrantKey = Deno.env.get('QDRANT_API_KEY');
    if (!qdrantUrl || !qdrantKey) {
      return new Response(
        JSON.stringify({ success: true, results: [], context: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, limit } = await req.json();
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query);

    // Generate embedding for the query
    const queryVector = await getEmbedding(query);

    // Search Qdrant
    const qdrantBaseUrl = await resolveQdrantBaseUrl(qdrantUrl, qdrantKey);
    const results = await searchQdrant(qdrantBaseUrl, qdrantKey, queryVector, limit || 5);

    // Build context string from results
    const context = results
      .map((r: any) => r.payload?.text || '')
      .filter((t: string) => t.length > 0)
      .join('\n\n---\n\n');

    const sources = results
      .map((r: any) => ({
        source: r.payload?.source || 'unknown',
        type: r.payload?.type || 'unknown',
        score: r.score,
      }))
      .filter((s: any, i: number, arr: any[]) => arr.findIndex(x => x.source === s.source) === i);

    console.log(`Found ${results.length} results from ${sources.length} sources`);

    return new Response(
      JSON.stringify({ success: true, results: sources, context }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ success: true, results: [], context: '', error: error instanceof Error ? error.message : 'Search unavailable' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
