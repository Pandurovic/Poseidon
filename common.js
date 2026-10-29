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

  // Hamburger meni do 992px (iPhone i iPad uspravno), pun meni na iPad-u položeno i na PC-u
  document.getElementById('nav').innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div class="container-fluid container-lg">
        <a class="navbar-brand" href="clanovi.html">
          <span class="d-none d-lg-inline">Plivački klub Poseidon | Paraćin</span>
          <span class="d-lg-none">PK Poseidon</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Meni">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto">${items}</ul>
          <button class="btn btn-outline-light btn-sm mt-2 mt-lg-0" onclick="logout()">Odjava</button>
        </div>
      </div>
    </nav>
    <div class="container-fluid container-lg" id="viberPodsetnik"></div>`;
  if (active !== 'dugovi') renderViberPodsetnik();
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

// Poslednji dan meseca: '2026-10' -> '2026-10-31'
function lastDayOfMonth(mesec) {
  const [y, m] = mesec.split('-').map(Number);
  return `${mesec}-${pad(new Date(y, m, 0).getDate())}`;
}

// Pomera mesec 'YYYY-MM' za delta meseci
function shiftMonth(mesec, delta) {
  const [y, m] = mesec.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// Pretraga bez obzira na dijakritike: "Cirkovic" nalazi "Ćirković"
function norm(s) {
  return String(s ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'dj');
}

function showAlert(message, type = 'danger') {
  const box = document.getElementById('alertBox');
  if (!box) return alert(message);
  box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
  if (type === 'success') setTimeout(() => { box.innerHTML = ''; }, 3000);
}

// Prazno polje -> null (da baza ne dobije prazan string za datum)
function val(id) {
  const v = document.getElementById(id).value.trim();
  return v === '' ? null : v;
}

// Onemogući dugme dok traje snimanje (sprečava dvostruki klik / dvostruku uplatu)
function setBusy(btn, busy, busyText = 'Čuvanje...') {
  if (!btn) return;
  if (busy) {
    btn.dataset.tekst = btn.textContent;
    btn.disabled = true;
    btn.textContent = busyText;
  } else {
    btn.disabled = false;
    if (btn.dataset.tekst) btn.textContent = btn.dataset.tekst;
  }
}

// Zamena za confirm(): lep prozor koji radi dobro i na telefonu. Vraća Promise<boolean>
function confirmDialog(poruka, { okText = 'Potvrdi', danger = false } = {}) {
  return new Promise(resolve => {
    let el = document.getElementById('confirmModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'confirmModal';
      el.className = 'modal fade';
      el.tabIndex = -1;
      el.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body fs-6 pt-4" id="confirmText"></div>
            <div class="modal-footer border-0 pt-0">
              <button type="button" class="btn btn-secondary" id="confirmNo">Otkaži</button>
              <button type="button" class="btn" id="confirmYes"></button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(el);
    }
    el.querySelector('#confirmText').textContent = poruka;
    const yes = el.querySelector('#confirmYes');
    yes.textContent = okText;
    yes.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

    const modal = bootstrap.Modal.getOrCreateInstance(el);
    let rezultat = false;
    yes.onclick = () => { rezultat = true; modal.hide(); };
    el.querySelector('#confirmNo').onclick = () => modal.hide();
    el.addEventListener('hidden.bs.modal', () => resolve(rezultat), { once: true });
    modal.show();
  });
}


// =====================================================
// Viber poruka roditeljima o clanarini + podsetnik
// Prva polovina meseca (1-15) i druga polovina (16-kraj) imaju razlicit tekst.
// Podatak "poslato" se pamti u ovom pregledacu (telefon i racunar ne dele podsetnik).
// =====================================================
function viberPeriod() {
  const mesec = thisMonthStr();
  const deo = new Date().getDate() <= 15 ? 1 : 2;
  return { mesec, deo, kljuc: `viber_poslato_${mesec}_${deo}` };
}

function viberTekst(mesec, deo) {
  const naziv = fmtMonth(mesec + '-01').split(' ')[0];   // 'oktobar'
  if (deo === 1) {
    return `Poštovani roditelji, zamolili bismo vas da članarine za ${naziv} izmirite blagovremeno. \nHvala na razumevanju i saradnji! 🧜🏻‍♂️😄`;
  }
  return `Poštovani roditelji, \n\nMolimo vas da, ukoliko još uvek niste izmirili članarinu za tekući mesec, to učinite u toku ove nedelje.\n\nHvala vam na razumevanju i saradnji!`;
}

function viberDatumSlanja(kljuc) {
  try { return localStorage.getItem(kljuc); } catch { return null; }
}
function viberZapamti(kljuc, vrednost) {
  try { localStorage.setItem(kljuc, vrednost); } catch { /* privatni rezim: podsetnik nece pamtiti */ }
}

// Kopira poruku, otvara Viber (ekran za prosledjivanje poruke) i pamti da je poslato
async function posaljiViber() {
  const { mesec, deo, kljuc } = viberPeriod();
  const tekst = viberTekst(mesec, deo);

  let kopirano = false;
  try { await navigator.clipboard.writeText(tekst); kopirano = true; } catch { /* nastavi bez kopiranja */ }

  viberZapamti(kljuc, todayStr());
  showAlert(kopirano
    ? 'Poruka je kopirana i otvara se Viber. Ako se Viber ne otvori, nalepite poruku u grupu.'
    : 'Otvara se Viber. Ako se poruka ne pojavi, vratite se i pokušajte ponovo.', 'success');

  window.location.href = 'viber://forward?text=' + encodeURIComponent(tekst);
  renderViberPodsetnik();
  if (typeof osveziViberStatus === 'function') osveziViberStatus();
}

function preskociViber() {
  const { kljuc } = viberPeriod();
  viberZapamti(kljuc, todayStr());
  renderViberPodsetnik();
}

// Zuti baner na svim stranicama dok poruka za ovu polovinu meseca nije poslata
function renderViberPodsetnik() {
  const box = document.getElementById('viberPodsetnik');
  if (!box) return;
  const { mesec, deo, kljuc } = viberPeriod();
  if (viberDatumSlanja(kljuc)) { box.innerHTML = ''; return; }
  const naziv = fmtMonth(mesec + '-01').split(' ')[0];
  const kada = deo === 1 ? 'prvu polovinu' : 'drugu polovinu';
  box.innerHTML = `
    <div class="alert alert-warning shadow-sm d-flex flex-wrap align-items-center gap-2 mb-3" role="alert">
      <div class="flex-grow-1">🔔 Još niste poslali poruku roditeljima o članarini za ${kada} meseca (${naziv}).</div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-primary" onclick="posaljiViber()">Pripremi poruku za Viber</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="preskociViber()">Preskoči</button>
      </div>
    </div>`;
}
