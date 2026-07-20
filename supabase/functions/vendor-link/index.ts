import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email, shopName } = await req.json();

    if (!userId || !email || !shopName) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Auto-confirm vendor email (since global auto-confirm is disabled for students)
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    // Check if this user already has a vendor record
    const { data: existing } = await supabaseAdmin
      .from('canteen_vendors')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Ensure vendor role exists
      await supabaseAdmin.from('user_roles').upsert(
        { user_id: userId, role: 'vendor' },
        { onConflict: 'user_id,role' }
      );
      return new Response(JSON.stringify({ success: true, vendorId: existing.id, vendorName: existing.name }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a new vendor record
    const { data: vendor, error: insertErr } = await supabaseAdmin
      .from('canteen_vendors')
      .insert({
        name: shopName,
        email,
        user_id: userId,
        cuisine_type: 'Multi-cuisine',
        is_open: false,
      })
      .select('id, name')
      .single();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({ error: 'Account creation failed. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign vendor role
    await supabaseAdmin.from('user_roles').upsert(
      { user_id: userId, role: 'vendor' },
      { onConflict: 'user_id,role' }
    );

    return new Response(JSON.stringify({ success: true, vendorId: vendor.id, vendorName: vendor.name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
