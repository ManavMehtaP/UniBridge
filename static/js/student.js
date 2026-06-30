// ── NAV DATA ──
// URL configuration - will be overridden by Django template
let STUDENT_URLS = {
  dashboard: '/',
  notes: '/notes/',
  smart_notes: '/smart-notes/',
  assignments: '/assignments/',
  calendar: '/calendar/',
  profile: '/profile/',
  results: '/results/',
};

// Function to set URLs from Django template
function setStudentUrls(urls) {
  STUDENT_URLS = { ...STUDENT_URLS, ...urls };
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`, getUrl: () => STUDENT_URLS.dashboard },
  { id: 'notes', label: 'My Notes', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`, getUrl: () => STUDENT_URLS.notes },
  { id: 'smart_notes', label: 'Smart Notes', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>`, getUrl: () => STUDENT_URLS.smart_notes },
  { id: 'assignments', label: 'Assignments', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`, getUrl: () => STUDENT_URLS.assignments },
  { id: 'calendar', label: 'Calendar', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>`, getUrl: () => STUDENT_URLS.calendar },
  { id: 'results', label: 'Results', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`, getUrl: () => STUDENT_URLS.results },
  { id: 'profile', label: 'Profile', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, getUrl: () => STUDENT_URLS.profile },
];

// ── RENDER SIDEBAR ──
function renderSidebar(activeId) {
  return `
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="logo">LJ</div>
      <div class="brand-text">
        <div class="brand-name">LJ University</div>
        <div class="brand-sub">Student Portal</div>
      </div>
    </div>
    <div class="sidebar-ctx">
      <div class="ctx-label">Academic Year</div>
      <select onchange="window.location.href=window.location.href">
        <option>2026 – 2027</option>
        <option>2025 – 2026</option>
      </select>
      <div class="ctx-label" style="margin-top:6px">Semester</div>
      <div class="ctx-val">Semester 3 • Active</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      ${NAV.map(n => `
        <a href="${n.getUrl()}" class="nav-item ${n.id === activeId ? 'active' : ''}">
          <span class="nav-icon">${n.icon}</span>
          ${n.label}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar">SM</div>
        <div class="user-info">
          <div class="user-name">Student Name</div>
          <div class="user-role">IT Department</div>
        </div>
      </div>
    </div>
  </aside>`;
}

// ── RENDER TOPBAR ──
function renderTopbar(title) {
  return `
  <header class="topbar">
    <div class="search-wrap">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" placeholder="Search notes, assignments, subjects…">
    </div>
    <div class="topbar-right">
      <div class="icon-btn">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="badge">3</span>
      </div>
      <div class="topbar-user">
        <div class="avatar">SM</div>
        <div>
          <div class="user-name">Student Name</div>
          <div class="user-role">IT Department</div>
        </div>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:var(--text-muted);margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  </header>`;
}

// ── TOAST SYSTEM ──
function showToast(msg, type = '') {
  const icons = { success: '✓', error: '✕', warning: '⚠' };
  const container = document.querySelector('.toast-container') || (() => {
    const el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── MODAL HELPERS ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// ── TABS ──
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('[data-tabs]');
      const target = tab.dataset.tab;
      group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll(`[data-tab-content]`).forEach(c => {
        c.classList.toggle('active', c.dataset.tabContent === target);
      });
    });
  });
}

// ── FILE DROP ──
function initFileDrop(dropEl, onFile) {
  if (!dropEl) return;
  dropEl.addEventListener('dragover', e => { e.preventDefault(); dropEl.classList.add('drag'); });
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('drag'));
  dropEl.addEventListener('drop', e => {
    e.preventDefault(); dropEl.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  });
  dropEl.addEventListener('click', () => dropEl.querySelector('input')?.click());
  const inp = dropEl.querySelector('input[type=file]');
  if (inp) inp.addEventListener('change', e => { if (e.target.files[0]) onFile(e.target.files[0]); });
}

// ── PERCENTAGE COLOR ──
function pctColor(pct) {
  if (pct >= 85) return 'var(--success)';
  if (pct >= 75) return 'var(--warning)';
  return 'var(--danger)';
}
function pctClass(pct) {
  if (pct >= 85) return 'success';
  if (pct >= 75) return 'warning';
  return 'danger';
}
function pctBadgeClass(pct) {
  if (pct >= 85) return 'badge-success';
  if (pct >= 75) return 'badge-warning';
  return 'badge-danger';
}
