import './style.css';

// =============================================
// CARE NOTE - Main Application Logic (Demo Mode)
// Backend: localStorage (will be replaced by Supabase)
// =============================================

const MOODS = {
  terrible: { emoji: '😢', label: 'Très mal', score: 1 },
  bad:      { emoji: '😕', label: 'Pas trop bien', score: 2 },
  neutral:  { emoji: '😐', label: 'Normal', score: 3 },
  good:     { emoji: '😊', label: 'Très bien', score: 4 },
  great:    { emoji: '🤩', label: 'Super bien', score: 5 },
};

const QUOTES = [
  "La joie est en vous, cherchez-la à l'intérieur. – Cicéron",
  "Prenez soin de votre corps, c'est le seul endroit où vous devez vivre. – Jim Rohn",
  "Le bonheur n'est pas quelque chose de tout fait. Il vient de vos propres actions. – Dalaï Lama",
  "Chaque jour est une nouvelle chance de changer votre vie. – Anonyme",
  "La gratitude transforme ce que nous avons en suffisance. – Anonyme",
  "Soyez vous-même ; tous les autres sont déjà pris. – Oscar Wilde",
  "La vie est ce que vous en faites. Souriez beaucoup et aimez vraiment. – L.M. Montgomery",
  "Votre seule limite, c'est votre âme. – René Lalique",
  "Commencez là où vous êtes. Utilisez ce que vous avez. Faites ce que vous pouvez. – Arthur Ashe",
  "Le secret pour aller de l'avant est de commencer. – Mark Twain",
];

const AI_SUGGESTIONS = {
  terrible: "💙 Je suis avec vous aujourd'hui. Essayez de respirer profondément 5 fois, prenez un thé chaud et accordez-vous un moment de douceur. Vous méritez du réconfort.",
  bad:       "🌤️ C'est une journée difficile, mais elle passera. Un peu de mouvement — même une courte promenade — peut faire beaucoup de bien. Soyez patient(e) avec vous-même.",
  neutral:   "😊 Une journée ordinaire, et c'est bien aussi ! Profitez de ce calme pour faire quelque chose qui vous plaît. Peut-être regarder un film ou lire un livre ?",
  good:      "✨ Quelle belle énergie ! C'est le moment idéal pour partager votre bonne humeur avec quelqu'un que vous aimez ou pour avancer sur un projet qui vous tient à cœur.",
  great:     "🌟 Vous rayonnez aujourd'hui ! Profitez de cette énergie positive pour créer de beaux souvenirs. Notez ce qui vous a rendu(e) si heureux(se) pour vous en souvenir.",
};

// ====================== STATE ======================
let currentUser = null;
let currentMoodSelected = null;
let editingEntryId = null;
let editingModalMood = null;
let currentFilter = 'all';

// ====================== INIT ======================
window.addEventListener('DOMContentLoaded', () => {
  // Load theme
  const savedTheme = localStorage.getItem('care-note-theme') || 'blue';
  setTheme(savedTheme);

  // Check session
  const session = localStorage.getItem('care-note-session');
  if (session) {
    currentUser = JSON.parse(session);
    showDashboard();
  }

  // Form listeners
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('signup-form').addEventListener('submit', handleSignup);

  // Enable save button when mood selected
  document.getElementById('mood-note').addEventListener('input', updateSaveBtn);

  // Load quote
  loadQuote();
});

// ====================== THEME ======================
window.setTheme = function(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('care-note-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(d => d.classList.remove('active'));
  const btn = document.getElementById('btn-' + theme);
  if (btn) btn.classList.add('active');
};

// ====================== AUTH TABS ======================
window.switchTab = function(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
};

// ====================== AUTH HANDLERS ======================
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const users = JSON.parse(localStorage.getItem('care-note-users') || '[]');
  const user = users.find(u => u.email === email);

  if (!user) {
    showError(errorEl, '❌ Aucun compte trouvé avec cet email.');
    return;
  }
  if (user.password !== btoa(password)) {
    showError(errorEl, '❌ Mot de passe incorrect.');
    return;
  }

  errorEl.style.display = 'none';
  currentUser = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem('care-note-session', JSON.stringify(currentUser));
  showToast('Bienvenue ' + user.name + ' ! 🐻', 'success');
  showDashboard();
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errorEl = document.getElementById('signup-error');

  const users = JSON.parse(localStorage.getItem('care-note-users') || '[]');

  if (users.find(u => u.email === email)) {
    showError(errorEl, '❌ Un compte existe déjà avec cet email.');
    return;
  }

  const newUser = {
    id: 'user_' + Date.now(),
    name,
    email,
    password: btoa(password),
  };

  users.push(newUser);
  localStorage.setItem('care-note-users', JSON.stringify(users));

  errorEl.style.display = 'none';
  currentUser = { id: newUser.id, name, email };
  localStorage.setItem('care-note-session', JSON.stringify(currentUser));
  showToast('Compte créé avec succès ! Bienvenue ' + name + ' 🌸', 'success');
  showDashboard();
}

window.logout = function() {
  localStorage.removeItem('care-note-session');
  currentUser = null;
  currentMoodSelected = null;
  document.getElementById('dashboard-wrapper').classList.remove('visible');
  document.getElementById('auth-wrapper').style.display = 'flex';
  document.getElementById('login-form').reset();
  showToast('À bientôt ! 🐻', 'info');
};

// ====================== DASHBOARD ======================
function showDashboard() {
  document.getElementById('auth-wrapper').style.display = 'none';
  const dash = document.getElementById('dashboard-wrapper');
  dash.classList.add('visible');

  // Set user info
  document.getElementById('user-name-display').textContent = currentUser.name;
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

  renderHistory();
  updateStats();
  loadAISuggestion();
}

// ====================== MOOD ======================
window.selectMood = function(el) {
  document.querySelectorAll('#dashboard-wrapper .mood-selector .mood-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  currentMoodSelected = el.dataset.mood;
  updateSaveBtn();
};

function updateSaveBtn() {
  const btn = document.getElementById('save-mood-btn');
  btn.disabled = !currentMoodSelected;
  if (currentMoodSelected) {
    btn.textContent = `Enregistrer mon humeur ${MOODS[currentMoodSelected].emoji}`;
  } else {
    btn.textContent = 'Choisissez d\'abord une humeur';
  }
}

window.saveMood = function() {
  if (!currentMoodSelected) return;

  const note = document.getElementById('mood-note').value.trim();
  const entries = getEntries();

  const newEntry = {
    id: 'entry_' + Date.now(),
    userId: currentUser.id,
    mood: currentMoodSelected,
    note,
    date: new Date().toISOString(),
  };

  entries.unshift(newEntry);
  saveEntries(entries);

  // Reset
  document.querySelectorAll('#dashboard-wrapper .mood-selector .mood-option').forEach(o => o.classList.remove('selected'));
  currentMoodSelected = null;
  document.getElementById('mood-note').value = '';
  updateSaveBtn();

  renderHistory();
  updateStats();
  loadAISuggestion();
  showToast('Humeur enregistrée ! ' + MOODS[newEntry.mood].emoji, 'success');
};

// ====================== HISTORY ======================
function getEntries() {
  const all = JSON.parse(localStorage.getItem('care-note-entries') || '[]');
  return all.filter(e => e.userId === currentUser.id);
}

function saveEntries(entries) {
  const all = JSON.parse(localStorage.getItem('care-note-entries') || '[]');
  const others = all.filter(e => e.userId !== currentUser.id);
  localStorage.setItem('care-note-entries', JSON.stringify([...entries, ...others]));
}

function renderHistory(filter = currentFilter) {
  const container = document.getElementById('history-list');
  let entries = getEntries();

  if (filter !== 'all') {
    entries = entries.filter(e => e.mood === filter);
  }

  if (entries.length === 0) {
    container.innerHTML = '<div class="history-empty">Aucune entrée trouvée. ✨</div>';
    return;
  }

  container.innerHTML = entries.map(entry => {
    const mood = MOODS[entry.mood];
    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `
      <div class="history-item" id="entry-${entry.id}">
        <div class="history-emoji">${mood.emoji}</div>
        <div class="history-content">
          <div class="history-date">${dateStr}</div>
          <div class="history-mood-name">${mood.label}</div>
          ${entry.note ? `<div class="history-note">${entry.note}</div>` : ''}
        </div>
        <div class="history-actions">
          <button class="btn-hist edit" onclick="openEditModal('${entry.id}')" title="Modifier">✏️</button>
          <button class="btn-hist delete" onclick="deleteEntry('${entry.id}')" title="Supprimer">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

window.filterHistory = function(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHistory(filter);
};

window.deleteEntry = function(id) {
  const entries = getEntries().filter(e => e.id !== id);
  saveEntries(entries);
  renderHistory();
  updateStats();
  showToast('Entrée supprimée.', 'info');
};

// ====================== EDIT MODAL ======================
window.openEditModal = function(id) {
  const entry = getEntries().find(e => e.id === id);
  if (!entry) return;

  editingEntryId = id;
  editingModalMood = entry.mood;

  document.querySelectorAll('#edit-modal .mood-option').forEach(o => {
    o.classList.toggle('selected', o.dataset.mood === entry.mood);
  });

  document.getElementById('modal-note').value = entry.note || '';
  document.getElementById('edit-modal').classList.add('open');
};

window.selectModalMood = function(el) {
  document.querySelectorAll('#edit-modal .mood-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  editingModalMood = el.dataset.mood;
};

window.closeModal = function() {
  document.getElementById('edit-modal').classList.remove('open');
  editingEntryId = null;
  editingModalMood = null;
};

window.saveEdit = function() {
  if (!editingEntryId || !editingModalMood) return;

  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === editingEntryId);
  if (idx === -1) return;

  entries[idx].mood = editingModalMood;
  entries[idx].note = document.getElementById('modal-note').value.trim();
  saveEntries(entries);

  closeModal();
  renderHistory();
  updateStats();
  showToast('Entrée modifiée avec succès ! ✨', 'success');
};

// Close modal on overlay click
document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ====================== STATS ======================
function updateStats() {
  const entries = getEntries();
  document.getElementById('stat-total').textContent = entries.length;

  const positive = entries.filter(e => MOODS[e.mood].score >= 4).length;
  document.getElementById('stat-positive').textContent = positive;

  // Simple streak: consecutive days with entries
  document.getElementById('stat-streak').textContent = calculateStreak(entries);
}

function calculateStreak(entries) {
  if (entries.length === 0) return 0;
  const dates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ====================== AI SUGGESTION ======================
function loadAISuggestion() {
  const entries = getEntries();
  const el = document.getElementById('ai-suggestion-text');

  if (entries.length === 0) {
    el.textContent = 'Enregistrez votre première humeur pour recevoir un conseil personnalisé ! 🌟';
    return;
  }

  const lastMood = entries[0].mood;
  el.textContent = AI_SUGGESTIONS[lastMood];
}

// ====================== QUOTE ======================
function loadQuote() {
  const el = document.getElementById('daily-quote-text');
  const today = new Date().toDateString();
  const saved = localStorage.getItem('care-note-quote');

  if (saved) {
    const { date, quote } = JSON.parse(saved);
    if (date === today) {
      el.textContent = '« ' + quote + ' »';
      return;
    }
  }

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  localStorage.setItem('care-note-quote', JSON.stringify({ date: today, quote }));
  el.textContent = '« ' + quote + ' »';
}

// ====================== TOAST ======================
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: '💬' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

// ====================== HELPERS ======================
function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}
