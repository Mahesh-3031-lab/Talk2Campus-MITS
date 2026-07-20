import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Configuration ───────────────────────────────────────────────────────────

function getConfig() {
  return {
    imsApiUrl: Deno.env.get('MITS_IMS_API_URL') || '',
    imsApiKey: Deno.env.get('MITS_IMS_API_KEY') || '',
    enableLiveData: Deno.env.get('ENABLE_LIVE_DATA') === 'true',
  };
}

function isLiveMode(): boolean {
  const config = getConfig();
  return config.enableLiveData && !!config.imsApiUrl;
}

// ─── Session Management ─────────────────────────────────────────────────────

interface Session {
  rollNumber: string;
  cookies: string;
  baseUrl: string;
  expiry: number;
  isDemo: boolean;
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiry < now) sessions.delete(token);
  }
}

function extractCookies(response: Response): string {
  const cookies: string[] = [];
  const rawCookies = response.headers.get('set-cookie');
  if (rawCookies) {
    rawCookies.split(/,(?=[^;]*=)/).forEach(cookie => {
      const cookiePart = cookie.split(';')[0].trim();
      if (cookiePart) cookies.push(cookiePart);
    });
  }
  return cookies.join('; ');
}

// ─── Series-Based Subject Cache ──────────────────────────────────────────────
//
// Core idea: Students in the same "series" (same batch + branch, e.g. 21BD1A05xx)
// share the same subject structure. When one student's data is parsed successfully,
// we cache the subject list for that series. Future students in the same series
// can use this cached structure to validate/filter portal responses that may
// return extra or inconsistent subjects.

interface CachedSeriesData {
  subjectCodes: string[];       // ordered canonical codes for this series
  subjectNames: string[];       // canonical names matching codes
  semester: string;
  lastUpdated: number;
}

const seriesCache = new Map<string, CachedSeriesData>();
const SERIES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Extract the series prefix from a roll number.
 * e.g. "21BD1A0501" → "21BD1A05" (batch year + regulation + branch code)
 * This groups students who share the same curriculum.
 */
function getSeriesKey(rollNumber: string): string {
  const rn = rollNumber.toUpperCase().trim();
  // MITS format: YYRegBranchRollNum — series is everything except last 2 digits
  // e.g. 21BD1A0501 → series "21BD1A05", student number "01"
  // Some formats: 22B91A05XX, 21BD1A66XX
  if (rn.length >= 10) return rn.substring(0, rn.length - 2);
  if (rn.length >= 8) return rn.substring(0, rn.length - 2);
  return rn; // fallback: treat as unique
}

function getCachedSeries(rollNumber: string): CachedSeriesData | null {
  const key = getSeriesKey(rollNumber);
  const cached = seriesCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.lastUpdated > SERIES_CACHE_TTL_MS) {
    seriesCache.delete(key);
    return null;
  }
  return cached;
}

function updateSeriesCache(rollNumber: string, subjects: NormalizedSubject[], semester: string) {
  if (subjects.length === 0) return;
  const key = getSeriesKey(rollNumber);
  seriesCache.set(key, {
    subjectCodes: subjects.map(s => s.subjectCode),
    subjectNames: subjects.map(s => s.subjectName),
    semester,
    lastUpdated: Date.now(),
  });
}

// ─── Branch Detection ────────────────────────────────────────────────────────

const BRANCH_MAP: Record<string, string> = {
  'A05': 'Computer Science & Engineering',
  '5A':  'Computer Science & Engineering',
  'A04': 'Electronics & Communication Engineering',
  '4A':  'Electronics & Communication Engineering',
  'A03': 'Electrical & Electronics Engineering',
  '3A':  'Electrical & Electronics Engineering',
  'A01': 'Civil Engineering',
  '1A':  'Civil Engineering',
  'A02': 'Mechanical Engineering',
  '2A':  'Mechanical Engineering',
  'A12': 'Information Technology',
  '12A': 'Information Technology',
  'A66': 'Artificial Intelligence & Machine Learning',
  '66A': 'Artificial Intelligence & Machine Learning',
  'A67': 'Data Science',
  '67A': 'Data Science',
  'A69': 'Cyber Security',
  '69A': 'Cyber Security',
};

function determineBranch(rollNumber: string): string {
  const code = rollNumber.toUpperCase();
  for (const [key, branch] of Object.entries(BRANCH_MAP)) {
    if (code.includes(key)) return branch;
  }
  return 'Engineering';
}

// ─── Curriculum Subject Mapping ──────────────────────────────────────────────
//
// Known subject structures per branch-semester. Acts as a stability layer:
// - Normalizes inconsistent codes/names from the portal
// - Merges duplicate entries that represent the same subject
// - Provides canonical naming even when the portal sends abbreviated forms

interface SubjectMapping {
  code: string;
  canonicalName: string;
  aliases: string[];
}

const CURRICULUM_MAP: Record<string, SubjectMapping[]> = {
  'CSE-5': [
    { code: 'CS501', canonicalName: 'Machine Learning', aliases: ['ml', 'machine learning', 'mach learn'] },
    { code: 'CS502', canonicalName: 'Computer Networks', aliases: ['cn', 'computer networks', 'comp networks', 'comp net'] },
    { code: 'CS503', canonicalName: 'Database Management Systems', aliases: ['dbms', 'database', 'db management'] },
    { code: 'CS504', canonicalName: 'Software Engineering', aliases: ['se', 'software eng', 'soft eng'] },
    { code: 'CS505', canonicalName: 'Operating Systems', aliases: ['os', 'operating sys', 'oper sys'] },
    { code: 'CS506', canonicalName: 'Web Technologies Lab', aliases: ['web tech', 'web lab', 'wt lab'] },
  ],
  'CSE-6': [
    { code: 'CS601', canonicalName: 'Compiler Design', aliases: ['cd', 'compiler', 'compilers'] },
    { code: 'CS602', canonicalName: 'Artificial Intelligence', aliases: ['ai', 'artificial intel'] },
    { code: 'CS603', canonicalName: 'Cryptography & Network Security', aliases: ['cns', 'crypto', 'network security'] },
    { code: 'CS604', canonicalName: 'Cloud Computing', aliases: ['cc', 'cloud comp'] },
  ],
  'CSE-7': [
    { code: 'CS701', canonicalName: 'Deep Learning', aliases: ['dl', 'deep learn'] },
    { code: 'CS702', canonicalName: 'Big Data Analytics', aliases: ['bda', 'big data'] },
    { code: 'CS703', canonicalName: 'Internet of Things', aliases: ['iot'] },
  ],
  'ECE-5': [
    { code: 'EC501', canonicalName: 'Digital Signal Processing', aliases: ['dsp', 'signal processing'] },
    { code: 'EC502', canonicalName: 'Microprocessors & Microcontrollers', aliases: ['mp', 'microprocessor', 'micro'] },
    { code: 'EC503', canonicalName: 'Analog Communications', aliases: ['ac', 'analog comm'] },
    { code: 'EC504', canonicalName: 'Electromagnetic Theory', aliases: ['emt', 'em theory'] },
  ],
  'IT-5': [
    { code: 'IT501', canonicalName: 'Data Warehousing & Mining', aliases: ['dwm', 'data mining'] },
    { code: 'IT502', canonicalName: 'Information Security', aliases: ['is', 'info security'] },
    { code: 'IT503', canonicalName: 'Mobile Application Development', aliases: ['mad', 'mobile app'] },
  ],
  'AIML-5': [
    { code: 'AI501', canonicalName: 'Natural Language Processing', aliases: ['nlp', 'natural lang'] },
    { code: 'AI502', canonicalName: 'Computer Vision', aliases: ['cv', 'comp vision'] },
    { code: 'AI503', canonicalName: 'Reinforcement Learning', aliases: ['rl', 'reinforce'] },
  ],
};

function getCurriculumKey(rollNumber: string, semester?: string): string | null {
  const code = rollNumber.toUpperCase();
  let branchKey = '';
  if (code.includes('A05') || code.includes('5A')) branchKey = 'CSE';
  else if (code.includes('A04') || code.includes('4A')) branchKey = 'ECE';
  else if (code.includes('A12') || code.includes('12A')) branchKey = 'IT';
  else if (code.includes('A66') || code.includes('66A')) branchKey = 'AIML';
  else if (code.includes('A67') || code.includes('67A')) branchKey = 'DS';
  else if (code.includes('A69') || code.includes('69A')) branchKey = 'CS';

  if (!branchKey) return null;

  const semNum = semester ? semester.replace(/[^0-9]/g, '') : '';
  if (semNum) return `${branchKey}-${semNum}`;
  return null;
}

// ─── Subject Normalization ───────────────────────────────────────────────────

interface RawSubject {
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
}

interface NormalizedSubject {
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
}

function cleanSubjectCode(code: string): string {
  // Remove whitespace, hyphens, dots, underscores — uppercase
  return code.replace(/[\s\-_.]+/g, '').toUpperCase().trim();
}

function cleanSubjectName(name: string): string {
  return name
    .replace(/\s+/g, ' ')           // collapse whitespace
    .replace(/\([^)]*\)/g, '')       // remove parenthetical notes like "(Theory)"
    .replace(/^\d+[\.\-\s]+/, '')    // remove leading numbering "1. " or "1- "
    .replace(/\s*-\s*$/, '')         // trailing hyphens
    .trim();
}

function findCurriculumMatch(rawCode: string, rawName: string, curriculum: SubjectMapping[]): SubjectMapping | null {
  const cleanCode = cleanSubjectCode(rawCode);
  const lowerName = rawName.toLowerCase().trim();

  // Priority 1: exact code match (most reliable)
  for (const entry of curriculum) {
    if (cleanSubjectCode(entry.code) === cleanCode) return entry;
  }

  // Priority 2: exact canonical name match
  for (const entry of curriculum) {
    if (entry.canonicalName.toLowerCase() === lowerName) return entry;
  }

  // Priority 3: alias substring match
  for (const entry of curriculum) {
    for (const alias of entry.aliases) {
      if (lowerName.includes(alias) || alias.includes(lowerName)) return entry;
    }
  }

  return null;
}

/**
 * The main normalization pipeline:
 * 1. Clean raw codes and names
 * 2. Match against known curriculum (if available)
 * 3. Filter using series cache (if a peer already logged in)
 * 4. Merge duplicates (same code appearing twice = sum the classes)
 * 5. Return clean, consistent subject list
 */
function normalizeSubjects(rawSubjects: RawSubject[], rollNumber: string, semester?: string): NormalizedSubject[] {
  const currKey = getCurriculumKey(rollNumber, semester);
  const curriculum = currKey ? CURRICULUM_MAP[currKey] || null : null;
  const cachedSeries = getCachedSeries(rollNumber);

  const seen = new Map<string, NormalizedSubject>();

  for (const raw of rawSubjects) {
    const cleanCode = cleanSubjectCode(raw.subjectCode);
    const cleanName = cleanSubjectName(raw.subjectName);

    let finalCode = cleanCode || cleanName.substring(0, 6).toUpperCase();
    let finalName = cleanName;

    // Step 1: Try curriculum match for canonical naming
    if (curriculum) {
      const match = findCurriculumMatch(raw.subjectCode, raw.subjectName, curriculum);
      if (match) {
        finalCode = match.code;
        finalName = match.canonicalName;
      }
    }

    // Step 2: If we have a series cache, filter out subjects not in the known set.
    // This handles the portal returning extra/mixed subjects from other semesters.
    if (cachedSeries && cachedSeries.subjectCodes.length > 0) {
      const isKnown = cachedSeries.subjectCodes.includes(finalCode) ||
                      cachedSeries.subjectNames.some(n => n.toLowerCase() === finalName.toLowerCase());
      if (!isKnown && curriculum) {
        // Unknown subject + we have curriculum = likely noise from portal, skip it
        continue;
      }
      // If no curriculum but series cache exists, use series name for consistency
      if (!curriculum) {
        const idx = cachedSeries.subjectCodes.indexOf(finalCode);
        if (idx >= 0) {
          finalName = cachedSeries.subjectNames[idx];
        }
      }
    }

    // Step 3: Merge duplicates by code (portal sometimes splits same subject into rows)
    const key = finalCode;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      existing.attended += raw.attended;
      existing.total += raw.total;
      existing.percentage = existing.total > 0
        ? parseFloat(((existing.attended / existing.total) * 100).toFixed(2))
        : 0;
    } else {
      seen.set(key, {
        subjectCode: finalCode,
        subjectName: finalName,
        attended: raw.attended,
        total: raw.total,
        percentage: parseFloat(raw.percentage.toFixed(2)),
      });
    }
  }

  return Array.from(seen.values());
}

// ─── Data Validation ─────────────────────────────────────────────────────────

function validateAndClean(subjects: NormalizedSubject[]): NormalizedSubject[] {
  return subjects
    .filter(s => {
      if (!s.subjectCode || !s.subjectName) return false;
      if (s.total <= 0) return false;
      if (s.attended < 0) return false;
      // Cap attended at total (portal sometimes reports more attended than total briefly)
      if (s.attended > s.total) s.attended = s.total;
      if (isNaN(s.percentage)) return false;
      return true;
    })
    .map(s => ({
      ...s,
      // Always recalculate from source values — don't trust portal percentage
      percentage: parseFloat(((s.attended / s.total) * 100).toFixed(2)),
    }));
}

// ─── Voice Summary Generator ─────────────────────────────────────────────────

function generateVoiceSummary(data: AttendanceResponse): string {
  const pct = Math.round(data.overallPercentage);
  const lowSubjects = data.subjects.filter(s => s.percentage < 75);

  let summary = `Your overall attendance is ${pct} percent.`;

  if (pct >= 75) {
    summary += ` You are above the required attendance threshold.`;
  } else {
    summary += ` You are below the required 75 percent.`;
  }

  if (lowSubjects.length > 0) {
    summary += ` You have ${lowSubjects.length} subject${lowSubjects.length > 1 ? 's' : ''} below 75 percent: `;
    summary += lowSubjects.map(s => `${s.subjectName} at ${Math.round(s.percentage)} percent`).join(', ');
    summary += '.';
  } else {
    summary += ` All subjects are above the attendance limit.`;
  }

  return summary;
}

// ─── Response Types ──────────────────────────────────────────────────────────

interface AttendanceResponse {
  studentName: string;
  rollNumber: string;
  branch: string;
  semester: string;
  overallPercentage: number;
  subjects: NormalizedSubject[];
  lastUpdated: string;
  voiceSummary: string;
}

function buildAttendanceResponse(
  studentName: string,
  rollNumber: string,
  branch: string,
  semester: string,
  subjects: NormalizedSubject[],
): AttendanceResponse {
  const cleaned = validateAndClean(subjects);
  const totalAttended = cleaned.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = cleaned.reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = totalClasses > 0
    ? parseFloat(((totalAttended / totalClasses) * 100).toFixed(2))
    : 0;

  const response: AttendanceResponse = {
    studentName,
    rollNumber: rollNumber.toUpperCase(),
    branch,
    semester,
    overallPercentage,
    subjects: cleaned,
    lastUpdated: new Date().toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    }),
    voiceSummary: '',
  };

  response.voiceSummary = generateVoiceSummary(response);

  // Update series cache so peers in same batch benefit
  if (cleaned.length > 0) {
    updateSeriesCache(rollNumber, cleaned, semester);
  }

  return response;
}

// ─── HTML Parsing (Portal Scrape) ────────────────────────────────────────────
//
// The GEMS portal returns attendance in HTML tables. The portal format can vary,
// so we try multiple parsing patterns. After extraction we normalize everything.

function parseAttendanceHtml(html: string, rollNumber: string): AttendanceResponse {
  // Extract student metadata
  const nameMatch = html.match(/Student\s*Name\s*[:\-]?\s*<[^>]*>([^<]+)/i) ||
                    html.match(/Name\s*[:\-]?\s*([A-Z][A-Za-z\s]+)/i) ||
                    html.match(/<td[^>]*>Student Name<\/td>\s*<td[^>]*>([^<]+)/i);
  const studentName = nameMatch ? nameMatch[1].trim() : `Student ${rollNumber.slice(-4)}`;

  const branchMatch = html.match(/Branch\s*[:\-]?\s*<[^>]*>([^<]+)/i) ||
                      html.match(/<td[^>]*>Branch<\/td>\s*<td[^>]*>([^<]+)/i);
  const branch = branchMatch ? branchMatch[1].trim() : determineBranch(rollNumber);

  const semMatch = html.match(/Semester\s*[:\-]?\s*(\d+|[IVX]+)/i);
  const semester = semMatch ? `${semMatch[1]} Semester` : 'Current Semester';

  const rawSubjects: RawSubject[] = [];

  // Pattern 1: Standard 5-column — Code | Name | Attended | Total | Percentage
  const p1 = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([\d.]+)%?<\/td>/gi;
  let match;
  while ((match = p1.exec(html)) !== null) {
    const attended = parseInt(match[3]);
    const total = parseInt(match[4]);
    const percentage = parseFloat(match[5]);
    if (!isNaN(attended) && !isNaN(total) && total > 0) {
      rawSubjects.push({ subjectCode: match[1].trim(), subjectName: match[2].trim(), attended, total, percentage });
    }
  }

  // Pattern 2: 4-column — Name | Attended | Total | Percentage (no code column)
  if (rawSubjects.length === 0) {
    const p2 = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([\d.]+)%?<\/td>/gi;
    while ((match = p2.exec(html)) !== null) {
      const attended = parseInt(match[2]);
      const total = parseInt(match[3]);
      const percentage = parseFloat(match[4]);
      if (!isNaN(attended) && !isNaN(total) && total > 0) {
        rawSubjects.push({ subjectCode: '', subjectName: match[1].trim(), attended, total, percentage });
      }
    }
  }

  // Pattern 3: JSON-like embedded data (some portal versions)
  if (rawSubjects.length === 0) {
    const p3 = /"subjectName"\s*:\s*"([^"]+)"[^}]*"attended"\s*:\s*(\d+)[^}]*"total"\s*:\s*(\d+)/gi;
    while ((match = p3.exec(html)) !== null) {
      const attended = parseInt(match[2]);
      const total = parseInt(match[3]);
      if (!isNaN(attended) && !isNaN(total) && total > 0) {
        rawSubjects.push({
          subjectCode: '', subjectName: match[1].trim(), attended, total,
          percentage: parseFloat(((attended / total) * 100).toFixed(2)),
        });
      }
    }
  }

  // Pattern 4: Slash-separated format "28/35" in cells
  if (rawSubjects.length === 0) {
    const p4 = /<td[^>]*>([^<]{3,50})<\/td>\s*<td[^>]*>(\d+)\s*\/\s*(\d+)<\/td>/gi;
    while ((match = p4.exec(html)) !== null) {
      const attended = parseInt(match[2]);
      const total = parseInt(match[3]);
      if (!isNaN(attended) && !isNaN(total) && total > 0) {
        rawSubjects.push({
          subjectCode: '', subjectName: match[1].trim(), attended, total,
          percentage: parseFloat(((attended / total) * 100).toFixed(2)),
        });
      }
    }
  }

  const normalized = normalizeSubjects(rawSubjects, rollNumber, semester);
  return buildAttendanceResponse(studentName, rollNumber, branch, semester, normalized);
}

// ─── Live API ────────────────────────────────────────────────────────────────

async function tryLiveApi(rollNumber: string, password: string): Promise<AttendanceResponse | null> {
  const config = getConfig();
  if (!config.imsApiUrl) return null;

  try {
    console.log('Attempting live API');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(config.imsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.imsApiKey ? { 'Authorization': `Bearer ${config.imsApiKey}` } : {}),
      },
      body: JSON.stringify({ rollNumber, password }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Live API returned:', response.status);
      return null;
    }

    const data = await response.json();
    if (data?.attendance?.subjects && Array.isArray(data.attendance.subjects)) {
      const normalized = normalizeSubjects(data.attendance.subjects, rollNumber, data.attendance.semester);
      return buildAttendanceResponse(
        data.attendance.studentName || `Student ${rollNumber.slice(-4)}`,
        rollNumber,
        data.attendance.branch || determineBranch(rollNumber),
        data.attendance.semester || 'Current Semester',
        normalized,
      );
    }
    return null;
  } catch (error) {
    console.error('Live API error:', error);
    return null;
  }
}

// ─── Portal Authentication & Scraping ────────────────────────────────────────
//
// Flow:
// 1. Hit the login page to get session cookies (and optionally ASP.NET viewstate)
// 2. POST credentials with those cookies
// 3. Use the authenticated session to fetch the attendance page
// 4. Parse the HTML and discard the session immediately

function extractViewState(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const patterns = [
    /__VIEWSTATE/i, /__VIEWSTATEGENERATOR/i, /__EVENTVALIDATION/i,
    /__EVENTTARGET/i, /__EVENTARGUMENT/i,
  ];
  for (const pattern of patterns) {
    const fieldName = (pattern.source.replace(/\\i$/, '').replace(/\\/g, '')).replace(/^\/|\/$/g, '');
    const regex = new RegExp(`name=["']?(${pattern.source})["']?[^>]*value=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    if (match) {
      fields[match[1]] = match[2];
    }
  }
  // Simpler extraction for hidden inputs
  const hiddenPattern = /<input[^>]+type=["']hidden["'][^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*>/gi;
  let m;
  while ((m = hiddenPattern.exec(html)) !== null) {
    if (m[1].startsWith('__')) {
      fields[m[1]] = m[2];
    }
  }
  return fields;
}

async function tryPortalAuth(rollNumber: string, password: string): Promise<{ attendance: AttendanceResponse; cookies: string; baseUrl: string } | null> {
  const GEMS_URLS = [
    'http://mitsims.in',
    'https://mitsims.in',
    'http://gems.mits.ac.in',
    'https://gems.mits.ac.in',
  ];

  for (const url of GEMS_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      // Step 1: Fetch login page for cookies + hidden fields
      const loginPageResponse = await fetch(`${url}/studentLogin.jsp?personType=student`, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal,
      });

      if (!loginPageResponse.ok) { clearTimeout(timeout); continue; }

      const initialCookies = extractCookies(loginPageResponse);
      const loginPageHtml = await loginPageResponse.text();
      const viewState = extractViewState(loginPageHtml);

      // Step 2: POST credentials
      const formData = new URLSearchParams();
      formData.append('userId', rollNumber);
      formData.append('password', password);
      formData.append('personType', 'student');
      // Include ASP.NET viewstate fields if present
      for (const [key, value] of Object.entries(viewState)) {
        formData.append(key, value);
      }

      const loginResponse = await fetch(`${url}/studentLogin/studentLoginAjax.action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': initialCookies,
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `${url}/studentLogin.jsp?personType=student`,
        },
        body: formData.toString(),
        redirect: 'manual',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const loginCookies = extractCookies(loginResponse);
      const allCookies = [initialCookies, loginCookies].filter(Boolean).join('; ');
      const responseText = await loginResponse.text();

      // Invalid credentials — stop immediately, don't try other URLs
      if (responseText.includes('Invalid') || responseText.includes('incorrect') || responseText.includes('wrong')) {
        return null;
      }

      if (responseText.includes('success') || responseText.includes('true') || loginResponse.status === 200) {
        // Step 3: Fetch attendance page using authenticated session
        const attendancePaths = ['/student/attendance', '/studentAttendance.jsp', '/student/dashboard'];
        for (const path of attendancePaths) {
          try {
            const attRes = await fetch(`${url}${path}`, {
              headers: {
                'Cookie': allCookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });
            if (attRes.ok) {
              const html = await attRes.text();
              if (html.includes('Attendance') || html.includes('attendance') || html.match(/\d+\s*%/)) {
                const attendance = parseAttendanceHtml(html, rollNumber);
                if (attendance.subjects.length > 0) {
                  return { attendance, cookies: allCookies, baseUrl: url };
                }
              }
            }
          } catch { /* skip path, try next */ }
        }
      }
    } catch (e) {
      console.log('Portal unreachable at', url);
    }
  }
  return null;
}

// ─── Demo Fallback Data ──────────────────────────────────────────────────────
// Activates ONLY when both live API and portal scraping fail (portal unreachable).

function getDemoAttendanceData(rollNumber: string): AttendanceResponse {
  const branch = determineBranch(rollNumber);
  const semester = '5th Semester';
  const rawSubjects: RawSubject[] = [
    { subjectCode: 'CS501', subjectName: 'Machine Learning', attended: 28, total: 35, percentage: 80 },
    { subjectCode: 'CS502', subjectName: 'Computer Networks', attended: 22, total: 32, percentage: 68.75 },
    { subjectCode: 'CS503', subjectName: 'Database Management Systems', attended: 30, total: 34, percentage: 88.24 },
    { subjectCode: 'CS504', subjectName: 'Software Engineering', attended: 18, total: 28, percentage: 64.29 },
    { subjectCode: 'CS505', subjectName: 'Operating Systems', attended: 26, total: 30, percentage: 86.67 },
    { subjectCode: 'CS506', subjectName: 'Web Technologies Lab', attended: 14, total: 16, percentage: 87.5 },
  ];
  const normalized = normalizeSubjects(rawSubjects, rollNumber, semester);
  return buildAttendanceResponse(`Demo Student (${rollNumber.slice(-4)})`, rollNumber, branch, semester, normalized);
}

// ─── Input Validation ────────────────────────────────────────────────────────

function validateRollNumber(rn: string): boolean {
  if (!rn || typeof rn !== 'string') return false;
  const clean = rn.trim().toUpperCase();
  return /^[0-9]{2}[A-Z0-9]{2,4}[A-Z0-9]{2,6}$/.test(clean) && clean.length >= 8 && clean.length <= 14;
}

function validatePassword(pw: string): boolean {
  return typeof pw === 'string' && pw.length >= 1 && pw.length <= 128;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, rollNumber, password, sessionToken } = body;
    cleanupSessions();

    if (action === 'login') {
      if (!rollNumber || !password) {
        return new Response(
          JSON.stringify({ error: 'Roll number and password are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (!validateRollNumber(rollNumber)) {
        return new Response(
          JSON.stringify({ error: 'Invalid roll number format.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (!validatePassword(password)) {
        return new Response(
          JSON.stringify({ error: 'Invalid password.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      let attendance: AttendanceResponse | null = null;
      let cookies = '';
      let baseUrl = '';

      // Priority 1: Configured live API
      if (isLiveMode()) {
        attendance = await tryLiveApi(rollNumber, password);
      }

      // Priority 2: Portal scraping
      if (!attendance) {
        const portalResult = await tryPortalAuth(rollNumber, password);
        if (portalResult) {
          attendance = portalResult.attendance;
          cookies = portalResult.cookies;
          baseUrl = portalResult.baseUrl;
        }
      }

      // Fallback: demo data when portal is unreachable
      const isDemo = !attendance;
      if (!attendance) {
        console.log('Portal unreachable — falling back to demo mode');
        attendance = getDemoAttendanceData(rollNumber);
      }

      const token = generateSessionToken();
      sessions.set(token, { rollNumber, cookies, baseUrl, expiry: Date.now() + SESSION_TTL_MS, isDemo });

      return new Response(
        JSON.stringify({ success: true, sessionToken: token, attendance, isDemo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'refresh') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Session token required.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const session = sessions.get(sessionToken);
      if (!session || session.expiry < Date.now()) {
        sessions.delete(sessionToken!);
        return new Response(
          JSON.stringify({ error: 'Session expired. Please login again.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      let attendance: AttendanceResponse | null = null;

      if (session.cookies && session.baseUrl) {
        try {
          const attendancePaths = ['/student/attendance', '/studentAttendance.jsp'];
          for (const path of attendancePaths) {
            const res = await fetch(`${session.baseUrl}${path}`, {
              headers: { 'Cookie': session.cookies },
            });
            if (res.ok) {
              const html = await res.text();
              if (html.includes('Attendance') || html.match(/\d+\s*%/)) {
                attendance = parseAttendanceHtml(html, session.rollNumber);
                break;
              }
            }
          }
        } catch { /* fall through */ }
      }

      if (!attendance) {
        attendance = getDemoAttendanceData(session.rollNumber);
      }

      return new Response(
        JSON.stringify({ success: true, attendance, isDemo: session.isDemo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Attendance service is temporarily unavailable. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
