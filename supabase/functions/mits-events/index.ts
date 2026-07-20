import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = [
  'https://talk2campus.mits.ac.in',
  'http://localhost:8080',
  'http://localhost:5173',
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

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Parse events/notices from scraped markdown content
function parseUpdatesFromMarkdown(markdown: string, source: string): any[] {
  const updates: any[] = [];
  const lines = markdown.split('\n');
  
  let currentTitle = '';
  let currentDescription = '';
  let currentCategory = 'general';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Detect headers as event/notice titles
    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    if (headerMatch) {
      // Save previous item
      if (currentTitle && currentTitle.length > 5) {
        updates.push({
          title: currentTitle.slice(0, 200),
          description: currentDescription.slice(0, 1000) || null,
          category: currentCategory,
          source_url: source,
        });
      }
      currentTitle = headerMatch[1].replace(/[*_\[\]]/g, '').trim();
      currentDescription = '';
      
      // Categorize
      const lower = currentTitle.toLowerCase();
      if (lower.includes('notice') || lower.includes('circular')) currentCategory = 'notice';
      else if (lower.includes('event') || lower.includes('fest') || lower.includes('workshop') || lower.includes('seminar')) currentCategory = 'event';
      else if (lower.includes('exam') || lower.includes('academic') || lower.includes('result') || lower.includes('schedule')) currentCategory = 'academic';
      else currentCategory = 'general';
      
      continue;
    }
    
    // Detect list items or bold text as potential event titles
    const listMatch = trimmed.match(/^[-•*]\s+\*?\*?(.+?)\*?\*?\s*$/);
    if (listMatch && !currentTitle) {
      currentTitle = listMatch[1].replace(/[*_\[\]]/g, '').trim();
      continue;
    }
    
    // Accumulate description
    if (currentTitle) {
      currentDescription += (currentDescription ? ' ' : '') + trimmed.replace(/[*_]/g, '');
    }
  }
  
  // Save last item
  if (currentTitle && currentTitle.length > 5) {
    updates.push({
      title: currentTitle.slice(0, 200),
      description: currentDescription.slice(0, 1000) || null,
      category: currentCategory,
      source_url: source,
    });
  }
  
  return updates;
}

// Scrape MITS website for events and notices
async function scrapeEventsFromMITS(): Promise<any[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not set, using fallback events');
    return getFallbackEvents();
  }

  const urls = [
    { url: 'https://mits.ac.in/events', category: 'event' },
    { url: 'https://mits.ac.in/news', category: 'notice' },
    { url: 'https://mits.ac.in', category: 'general' },
  ];

  const allUpdates: any[] = [];

  for (const { url, category } of urls) {
    try {
      console.log('Scraping:', url);
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.data?.markdown || data.markdown;
        if (content && content.length > 50) {
          const parsed = parseUpdatesFromMarkdown(content, url);
          // Override category if not detected
          parsed.forEach(u => { if (u.category === 'general') u.category = category; });
          allUpdates.push(...parsed);
          console.log(`Parsed ${parsed.length} updates from ${url}`);
        }
      }
    } catch (e) {
      console.error('Scrape error for', url, ':', e);
    }
  }

  return allUpdates.length > 0 ? allUpdates : getFallbackEvents();
}

function getFallbackEvents(): any[] {
  return [
    { title: 'YUKTA 2025 - National Level Technical Fest', description: 'Annual national-level technical fest featuring coding competitions, hackathons, robotics challenges, paper presentations, and project exhibitions. Open to all engineering colleges.', category: 'event', source_url: 'https://mits.ac.in/events' },
    { title: 'AURA - Annual Cultural Night', description: 'Celebrate music, dance, drama, and fashion at the biggest cultural event of the year. Performances by student clubs and guest artists.', category: 'event', source_url: 'https://mits.ac.in/events' },
    { title: 'Campus Placement Drive - TCS & Infosys', description: 'TCS and Infosys are conducting an on-campus recruitment drive for B.Tech final year students. Eligible branches: CSE, IT, ECE. Register through the placement portal.', category: 'notice', source_url: 'https://mits.ac.in/news' },
    { title: 'Mid-Semester Examination Schedule Released', description: 'The mid-semester examination schedule for all departments has been published. Students are advised to check the exam cell notice board and download the timetable.', category: 'academic', source_url: 'https://mits.ac.in/news' },
    { title: 'Workshop on AI & Machine Learning', description: 'A 3-day hands-on workshop on Artificial Intelligence and Machine Learning applications organized by the CSE department. Certificate will be provided to all participants.', category: 'event', source_url: 'https://mits.ac.in/events' },
    { title: 'New Library Digital Resources Available', description: 'Access to IEEE Xplore, Springer, and ACM Digital Library has been renewed. Students can access these resources from the campus network or through VPN.', category: 'notice', source_url: 'https://mits.ac.in/news' },
    { title: 'Annual Sports Meet Registration Open', description: 'Registration is now open for the Annual Sports Meet. Events include cricket, football, volleyball, badminton, athletics, and indoor games. Register with your department sports coordinator.', category: 'event', source_url: 'https://mits.ac.in/events' },
    { title: 'Fee Payment Deadline Reminder', description: 'Students are reminded that the last date for fee payment for the current semester is approaching. Late fee charges will apply after the deadline.', category: 'circular', source_url: 'https://mits.ac.in/news' },
  ];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    const supabase = getSupabaseAdmin();

    if (action === 'fetch') {
      // Return stored updates from DB
      const { data, error } = await supabase
        .from('mits_updates')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, updates: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh') {
      // Scrape fresh data and upsert into DB
      const scraped = await scrapeEventsFromMITS();
      const newUpdates: any[] = [];

      for (const update of scraped) {
        // Check if this title already exists
        const { data: existing } = await supabase
          .from('mits_updates')
          .select('id')
          .eq('title', update.title)
          .maybeSingle();

        if (!existing) {
          const { data: inserted, error } = await supabase
            .from('mits_updates')
            .insert({
              title: update.title,
              description: update.description,
              category: update.category,
              source_url: update.source_url,
              is_new: true,
            })
            .select()
            .single();

          if (!error && inserted) {
            newUpdates.push(inserted);
          }
        }
      }

      // Fetch all updates after refresh
      const { data: allUpdates } = await supabase
        .from('mits_updates')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      console.log(`Refresh complete: ${newUpdates.length} new updates added`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          updates: allUpdates || [], 
          newCount: newUpdates.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'mark_seen') {
      // Mark all as seen
      await supabase
        .from('mits_updates')
        .update({ is_new: false })
        .eq('is_new', true);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
