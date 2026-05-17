/**
 * auth.js — CodiceFacile shared auth state
 * -----------------------------------------
 * Reads/writes session from localStorage.
 * When you add a real backend, swap the localStorage calls
 * for API calls here — all pages update automatically.
 *
 * Keys stored:
 *   cf_user_name    — display name
 *   cf_user_email   — email address
 *   cf_user_picture — avatar URL (may be empty)
 *   cf_google_token — raw Google ID token (demo only)
 */

const Auth = (() => {

  // ── Read ────────────────────────────────────────────────
  function getUser() {
    const name = localStorage.getItem('cf_user_name');
    if (!name) return null;
    return {
      name:    name,
      email:   localStorage.getItem('cf_user_email')   || '',
      picture: localStorage.getItem('cf_user_picture') || '',
      token:   localStorage.getItem('cf_google_token') || '',
    };
  }

  function isLoggedIn() {
    return !!getUser();
  }

  // ── Write ───────────────────────────────────────────────
  function saveUser(payload) {
    localStorage.setItem('cf_user_name',    payload.name);
    localStorage.setItem('cf_user_email',   payload.email);
    localStorage.setItem('cf_user_picture', payload.picture || '');
    localStorage.setItem('cf_google_token', payload.token   || '');
  }

  function logout() {
    ['cf_user_name','cf_user_email','cf_user_picture','cf_google_token']
      .forEach(k => localStorage.removeItem(k));
    // Also sign out from Google so the One-Tap prompt reappears on next login
    if (window.google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
    window.location.href = 'index.html';
  }

  // ── Nav helpers ─────────────────────────────────────────
  // Call this once per page to wire up the standard nav.
  // Expects these elements to exist with these IDs:
  //   #nav-auth-logged-out  — wrapper shown when logged out  (login + signup btns)
  //   #nav-auth-logged-in   — wrapper shown when logged in   (avatar + name + logout)
  //   #nav-user-name        — text node for name
  //   #nav-user-avatar      — <img> or emoji div for avatar
  //   #nav-logout-btn       — logout button/link
  function applyNavState() {
    const user = getUser();
    const out = document.getElementById('nav-auth-logged-out');
    const inn = document.getElementById('nav-auth-logged-in');
    if (!out || !inn) return;

    if (user) {
      out.style.display = 'none';
      inn.style.display = 'flex';

      const nameEl = document.getElementById('nav-user-name');
      if (nameEl) nameEl.textContent = user.name.split(' ')[0]; // first name only

      const avatarEl = document.getElementById('nav-user-avatar');
      if (avatarEl) {
        if (user.picture) {
          avatarEl.style.backgroundImage = `url('${user.picture}')`;
          avatarEl.style.backgroundSize  = 'cover';
          avatarEl.textContent = '';
        } else {
          avatarEl.textContent = user.name.charAt(0).toUpperCase();
        }
      }
    } else {
      out.style.display = 'flex';
      inn.style.display = 'none';
    }

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }

  return { getUser, isLoggedIn, saveUser, logout, applyNavState };
})();
