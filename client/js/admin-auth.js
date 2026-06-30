const ADMIN_SESSION_KEY = 'portfolio_admin_session';
const ADMIN_TOKEN_KEY = 'portfolio_admin_token';
const SESSION_TTL_MS = 1000 * 60 * 60 * 2;

function getSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.expires || Date.now() > data.expires) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function setSession(token) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_TTL_MS }));
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

function showAuthGate() {
  const gate = document.createElement('div');
  gate.id = 'authGate';
  gate.innerHTML = `
    <div class="auth-card">
      <div class="auth-icon"><i class="fa-solid fa-lock"></i></div>
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

    try {
      const res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.value })
      });

      const json = await res.json();

      if (json.success && json.token) {
        setSession(json.token);
        gate.remove();
        document.dispatchEvent(new CustomEvent('admin-authenticated'));
      } else {
        errEl.textContent = 'Incorrect password.';
        input.value = '';
        input.focus();
        gate.querySelector('.auth-card').classList.add('shake');
        setTimeout(() => gate.querySelector('.auth-card').classList.remove('shake'), 400);
      }
    } catch (err) {
      console.error('Auth fetch error:', err);
      if (window.location.protocol === 'file:') {
        errEl.textContent = 'Open this page via the server: start the server with "npm start" in the server/ folder, then go to http://localhost:3001/vault-7c3f9a.html';
      } else if (typeof API_BASE === 'undefined') {
        errEl.textContent = 'Script error: data.js did not load properly. Check the browser console (F12) for errors.';
      } else {
        errEl.textContent = 'Cannot reach the server at ' + window.location.origin + '/api/auth. Is the server running on port 3001? Try: cd server && npm start';
      }
    }
  });
}

async function initAdminGate(onAuthenticated) {
  if (window.location.protocol === 'file:') {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0d14;color:#f3f3f6;font-family:sans-serif;flex-direction:column;gap:16px;padding:32px;"><h1 style="font-size:1.4rem;">Server Required</h1><p style="color:rgba(255,255,255,0.6);text-align:center;max-width:400px;line-height:1.6;">Run:</p><code style="background:rgba(255,255,255,0.06);padding:12px 20px;border-radius:6px;">cd server && npm start</code><p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Then visit <strong>http://localhost:3001/vault-7c3f9a.html</strong></p></div>';
    return;
  }
  if (getSession()) {
    try {
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const res = await fetch(API_BASE + '/auth/verify', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (json.valid) {
        onAuthenticated();
        return;
      }
    } catch (e) {}
    clearSession();
  }
  showAuthGate();
  document.addEventListener('admin-authenticated', onAuthenticated, { once: true });
}

function adminLogout() {
  clearSession();
  location.reload();
}
