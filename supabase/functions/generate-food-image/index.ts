import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://talk2campus.mits.ac.in',
  'http://localhost:8080',
  'http://localhost:5173',
  'https://talk2campusmits.vercel.app'
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
const allowedOrigin = (ALLOWED_ORIGINS.includes(origin) || isVercelPreview)
  ? origin
  : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { itemName, category } = await req.json();

    if (!itemName || typeof itemName !== 'string' || itemName.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid item name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const categoryHint = category === 'drinks' ? 'beverage' : category === 'snacks' ? 'snack' : 'dish';
    const prompt = `A professional, appetizing food photography of "${itemName}" (Indian ${categoryHint}). Top-down view on a clean plate, warm lighting, high quality, restaurant style presentation. Clean white background.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(JSON.stringify({ error: 'Image generation failed', imageUrl: null }), {
        status: 200, // Don't block item creation
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error', imageUrl: null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
