// --- Admin Access Gate ---
// This page is intentionally NOT linked from anywhere in the site.
// It is reachable only via its exact URL, and requires a password to proceed.
// NOTE: This is client-side gating only (hides the panel from casual visitors who
// don't have the link/password). It is NOT real server-side security — anyone who
// reads this file's source could find the hash. For a publicly hosted static site,
// true protection requires a server-side check (e.g. Netlify/Vercel password
// protection, basic auth on the host, or a backend). Treat this as a "keep it out
// of casual view" lock, not a vault.

const ADMIN_SESSION_KEY = 'portfolio_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours

// SHA-256 hash of the admin password. Default password is: portfolio2026
// To change it: open browser console anywhere and run
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourNewPassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
// then paste the printed hash below.
const ADMIN_PASSWORD_HASH = 'a57c80afd418bef8b6bde0d60aa6289e4d1f29d1ca5564992952520c0eff36e5';

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.expires || Date.now() > data.expires) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function setSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_TTL_MS }));
}

function clearSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function showAuthGate() {
  document.documentElement.style.overflow = 'hidden';
  const gate = document.createElement('div');
  gate.id = 'authGate';
  gate.innerHTML = `
    <div class="auth-card">
      <div class="auth-icon">🔒</div>
      <h2>Restricted Access</h2>
      <p>Enter the admin password to continue.</p>
      <form id="authForm">
        <input type="password" id="authPassword" autocomplete="current-password" placeholder="Password" required autofocus>
        <button type="submit" class="btn btn-primary btn-sm">Unlock</button>
      </form>
      <div id="authError" class="auth-error"></div>
    </div>
  `;
  document.body.appendChild(gate);

  document.getElementById('authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('authPassword');
    const errEl = document.getElementById('authError');
    const hash = await sha256Hex(input.value);
    if (hash === ADMIN_PASSWORD_HASH) {
      setSession();
      gate.classList.add('unlocking');
      setTimeout(() => {
        gate.remove();
        document.documentElement.style.overflow = '';
        document.dispatchEvent(new CustomEvent('admin-authenticated'));
      }, 300);
    } else {
      errEl.textContent = 'Incorrect password.';
      input.value = '';
      input.focus();
      gate.querySelector('.auth-card').classList.add('shake');
      setTimeout(() => gate.querySelector('.auth-card').classList.remove('shake'), 400);
    }
  });
}

function initAdminGate(onAuthenticated) {
  if (getSession()) {
    onAuthenticated();
    return;
  }
  showAuthGate();
  document.addEventListener('admin-authenticated', onAuthenticated, { once: true });
}

function adminLogout() {
  clearSession();
  location.reload();
}
