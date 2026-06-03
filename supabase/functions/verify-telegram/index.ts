import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN          = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

async function verifyHash(data: Record<string, string>, hash: string): Promise<boolean> {
  const enc = new TextEncoder();
  // secret = SHA-256(bot_token)
  const secretRaw = await crypto.subtle.digest('SHA-256', enc.encode(BOT_TOKEN));
  const key = await crypto.subtle.importKey(
    'raw', secretRaw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const checkString = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('\n');
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(checkString));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
  return computed === hash;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.json();
  const { hash, source, ...tgData } = body as Record<string, string>;

  if (!hash) return Response.json({ error: 'Missing hash' }, { status: 400, headers: corsHeaders });

  // Verify Telegram signature
  const valid = await verifyHash(tgData, hash);
  if (!valid) return Response.json({ error: 'Invalid Telegram hash' }, { status: 401, headers: corsHeaders });

  // Reject stale auth (older than 24 h)
  if (Date.now() / 1000 - parseInt(tgData.auth_date) > 86400) {
    return Response.json({ error: 'Auth data expired' }, { status: 401, headers: corsHeaders });
  }

  const supabase  = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const fullName  = [tgData.first_name, tgData.last_name].filter(Boolean).join(' ');
  // Synthetic email — Telegram users have no email by default
  const email     = `tg_${tgData.id}@tg.invitebro.internal`;
  const origin    = req.headers.get('origin') ?? '';

  // Find existing user by telegram_id metadata
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = users.find((u) => u.user_metadata?.telegram_id === tgData.id);

  if (!existing) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name:          fullName,
        avatar_url:         tgData.photo_url ?? '',
        telegram_id:        tgData.id,
        telegram_username:  tgData.username ?? '',
        source:             source ?? origin,
      },
    });
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  } else {
    // Refresh avatar / name in case they changed
    await supabase.auth.admin.updateUserById(existing.id, {
      user_metadata: { full_name: fullName, avatar_url: tgData.photo_url ?? '' },
    });
  }

  // Generate a magic link so the client can establish a session via redirect
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${origin}/explore.html` },
  });
  if (linkErr) return Response.json({ error: linkErr.message }, { status: 500, headers: corsHeaders });

  return Response.json(
    { action_link: link.properties.action_link },
    { headers: corsHeaders }
  );
});
