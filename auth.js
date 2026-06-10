/**
 * auth.js — Supabase-backed auth module
 *
 * getUser() reads synchronously from localStorage cache so nav renders
 * without a flash. All write operations (login/signup/logout) are async.
 * Pages keep their existing synchronous boot sequences unchanged.
 */
const Auth = (() => {

  // ── Session cache ──────────────────────────────────────────────────────────
  // Supabase persists the session in localStorage under sb-*-auth-token.
  // Read it synchronously so applyNavState() works immediately on page load.
  let _user = _readCache();

  function _readCache() {
    try {
      const key = Object.keys(localStorage).find(
        k => k.startsWith('sb-') && k.endsWith('-auth-token')
      );
      if (!key) return null;
      const s = JSON.parse(localStorage.getItem(key) || 'null');
      return s?.user ?? null;
    } catch { return null; }
  }

  // Validate + refresh session in background; keep _user current
  SupabaseClient.auth.getSession().then(({ data: { session } }) => {
    _user = session?.user ?? null;
  });
  SupabaseClient.auth.onAuthStateChange((_event, session) => {
    _user = session?.user ?? null;
  });

  // ── Read ───────────────────────────────────────────────────────────────────
  function getUser() {
    if (!_user) return null;
    const m = _user.user_metadata || {};
    return {
      name:    m.full_name || m.name || _user.phone || _user.email?.split('@')[0] || '',
      email:   _user.email  || '',
      phone:   _user.phone  || '',
      picture: m.avatar_url || m.picture || '',
      source:  m.source     || '',
    };
  }

  function isLoggedIn() { return !!_user; }

  // ── Email / password ───────────────────────────────────────────────────────
  async function signupEmail(firstName, lastName, email, password, source) {
    const { data, error } = await SupabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          source: source || window.location.hostname,
        },
      },
    });
    if (error) return { error: error.message };
    // Supabase returns session=null when email confirmation is required
    if (!data.session) return { confirm: true };
    return null; // null = fully signed in
  }

  async function loginEmail(email, password) {
    const { error } = await SupabaseClient.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  // ── Google OAuth (Supabase redirect flow) ──────────────────────────────────
  async function loginGoogle() {
    const { error } = await SupabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/explore.html',
        queryParams: { prompt: 'select_account' },
      },
    });
    return error?.message ?? null;
  }

  // ── Phone OTP ──────────────────────────────────────────────────────────────
  async function sendPhoneOtp(phone) {
    const { error } = await SupabaseClient.auth.signInWithOtp({ phone });
    return error?.message ?? null;
  }

  async function verifyPhoneOtp(phone, token) {
    const { error } = await SupabaseClient.auth.verifyOtp({
      phone, token, type: 'sms',
    });
    return error?.message ?? null;
  }

  // ── Telegram (Edge Function verifies hash → returns magic link) ────────────
  async function loginTelegram(tgUser) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-telegram`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON}`,
          },
          body: JSON.stringify({ ...tgUser, source: window.location.hostname }),
        }
      );
      const json = await res.json();
      if (json.error) return json.error;
      // Edge Function returns a Supabase magic link — redirect into it
      window.location.href = json.action_link;
      return null;
    } catch (e) {
      return e.message;
    }
  }

  // ── VK OAuth (redirect flow → vk-callback.html → Edge Function) ───────────
  function loginVK() {
    if (!window.VK_APP_ID) {
      console.error('VK_APP_ID not configured');
      return 'VK app not configured';
    }
    const redirect = encodeURIComponent(window.location.origin + '/vk-callback.html');
    window.location.href =
      `https://oauth.vk.com/authorize?client_id=${window.VK_APP_ID}` +
      `&display=page&redirect_uri=${redirect}&scope=email&response_type=code&v=5.199`;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function logout() {
    await SupabaseClient.auth.signOut();
    if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
    window.location.href = 'index.html';
  }

  // ── Nav state ──────────────────────────────────────────────────────────────
  function applyNavState() {
    const user = getUser();
    const out = document.getElementById('nav-auth-logged-out');
    const inn = document.getElementById('nav-auth-logged-in');
    if (!out || !inn) return;

    if (user) {
      out.style.display = 'none';
      inn.style.display = 'flex';
      const nameEl = document.getElementById('nav-user-name');
      if (nameEl) nameEl.textContent = user.name.split(' ')[0];
      const avatarEl = document.getElementById('nav-user-avatar');
      if (avatarEl) {
        if (user.picture) {
          avatarEl.style.backgroundImage = `url('${user.picture}')`;
          avatarEl.style.backgroundSize  = 'cover';
          avatarEl.textContent = '';
        } else {
          avatarEl.textContent = (user.name.charAt(0) || '?').toUpperCase();
        }
      }
    } else {
      out.style.display = 'flex';
      inn.style.display = 'none';
    }

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) logoutBtn.onclick = e => { e.preventDefault(); logout(); };
  }

  // Legacy shim — kept so old pages that still call saveUser() don't crash
  function saveUser() {}

  return {
    getUser, isLoggedIn,
    signupEmail, loginEmail,
    loginGoogle,
    sendPhoneOtp, verifyPhoneOtp,
    loginTelegram, loginVK,
    logout, applyNavState,
    saveUser,
  };
})();
