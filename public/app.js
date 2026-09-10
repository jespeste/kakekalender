const state = {
  isAdmin: false,
  entries: [],
};

const authArea = document.getElementById('auth-area');
const adminFormSection = document.getElementById('admin-form-section');
const entryForm = document.getElementById('entry-form');
const entryIdInput = document.getElementById('entry-id');
const entryDateInput = document.getElementById('entry-date');
const entryNameInput = document.getElementById('entry-name');
const entryNoteInput = document.getElementById('entry-note');
const entrySubmitBtn = document.getElementById('entry-submit');
const entryCancelBtn = document.getElementById('entry-cancel');
const entryList = document.getElementById('entry-list');
const emptyState = document.getElementById('empty-state');

const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginCancelBtn = document.getElementById('login-cancel');

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function renderAuthArea() {
  authArea.innerHTML = '';
  const btn = document.createElement('button');
  if (state.isAdmin) {
    btn.textContent = 'Logg ut';
    btn.onclick = logout;
  } else {
    btn.textContent = 'Logg inn som admin';
    btn.onclick = () => loginModal.classList.remove('hidden');
  }
  authArea.appendChild(btn);
}

function renderEntries() {
  entryList.innerHTML = '';
  emptyState.classList.toggle('hidden', state.entries.length > 0);

  for (const entry of state.entries) {
    const li = document.createElement('li');
    li.className = 'entry';

    const info = document.createElement('div');
    info.className = 'entry-info';
    info.innerHTML = `
      <div class="date">${fmtDate(entry.date)}</div>
      <div class="name">${escapeHtml(entry.name)}</div>
      ${entry.note ? `<div class="note">${escapeHtml(entry.note)}</div>` : ''}
    `;
    li.appendChild(info);

    if (state.isAdmin) {
      const actions = document.createElement('div');
      actions.className = 'entry-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'small secondary';
      editBtn.textContent = 'Rediger';
      editBtn.onclick = () => startEdit(entry);

      const delBtn = document.createElement('button');
      delBtn.className = 'small danger';
      delBtn.textContent = 'Slett';
      delBtn.onclick = () => deleteEntry(entry.id);

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      li.appendChild(actions);
    }

    entryList.appendChild(li);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function startEdit(entry) {
  entryIdInput.value = entry.id;
  entryDateInput.value = entry.date;
  entryNameInput.value = entry.name;
  entryNoteInput.value = entry.note || '';
  entrySubmitBtn.textContent = 'Lagre';
  entryCancelBtn.classList.remove('hidden');
  adminFormSection.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  entryForm.reset();
  entryIdInput.value = '';
  entrySubmitBtn.textContent = 'Legg til';
  entryCancelBtn.classList.add('hidden');
}

async function loadEntries() {
  const res = await fetch('/api/entries');
  state.entries = await res.json();
  renderEntries();
}

async function loadSession() {
  const res = await fetch('/api/me');
  const data = await res.json();
  state.isAdmin = Boolean(data.isAdmin);
  adminFormSection.classList.toggle('hidden', !state.isAdmin);
  renderAuthArea();
  renderEntries();
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  state.isAdmin = false;
  adminFormSection.classList.add('hidden');
  renderAuthArea();
  renderEntries();
}

entryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = entryIdInput.value;
  const body = {
    date: entryDateInput.value,
    name: entryNameInput.value.trim(),
    note: entryNoteInput.value.trim(),
  };

  const res = await fetch(id ? `/api/entries/${id}` : '/api/entries', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    resetForm();
    await loadEntries();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Noe gikk galt');
  }
});

entryCancelBtn.addEventListener('click', resetForm);

async function deleteEntry(id) {
  if (!confirm('Er du sikker på at du vil slette denne oppføringen?')) return;
  const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
  if (res.ok) {
    await loadEntries();
  } else {
    alert('Kunne ikke slette oppføringen');
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: loginUsername.value, password: loginPassword.value }),
  });

  if (res.ok) {
    loginModal.classList.add('hidden');
    loginForm.reset();
    await loadSession();
  } else {
    const data = await res.json().catch(() => ({}));
    loginError.textContent = data.error || 'Innlogging feilet';
    loginError.classList.remove('hidden');
  }
});

loginCancelBtn.addEventListener('click', () => {
  loginModal.classList.add('hidden');
  loginForm.reset();
  loginError.classList.add('hidden');
});

(async function init() {
  await loadSession();
  await loadEntries();
})();
