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

// Simple JWT creation for LiveKit
function createLiveKitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantName: string,
  ttl: number = 60
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: apiKey,
    sub: participantName,
    iat: now,
    exp: now + ttl,
    nbf: now,
    jti: crypto.randomUUID(),
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const base64UrlEncode = (obj: object) => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const message = `${headerEncoded}.${payloadEncoded}`;

  // Create HMAC signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);

  // Use Web Crypto API for HMAC
  return new Promise<string>(async (resolve) => {
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const signatureArray = new Uint8Array(signature);
    let signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    signatureBase64 = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    resolve(`${message}.${signatureBase64}`);
  }) as unknown as string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');
    const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL');

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      console.error('Missing LiveKit configuration');
      throw new Error('LiveKit configuration missing');
    }

    const { roomName, participantName } = await req.json();
    
    const room = roomName || `talk2campus-${crypto.randomUUID().slice(0, 8)}`;
    const participant = participantName || `user-${crypto.randomUUID().slice(0, 8)}`;

    console.log(`Creating token for room: ${room}, participant: ${participant}`);

    // Create JWT token
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: LIVEKIT_API_KEY,
      sub: participant,
      iat: now,
      exp: now + 60, // 1 minute TTL
      nbf: now,
      jti: crypto.randomUUID(),
      video: {
        room: room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    };

    const base64UrlEncode = (obj: object) => {
      const json = JSON.stringify(obj);
      const base64 = btoa(json);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);
    const message = `${headerEncoded}.${payloadEncoded}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(LIVEKIT_API_SECRET);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const signatureArray = new Uint8Array(signature);
    let signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    signatureBase64 = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const token = `${message}.${signatureBase64}`;

    console.log('Token created successfully');

    // Ensure URL has wss:// protocol
    let wsUrl = LIVEKIT_URL;
    if (wsUrl.startsWith('//')) {
      wsUrl = `wss:${wsUrl}`;
    } else if (!wsUrl.startsWith('wss://') && !wsUrl.startsWith('ws://')) {
      wsUrl = `wss://${wsUrl}`;
    }

    return new Response(
      JSON.stringify({ 
        token, 
        url: wsUrl,
        room,
        participant
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
