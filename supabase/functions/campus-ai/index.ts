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

// ─── IP Rate Limiting ─────────────────────────────────────────────────────────
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_COUNT = 30;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(req: Request): boolean {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_COUNT) return true;
  entry.count++;
  return false;
}

// Complete MITS Campus Data
const campusData = {
  buildings: {
    'main-block': {
      name: 'Main Academic Block',
      shortName: 'MAB',
      type: 'academic',
      description: 'Central administrative building with principal office, examination cell, and general classrooms',
      timings: '8:00 AM - 6:00 PM',
      landmarks: ['Main Entrance', 'Flag Post'],
      floors: {
        ground: ['Reception', 'Principal Office', 'Vice Principal Office', 'Examination Cell', 'Conference Hall'],
        first: ['Classroom 101-103', 'Faculty Room', 'Seminar Hall 1'],
        second: ['Classroom 201-203', 'HOD Office - Humanities']
      }
    },
    'cse-block': {
      name: 'Computer Science & Engineering Block',
      shortName: 'CSE',
      type: 'academic',
      description: 'Houses CSE, IT, and AI&ML departments with modern computer labs',
      timings: '8:00 AM - 8:00 PM',
      landmarks: ['Near Main Gate', 'Adjacent to Library'],
      floors: {
        ground: ['Programming Lab 1 & 2', 'Internet Lab', 'Server Room'],
        first: ['CSE Classrooms', 'HOD Office - CSE', 'AI & ML Lab'],
        second: ['IT Classrooms', 'HOD Office - IT', 'Software Lab', 'Project Lab'],
        third: ['AI&ML Classroom', 'Data Science Lab', 'Research Lab', 'CSE Seminar Hall']
      }
    },
    'ece-block': {
      name: 'Electronics & Communication Block',
      shortName: 'ECE',
      type: 'academic',
      description: 'Electronics, Communication, and EEE departments with advanced electronics labs',
      timings: '8:00 AM - 6:00 PM',
      landmarks: ['Behind Main Block', 'Near Workshop'],
      floors: {
        ground: ['Basic Electronics Lab', 'Digital Electronics Lab', 'Communication Lab'],
        first: ['ECE Classrooms', 'HOD Office - ECE', 'Microprocessor Lab'],
        second: ['EEE Classrooms', 'HOD Office - EEE', 'Electrical Machines Lab', 'Power Electronics Lab']
      }
    },
    'mech-block': {
      name: 'Mechanical Engineering Block',
      shortName: 'MECH',
      type: 'academic',
      description: 'Mechanical and Civil engineering with workshops',
      timings: '8:00 AM - 6:00 PM',
      landmarks: ['Near Sports Ground', 'Adjacent to Workshop'],
      floors: {
        ground: ['Machine Shop', 'Welding Shop', 'Foundry', 'Carpentry Shop'],
        first: ['MECH Classrooms', 'HOD Office - MECH', 'CAD/CAM Lab'],
        second: ['Civil Classrooms', 'HOD Office - Civil', 'Surveying Lab', 'Material Testing Lab']
      }
    },
    'library': {
      name: 'Central Library',
      shortName: 'LIB',
      type: 'facility',
      description: 'Three-story library with digital resources, reading halls, and research sections',
      timings: '8:00 AM - 10:00 PM',
      contact: 'library@mits.ac.in',
      landmarks: ['Main Entrance Left Side', 'Near CSE Block'],
      floors: {
        ground: ['Issue/Return Counter', 'General Reading Hall (150 seats)', 'Newspaper Section', 'Reference Section'],
        first: ['Digital Library (50 computers)', 'E-Journals Section', 'Engineering Books', 'Science Books'],
        second: ['Research Section', 'Project Work Area', 'Discussion Rooms', 'Archives']
      }
    },
    'cafeteria': {
      name: 'Central Cafeteria',
      shortName: 'CAFE',
      type: 'amenity',
      description: 'Main food court with multiple food stalls',
      timings: '7:00 AM - 9:00 PM',
      landmarks: ['Center of Campus', 'Near Hostels'],
      facilities: ['South Indian Counter', 'North Indian Counter', 'Fast Food Corner', 'Juice & Snacks', 'Seating for 300']
    },
    'auditorium': {
      name: 'Main Auditorium',
      shortName: 'AUDI',
      type: 'facility',
      description: 'AC auditorium for seminars, cultural events, and convocation. Capacity: 1500+',
      timings: 'Event-based',
      contact: 'events@mits.ac.in',
      landmarks: ['Behind Main Block', 'Near Parking']
    },
    'boys-hostel': {
      name: 'Boys Hostel (Block A & B)',
      shortName: 'BH',
      type: 'hostel',
      description: 'Boys hostels with single, double, and triple occupancy rooms',
      timings: '24/7',
      contact: 'warden.bh@mits.ac.in',
      landmarks: ['West Campus', 'Near Main Gate Exit'],
      facilities: ['Warden Office', 'Common Room', 'Dining Hall', 'TV Room', 'Wi-Fi']
    },
    'girls-hostel': {
      name: 'Girls Hostel',
      shortName: 'GH',
      type: 'hostel',
      description: 'Girls hostel with modern amenities and 24/7 security',
      timings: '24/7',
      contact: 'warden.gh@mits.ac.in',
      landmarks: ['East Campus', 'Near Sports Complex'],
      facilities: ['Warden Office', 'Common Room', 'Dining Hall', 'Guest Room', 'Wi-Fi']
    },
    'sports-complex': {
      name: 'Sports Complex',
      shortName: 'SPORTS',
      type: 'sports',
      description: 'Indoor and outdoor sports facilities',
      timings: '6:00 AM - 8:00 PM',
      contact: 'sports@mits.ac.in',
      facilities: ['Gymnasium', 'Indoor Badminton Court', 'Table Tennis', 'Basketball Court', 'Cricket Ground', 'Volleyball Court']
    },
    'placement-cell': {
      name: 'Training & Placement Cell',
      shortName: 'TPC',
      type: 'admin',
      description: 'Career guidance, training programs, and campus placement coordination',
      timings: '9:00 AM - 5:00 PM',
      contact: 'placement@mits.ac.in',
      landmarks: ['Main Block Adjacent', 'First Floor'],
      facilities: ['TPO Office', 'Interview Rooms', 'Group Discussion Hall', 'Pre-Placement Talk Room']
    },
    'kk-block': {
      name: 'KK Block',
      shortName: 'KK Block',
      type: 'academic',
      description: 'MCA & MBA department block with 4 floors, lift and staircase access',
      timings: '8:00 AM - 6:00 PM',
      landmarks: ["Near Ekadant's Cafe", 'Near Circular Block'],
      departments: ['MCA', 'MBA'],
      floors: {
        ground: ['Main Entrance Lobby', 'B.Tech Classroom Area', 'Auditorium Entrance', 'Lift', 'Staircase'],
        first: ['MCA First Year Classroom', 'Computer Lab', 'HOD Office (MCA)', 'Lift', 'Staircase'],
        second: ['MCA Second Year Classroom', 'MBA Second Year Classroom', 'Staff Room', 'Vice Principal Office', 'Lift', 'Staircase'],
        third: ['MBA First Year Classroom', 'Faculty Rooms', 'Lift', 'Staircase']
      },
      indoorNavigation: {
        available: true,
        verticalAccess: ['Lift', 'Staircase'],
        directions: {
          'HOD Office': 'Enter KK Block → Take lift/stairs to 1st floor → Walk toward Computer Lab corridor → HOD Office is beside the lab.',
          'Vice Principal Office': 'Enter KK Block → Go to 2nd floor → Walk toward Staff Room corridor → Vice Principal Office is next to Staff Room.',
          'MBA First Year': 'Enter KK Block → Take lift/stairs to 3rd floor → Walk toward MBA classroom section.',
          'Computer Lab': 'Enter KK Block → Take lift/stairs to 1st floor → Computer Lab is in the center of the corridor.',
        }
      }
    },
    'admin-block': {
      name: 'Admin Block (Main Block)',
      shortName: 'Admin Block',
      type: 'admin',
      description: 'Straight corridor layout. Adjacent to Lakshmi Block. Rooms in order: Reception, Chairman Office, Accounts Section, Vice Principal Office, Student Welfare Office, International Affairs Office, Men\'s Restroom, Stationery Room.',
      timings: '8:00 AM - 6:00 PM',
      landmarks: ['Center of campus', 'Near NPN Block', 'Adjacent to Lakshmi Block'],
      layout: 'straight_corridor',
      adjacentBuilding: 'Lakshmi Block',
      rooms: ['Reception', 'Chairman Office', 'Accounts Section', 'Vice Principal Office', 'Student Welfare Office', 'International Affairs Office', "Men's Restroom", 'Stationery Room'],
      indoorNavigation: {
        available: true,
        directions: {
          'Chairman Office': 'Enter Admin Block → Walk straight from reception → Chairman Office is next.',
          'Vice Principal Office': 'Enter Admin Block → Walk straight from reception → Pass Chairman Office and Accounts Section → Vice Principal Office is next.',
          'Student Welfare Office': 'Enter Admin Block → Walk straight → Pass Chairman Office, Accounts, VP Office → Student Welfare is next.',
          'International Affairs': 'Enter Admin Block → Walk straight → Pass all offices up to Student Welfare → International Affairs is next.',
          'Stationery Room': 'Enter Admin Block → Walk straight along corridor → Pass all offices and restroom → Stationery Room is the last room near Lakshmi Block.',
        }
      }
    }
  },
  events: [
    { name: 'Tech Fest 2025 - YUKTA', date: 'March 15-17, 2025', venue: 'Main Auditorium & Campus' },
    { name: 'Cultural Night - AURA', date: 'February 28, 2025', venue: 'Open Air Theatre' },
    { name: 'Sports Meet', date: 'January 20-22, 2025', venue: 'Sports Complex' },
    { name: 'Placement Drives', date: 'Ongoing (Aug-March)', venue: 'Placement Cell' },
    { name: 'Annual Convocation', date: 'April 2025', venue: 'Main Auditorium' }
  ],
  departments: ['CSE', 'IT', 'AI&ML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'],
  quickInfo: {
    principal: 'Dr. C. Yuvaraj',
    website: 'www.mits.ac.in',
    location: 'Madanapalle, Andhra Pradesh',
    established: '1998',
    affiliation: 'JNTUA Anantapur',
    accreditation: 'NAAC A+ Grade'
  }
};

// Direction helper
const getDirections = (from: string, to: string): string => {
  const buildings: Record<string, { x: number; y: number }> = {
    'main gate': { x: 50, y: 10 },
    'main block': { x: 50, y: 30 },
    'mab': { x: 50, y: 30 },
    'library': { x: 25, y: 30 },
    'lib': { x: 25, y: 30 },
    'cse block': { x: 30, y: 40 },
    'cse': { x: 30, y: 40 },
    'ece block': { x: 70, y: 40 },
    'ece': { x: 70, y: 40 },
    "ekadant's cafe": { x: 86, y: 42 },
    'ekadants': { x: 86, y: 42 },
    'ekadant': { x: 86, y: 42 },
    'lickies': { x: 90, y: 42 },
    'ice cream': { x: 90, y: 42 },
    'main canteen': { x: 8, y: 38 },
    'canteen': { x: 8, y: 38 },
    'cafeteria': { x: 8, y: 38 },
    'auditorium': { x: 60, y: 25 },
    'audi': { x: 60, y: 25 },
    'sports': { x: 85, y: 70 },
    'gym': { x: 85, y: 70 },
    'placement': { x: 55, y: 35 },
    'tpc': { x: 55, y: 35 },
    'boys hostel': { x: 22, y: 72 },
    'bh': { x: 22, y: 72 },
    'girls hostel': { x: 75, y: 70 },
    'gh': { x: 75, y: 70 },
    'mech block': { x: 80, y: 55 },
    'mech': { x: 80, y: 55 },
    'admin': { x: 40, y: 25 },
  };

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  
  const fromPos = Object.entries(buildings).find(([k]) => fromLower.includes(k))?.[1];
  const toPos = Object.entries(buildings).find(([k]) => toLower.includes(k))?.[1];

  if (!fromPos || !toPos) return "I couldn't find those locations. Try using building names like Library, CSE Block, Cafeteria, or Auditorium.";

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  
  let direction = '';
  if (Math.abs(dx) > Math.abs(dy)) {
    direction = dx > 0 ? 'head east (right)' : 'head west (left)';
  } else {
    direction = dy > 0 ? 'walk south (towards back of campus)' : 'walk north (towards main gate)';
  }

  return `From ${from}, ${direction}. It's about a ${Math.round(Math.sqrt(dx*dx + dy*dy) / 10)} minute walk.`;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (isRateLimited(req)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } },
    );
  }


  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI configuration missing');
    }

    const { message, type, topicContext, memoryContext, userLanguage, mode } = await req.json();
    console.log(`Processing ${type} request:`, message, `language: ${userLanguage || 'auto'}`, `mode: ${mode || 'student'}`);

    // --- RAG: Vector search for document-grounded context ---
    let documentContext = '';
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const searchRes = await fetch(`${supabaseUrl}/functions/v1/vector-search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: message, limit: 4 }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.context && searchData.context.length > 50) {
            documentContext = searchData.context;
            console.log(`RAG: Retrieved ${documentContext.length} chars from ${searchData.results?.length || 0} sources`);
          }
        }
      }
    } catch (e) {
      console.error('RAG search error (non-fatal):', e);
    }

    if (topicContext) {
      console.log('With topic context:', topicContext.substring(0, 200) + '...');
    }

    const campusContext = {
      buildings: Object.values(campusData.buildings).map((b: any) => ({
        name: b.name,
        shortName: b.shortName,
        type: b.type,
        landmarks: b.landmarks ?? [],
        timings: b.timings,
      })),
      quickInfo: campusData.quickInfo,
    };

    // Build enhanced context: RAG documents + topic scrape + campus data
    const ragInstruction = documentContext
      ? `\n\nOFFICIAL DOCUMENT CONTEXT (from indexed college documents — use this as primary source of truth):\n${documentContext}\n\nAlways prefer this document content over general knowledge when answering.`
      : '';

    const topicInstruction = topicContext 
      ? `\n\nADDITIONAL CONTEXT from the MITS website:\n${topicContext}\n\nUse this to supplement your answer if the document context above doesn't fully cover the question.`
      : '';

    const memoryInstruction = memoryContext
      ? `\n\n${memoryContext}\n\nUse this memory to personalize responses. If the user frequently visits a place, acknowledge it. If they recently searched something, you can reference it. Use graph relationships (located_in, near) to give richer spatial answers like "Placement Cell is behind Lakshmi Block near Industrial Block."`
      : '';

    // Determine reply language: explicit preference > auto-detect from message
    const langNames: Record<string, string> = {
      'en-IN': 'English', 'te-IN': 'Telugu', 'hi-IN': 'Hindi',
      'ta-IN': 'Tamil', 'kn-IN': 'Kannada', 'ml-IN': 'Malayalam',
    };
    const replyLangName = userLanguage && langNames[userLanguage] ? langNames[userLanguage] : null;
    const languageRule = replyLangName
      ? `LANGUAGE: You MUST reply in ${replyLangName}. The user's preferred language is ${replyLangName}. Always use ${replyLangName} unless the user explicitly writes in a different language — in that case, match their language.`
      : `LANGUAGE: Reply in the SAME language the user wrote in. If the message is in English (Latin script), reply in English. If Telugu script, reply in Telugu. Match the script exactly.`;

    const systemPrompt = `You are Talk2Campus, a friendly campus guide at Madanapalle Institute of Technology and Science. You talk like a helpful senior student — warm, casual, and to the point. Your words are spoken aloud, so write exactly how a person would naturally say it.

PERSONALITY:
- Sound like a real person, not a robot. Be warm and approachable.
- Use simple everyday words. No jargon, no formal phrasing.
- Start every reply with a direct answer. Lead with the key fact.
- Keep it to 1-2 short sentences. Add a third only if truly needed.
- End with a quick follow-up like "Need directions?" or "Want to know more?" — but only sometimes, not every time.

BAD example: "The library is located in the academic block and can be accessed by proceeding north from the main gate."
GOOD example: "The library is right next to the CSE block. About a minute walk from the main gate."

BAD example: "I would be happy to help you with that. The placement cell is situated behind Lakshmi Block."
GOOD example: "Placement cell is behind Lakshmi Block, near Industrial Block."

VOICE RULES (critical — your text is spoken aloud):
- Write plain text only. Zero formatting. No asterisks, bullets, hashes, dashes, brackets, or emojis.
- No URLs. Say "the college website" instead.
- Use commas and periods for natural pauses. Use "..." for a longer pause.
- Spell out numbers under 10. Write phone numbers with spaces: "0 8 5 7 1, 2 8 0 2 5 5".
- Say "at mits dot a c dot in" for email addresses.
- Never say "here are some options" then list things. Just say the most relevant one.

${languageRule}

TONE BY LANGUAGE:
- English: casual but clear — "Library is right next to the CSE block. About a minute walk from the main gate."
- Telugu: like a friendly senior — "అక్కడికి వెళ్ళాలా? చెప్తాను."
- Hindi: calm and helpful — "प्लेसमेंट सेल लक्ष्मी ब्लॉक के पीछे है।"
- Tamil: simple and polite
- Kannada: clear and respectful

DIRECTIONS:
- Give directions like a friend walking with them: "Go straight, pass the canteen, turn left. You'll see it."
- Use landmarks, not coordinates. "Near the library" not "north of block C".
- Keep direction steps to 2-3 max.

QUICK CONTACTS (use only when asked):
- Admissions: "admissions at mits dot a c dot in, phone 0 8 5 7 1, 2 8 0 2 5 5"
- Placements: "placement at mits dot a c dot in"
${ragInstruction}
${topicInstruction}
${memoryInstruction}

${mode === 'parent' ? `PARENT MODE (CRITICAL):
- You are speaking to a parent visiting campus, not a student. They may be older and non-technical.
- Be extra warm, patient, and welcoming. Use short, simple sentences.
- Avoid all jargon, acronyms, and student slang.
- If the parent asks about a place, person, office, or building on campus, ALWAYS end your reply with a tag in this exact format on its own: [NAVIGATE:<place-name>] (e.g. [NAVIGATE:Admissions Office]). The tag is stripped before speaking — only used to open the map.
- Do not include the tag for general questions (timings, contacts, events) that don't need navigation.
` : ''}
Campus context (use if relevant): ${JSON.stringify(campusContext)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: type === "voice" ? 80 : 120,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

    // Normalize for better TTS (avoid long pauses / skipped lines)
    const aiResponse = String(rawResponse)
      .replace(/\s*\n+\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    console.log("AI response:", aiResponse);

     return new Response(
       JSON.stringify({ response: aiResponse }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
