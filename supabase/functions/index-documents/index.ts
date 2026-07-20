import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://talk2campus.mits.ac.in',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const COLLECTION_NAME = 'mits_documents';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBEDDING_DIMENSION = 3072; // gemini-embedding-001 outputs 3072 dimensions

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function getEmbedding(text: string, retries = 3): Promise<number[]> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  for (let attempt = 0; attempt < retries; attempt++) {
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

    if (response.status === 429) {
      const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
      continue;
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google embedding error: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.embedding.values;
  }
  throw new Error('Max retries exceeded for embedding');
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

      if (res.status !== 404) {
        console.log(`Resolved Qdrant base URL: ${candidate}`);
        return candidate;
      }

      console.log(`Qdrant candidate returned 404: ${candidate}`);
    } catch (error) {
      console.log(`Qdrant candidate failed: ${candidate}`, error);
    }
  }

  throw new Error(`Qdrant endpoint not reachable. Tried: ${candidates.join(', ')}`);
}

function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap
      const words = current.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      current = overlapWords.join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function ensureCollection(qdrantBaseUrl: string, apiKey: string) {
  const url = qdrantBaseUrl;
  const checkRes = await fetch(`${url}/collections/${COLLECTION_NAME}`, {
    headers: { 'api-key': apiKey },
  });

  if (checkRes.ok) {
    // Check if dimension matches
    const data = await checkRes.json();
    const currentSize = data.result?.config?.params?.vectors?.size;
    if (currentSize && currentSize !== EMBEDDING_DIMENSION) {
      console.log(`Collection dimension mismatch (${currentSize} vs ${EMBEDDING_DIMENSION}), recreating...`);
      await fetch(`${url}/collections/${COLLECTION_NAME}`, {
        method: 'DELETE',
        headers: { 'api-key': apiKey },
      });
    } else {
      return; // Collection exists with correct dimensions
    }
  }

  // Create collection
  console.log('Creating Qdrant collection:', COLLECTION_NAME);
  const createRes = await fetch(`${url}/collections/${COLLECTION_NAME}`, {
    method: 'PUT',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: 'Cosine',
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create collection: ${err}`);
  }
  console.log('Collection created successfully');
}

async function upsertPoints(qdrantBaseUrl: string, apiKey: string, points: any[]) {
  const url = qdrantBaseUrl;
  const response = await fetch(`${url}/collections/${COLLECTION_NAME}/points`, {
    method: 'PUT',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ points }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qdrant upsert error: ${err}`);
  }
}

// Discover PDF links from mits.ac.in using Firecrawl
async function discoverPDFs(): Promise<string[]> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.log('FIRECRAWL_API_KEY not set, using known PDF URLs');
    return getKnownPDFUrls();
  }

  try {
    console.log('Mapping mits.ac.in for PDF links...');
    const mapRes = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://mits.ac.in',
        search: 'pdf',
        limit: 200,
        includeSubdomains: true,
      }),
    });

    if (mapRes.ok) {
      const data = await mapRes.json();
      const links = (data.links || []) as string[];
      const pdfLinks = links.filter((l: string) => l.toLowerCase().endsWith('.pdf'));
      console.log(`Found ${pdfLinks.length} PDF links`);
      if (pdfLinks.length > 0) return pdfLinks;
    }
  } catch (e) {
    console.error('Firecrawl map error:', e);
  }

  // Also try scraping common pages for PDF links
  try {
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://mits.ac.in',
        formats: ['links'],
      }),
    });

    if (scrapeRes.ok) {
      const data = await scrapeRes.json();
      const links = data.data?.links || data.links || [];
      const pdfLinks = links.filter((l: string) => l.toLowerCase().endsWith('.pdf'));
      console.log(`Found ${pdfLinks.length} PDF links from scrape`);
      return pdfLinks.length > 0 ? pdfLinks : getKnownPDFUrls();
    }
  } catch (e) {
    console.error('Scrape error:', e);
  }

  return getKnownPDFUrls();
}

function getKnownPDFUrls(): string[] {
  return [
    'https://mits.ac.in/downloads/academic-calendar.pdf',
    'https://mits.ac.in/downloads/student-handbook.pdf',
    'https://mits.ac.in/downloads/examination-rules.pdf',
    'https://mits.ac.in/downloads/anti-ragging-policy.pdf',
    'https://mits.ac.in/downloads/fee-structure.pdf',
  ];
}

function getFacultyPDFUrls(): string[] {
  return [
    'https://mits.ac.in/assets/pdf/faculty/cse-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/ece-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/eee-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/mech-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/civil-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/it-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/aiml-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/mba-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/mca-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/hss-faculty.pdf',
    'https://mits.ac.in/assets/pdf/faculty/science-faculty.pdf',
  ];
}

function getFacultyWebPages(): string[] {
  return [
    'https://mits.ac.in/faculty',
    'https://mits.ac.in/cse-faculty',
    'https://mits.ac.in/ece-faculty',
    'https://mits.ac.in/eee-faculty',
    'https://mits.ac.in/mech-faculty',
    'https://mits.ac.in/civil-faculty',
    'https://mits.ac.in/it-faculty',
    'https://mits.ac.in/aiml-faculty',
    'https://mits.ac.in/mba-faculty',
    'https://mits.ac.in/mca-faculty',
    'https://mits.ac.in/department/cse',
    'https://mits.ac.in/department/ece',
    'https://mits.ac.in/department/eee',
    'https://mits.ac.in/department/mech',
    'https://mits.ac.in/department/civil',
    'https://mits.ac.in/department/it',
    'https://mits.ac.in/department/aiml',
    'https://mits.ac.in/department/mba',
    'https://mits.ac.in/department/mca',
  ];
}

function getEventsWebPages(): string[] {
  return [
    'https://mits.ac.in/events',
    'https://mits.ac.in/news',
    'https://mits.ac.in/latest-events',
    'https://mits.ac.in/workshops',
    'https://mits.ac.in/seminars',
    'https://mits.ac.in/placements',
    'https://mits.ac.in/placement-records',
    'https://mits.ac.in/achievements',
    'https://mits.ac.in/notices',
    'https://mits.ac.in/circulars',
  ];
}

// Extract text from PDF using Firecrawl scrape (which handles PDFs)
async function extractPDFText(url: string): Promise<string | null> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) return null;

  try {
    console.log('Extracting text from:', url);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        waitFor: 5000,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.data?.markdown || data.markdown;
      if (content && content.length > 50) {
        console.log(`Extracted ${content.length} chars from ${url}`);
        return content;
      }
    }
  } catch (e) {
    console.error('PDF extraction error for', url, ':', e);
  }
  return null;
}

// Scrape web pages for content
async function scrapeWebPages(urls: string[]): Promise<{ url: string; content: string }[]> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) return [];

  const results: { url: string; content: string }[] = [];

  for (const url of urls) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.data?.markdown || data.markdown;
        if (content && content.length > 100) {
          results.push({ url, content });
          console.log(`Scraped ${content.length} chars from ${url}`);
        }
      }
    } catch (e) {
      console.error('Page scrape error:', url, e);
    }
  }

  return results;
}

// Helper to index a list of pages
async function indexPages(
  pages: { url: string; content: string }[],
  qdrantUrl: string, qdrantKey: string,
  type: string, startId: number
): Promise<{ chunks: number; nextId: number }> {
  let totalChunks = 0;
  let pointId = startId;
  for (const page of pages) {
    const chunks = chunkText(page.content);
    for (const chunk of chunks) {
      try {
        await delay(500);
        const embedding = await getEmbedding(chunk);
        await upsertPoints(qdrantUrl, qdrantKey, [{
          id: pointId++,
          vector: embedding,
          payload: {
            text: chunk,
            source: page.url,
            type,
            indexed_at: new Date().toISOString(),
          },
        }]);
        totalChunks++;
      } catch (e) {
        console.error('Embedding error:', e);
      }
    }
  }
  return { chunks: totalChunks, nextId: pointId };
}

// Helper to index PDFs
async function indexPDFs(
  pdfUrls: string[], qdrantUrl: string, qdrantKey: string,
  type: string, startId: number, limit = 10
): Promise<{ chunks: number; nextId: number }> {
  let totalChunks = 0;
  let pointId = startId;
  for (const url of pdfUrls.slice(0, limit)) {
    const text = await extractPDFText(url);
    if (!text) continue;
    const chunks = chunkText(text);
    const fileName = url.split('/').pop() || 'unknown';
    for (const chunk of chunks) {
      try {
        await delay(500);
        const embedding = await getEmbedding(chunk);
        await upsertPoints(qdrantUrl, qdrantKey, [{
          id: pointId++,
          vector: embedding,
          payload: {
            text: chunk,
            source: url,
            type,
            filename: fileName,
            indexed_at: new Date().toISOString(),
          },
        }]);
        totalChunks++;
      } catch (e) {
        console.error('Embedding/upsert error:', e);
      }
    }
  }
  return { chunks: totalChunks, nextId: pointId };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const qdrantUrl = Deno.env.get('QDRANT_URL');
    const qdrantKey = Deno.env.get('QDRANT_API_KEY');
    if (!qdrantUrl || !qdrantKey) {
      throw new Error('Qdrant configuration missing');
    }

    const { action, category } = await req.json();
    const qdrantBaseUrl = await resolveQdrantBaseUrl(qdrantUrl, qdrantKey);

    // category: 'faculty' | 'events' | 'general' | 'all' (default: 'all')
    if (action === 'index') {
      const target = category || 'all';
      console.log(`Starting indexing pipeline for category: ${target}`);
      await ensureCollection(qdrantBaseUrl, qdrantKey);

      let totalChunks = 0;
      let pointId = Date.now();

      if (target === 'faculty' || target === 'all') {
        console.log('--- Indexing faculty data ---');
        // Scrape faculty web pages
        const facultyPages = await scrapeWebPages(getFacultyWebPages());
        const r1 = await indexPages(facultyPages, qdrantBaseUrl, qdrantKey, 'faculty-webpage', pointId);
        totalChunks += r1.chunks;
        pointId = r1.nextId;
        console.log(`Faculty web pages: ${r1.chunks} chunks`);

        // Discover and index faculty PDFs
        const facultyPDFs = getFacultyPDFUrls();
        const r2 = await indexPDFs(facultyPDFs, qdrantBaseUrl, qdrantKey, 'faculty-pdf', pointId, 15);
        totalChunks += r2.chunks;
        pointId = r2.nextId;
        console.log(`Faculty PDFs: ${r2.chunks} chunks`);
      }

      if (target === 'events' || target === 'all') {
        console.log('--- Indexing events data ---');
        const eventsPages = await scrapeWebPages(getEventsWebPages());
        const r3 = await indexPages(eventsPages, qdrantBaseUrl, qdrantKey, 'events-webpage', pointId);
        totalChunks += r3.chunks;
        pointId = r3.nextId;
        console.log(`Events pages: ${r3.chunks} chunks`);
      }

      if (target === 'general' || target === 'all') {
        console.log('--- Indexing general pages ---');
        const generalPages = [
          'https://mits.ac.in/admissions',
          'https://mits.ac.in/academics',
          'https://mits.ac.in/infrastructure',
          'https://mits.ac.in/scholarships',
          'https://mits.ac.in/student-services',
          'https://mits.ac.in/about',
          'https://mits.ac.in/accreditation',
          'https://mits.ac.in/research',
        ];
        const pages = await scrapeWebPages(generalPages);
        const r4 = await indexPages(pages, qdrantBaseUrl, qdrantKey, 'webpage', pointId);
        totalChunks += r4.chunks;
        pointId = r4.nextId;
        console.log(`General pages: ${r4.chunks} chunks`);

        // Also discover and process PDFs from the site
        const pdfUrls = await discoverPDFs();
        console.log(`Discovered ${pdfUrls.length} PDFs, processing up to 10...`);
        const r5 = await indexPDFs(pdfUrls, qdrantBaseUrl, qdrantKey, 'pdf', pointId, 10);
        totalChunks += r5.chunks;
        console.log(`General PDFs: ${r5.chunks} chunks`);
      }

      console.log(`Indexing complete: ${totalChunks} chunks stored for category '${target}'`);
      return new Response(
        JSON.stringify({ success: true, category: target, chunksIndexed: totalChunks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      const endpoint = `${qdrantBaseUrl}/collections/${COLLECTION_NAME}`;
      const res = await fetch(endpoint, {
        headers: { 'api-key': qdrantKey },
      });

      if (res.ok) {
        const data = await res.json();
        return new Response(
          JSON.stringify({ success: true, collection: data.result, endpoint }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, collection: null, endpoint, status: res.status, message: 'Collection not yet created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "index" or "status". Optional category: faculty, events, general, all.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Index error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
