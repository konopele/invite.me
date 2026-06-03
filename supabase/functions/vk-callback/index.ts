import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VK_APP_ID        = Deno.env.get('VK_APP_ID') ?? '';
const VK_APP_SECRET    = Deno.env.get('VK_APP_SECRET') ?? '';
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { code, redirect_uri, source } = await req.json() as {
    code: string; redirect_uri: string; source?: string;
  };
  const origin = req.headers.get('origin') ?? '';

  // 1. Exchange code for VK access token
  const tokenUrl =
    `https://oauth.vk.com/access_token` +
    `?client_id=${VK_APP_ID}` +
    `&client_secret=${VK_APP_SECRET}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&code=${code}`;

  const tokenRes  = await fetch(tokenUrl);
  const tokenData = await tokenRes.json() as {
    access_token?: string; user_id?: number; email?: string; error?: string;
  };

  if (tokenData.error || !tokenData.access_token) {
    return Response.json({ error: tokenData.error ?? 'VK token exchange failed' }, { status: 400, headers: corsHeaders });
  }

  // 2. Fetch VK user info
  const userRes  = await fetch(
    `https://api.vk.com/method/users.get?user_ids=${tokenData.user_id}&fields=photo_200&v=5.199&access_token=${tokenData.access_token}`
  );
  const userJson = await userRes.json() as { response?: Array<{ id: number; first_name: string; last_name: string; photo_200?: string }> };
  const vkUser   = userJson.response?.[0];
  if (!vkUser) return Response.json({ error: 'VK user info not found' }, { status: 500, headers: corsHeaders });

  const fullName = `${vkUser.first_name} ${vkUser.last_name}`.trim();
  // Use VK email if granted; otherwise synthesize one
  const email    = tokenData.email ?? `vk_${vkUser.id}@vk.invitebro.internal`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  // Find existing user by vk_id
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = users.find((u) => u.user_metadata?.vk_id === String(vkUser.id));

  if (!existing) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name:  fullName,
        avatar_url: vkUser.photo_200 ?? '',
        vk_id:      String(vkUser.id),
        source:     source ?? origin,
      },
    });
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  // Generate magic link for session
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${origin}/explore.html` },
  });
  if (linkErr) return Response.json({ error: linkErr.message }, { status: 500, headers: corsHeaders });

  return Response.json({ action_link: link.properties.action_link }, { headers: corsHeaders });
});
