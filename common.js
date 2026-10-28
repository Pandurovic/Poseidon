// Zajednicke funkcije za sve stranice

// Ako korisnik nije prijavljen, vrati ga na login
async function requireLogin() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

function renderNavbar(active) {
  const links = [
    ['clanovi', 'clanovi.html', 'Članovi'],
    ['uplate', 'uplate.html', 'Uplate'],
    ['dugovi', 'dugovi.html', 'Dugovanja'],
    ['grupe', 'grupe.html', 'Grupe'],
    ['dolasci', 'dolasci.html', 'Dolasci'],
  ];
  const items = links.map(([key, href, label]) =>
    `<li class="nav-item"><a class="nav-link ${key === active ? 'active' : ''}" href="${href}">${label}</a></li>`
  ).join('');

  document.getElementById('nav').innerHTML = `
    <nav class="navbar navbar-expand-md navbar-dark bg-primary mb-4">
      <div class="container">
        <a class="navbar-brand" href="clanovi.html">Plivački klub Poseidon | Paraćin</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto">${items}</ul>
          <button class="btn btn-outline-light btn-sm" onclick="logout()">Odjava</button>
        </div>
      </div>
    </nav>`;
}

// Zastita od ubacivanja HTML-a kroz imena i napomene
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function fmtMoney(n) {
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(n) || 0) + ' RSD';
}

// '2026-10-28' -> '28.10.2026.'
function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}.`;
}

// '2026-10-01' -> 'oktobar 2026'
function fmtMonth(d) {
  if (!d) return '';
  const [y, m] = d.split('-');
  const names = ['januar', 'februar', 'mart', 'april', 'maj', 'jun',
    'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  return `${names[Number(m) - 1]} ${y}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

// Danasnji datum u lokalnoj vremenskoj zoni: 'YYYY-MM-DD'
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Tekuci mesec za <input type="month">: 'YYYY-MM'
function thisMonthStr() {
  return todayStr().slice(0, 7);
}

function showAlert(message, type = 'danger') {
  const box = document.getElementById('alertBox');
  if (!box) return alert(message);
  box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
  if (type === 'success') setTimeout(() => { box.innerHTML = ''; }, 3000);
}

// Prazno polje -> null (da baza ne dobije prazan string za datum)
function val(id) {
  const v = document.getElementById(id).value.trim();
  return v === '' ? null : v;
}
