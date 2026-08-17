/* ═══════════════════════════════════════════
   JobFinder — Main Application
   ═══════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── State ────────────────────────────── */
  let state = {
    profile: null,
    jobs: [],
    savedJobs: [],
    currentView: 'upload',
    currentJob: null,
    activeFilter: 'all',
    searchQuery: ''
  };

  /* ── DOM Refs ─────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    splash: $('#splash'),
    header: $('#appHeader'),
    main: $('#appMain'),
    views: {
      upload: $('#view-upload'),
      results: $('#view-results'),
      detail: $('#view-detail'),
      profile: $('#view-profile')
    },
    upload: {
      dropZone: $('#dropZone'),
      fileInput: $('#fileInput'),
      fileInfo: $('#fileInfo'),
      fileName: $('#fileName'),
      removeFile: $('#removeFile'),
      cvPreview: $('#cvPreview'),
      cvSkills: $('#cvSkills'),
      cvExperience: $('#cvExperience'),
      btnSearch: $('#btnSearch'),
      dividerOr: $('#dividerOr'),
      btnManual: $('#btnManual'),
      manualCard: $('#manualCard'),
      btnManualSearch: $('#btnManualSearch'),
      manualName: $('#manualName'),
      manualSkills: $('#manualSkills'),
      manualExp: $('#manualExp'),
      manualLocation: $('#manualLocation')
    },
    results: {
      list: $('#resultsList'),
      noResults: $('#noResults'),
      jobCount: $('#jobCount'),
      searchInput: $('#searchInput'),
      filterChips: $('#filterChips'),
      btnBack: $('#btnBack'),
      btnRetry: $('#btnRetry')
    },
    detail: {
      content: $('#detailContent'),
      btnBack: $('#btnDetailBack'),
      btnApply: $('#btnApply'),
      btnSave: $('#btnSave')
    },
    profile: {
      name: $('#profileName'),
      skills: $('#profileSkills'),
      savedJobs: $('#savedJobs'),
      btnBack: $('#btnProfileBack'),
      btnReset: $('#btnReset'),
      prefDark: $('#prefDark'),
      prefNotif: $('#prefNotif')
    },
    toast: $('#toast'),
    modal: $('#modal'),
    modalContent: $('#modalContent'),
    installBanner: $('#installBanner'),
    installBtn: $('#installBtn'),
    installClose: $('#installClose')
  };

  /* ── Toast ────────────────────────────── */
  function showToast(msg, duration = 2500) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), duration);
  }

  /* ── Confetti ─────────────────────────── */
  function spawnConfetti() {
    const colors = ['#6c5ce7', '#a78bfa', '#60a5fa', '#34d399', '#fb923c', '#f87171'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (1 + Math.random()) + 's';
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.width = (4 + Math.random() * 8) + 'px';
      piece.style.height = (4 + Math.random() * 8) + 'px';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  /* ── View Navigation ──────────────────── */
  function navigateTo(viewName) {
    Object.values(els.views).forEach(v => v.classList.remove('active'));
    const view = els.views[viewName];
    if (view) {
      view.classList.add('active');
      view.style.animation = 'none';
      view.offsetHeight; // reflow
      view.style.animation = 'viewIn 0.4s both';
    }
    state.currentView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── CV Parser ────────────────────────── */
  function parseCV(text) {
    const lower = text.toLowerCase();
    const skills = [];
    const allSkillKeys = Object.keys(JobDB._skillMap);

    for (const skill of allSkillKeys) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }

    let level = 'mid';
    if (/\b(junior|entry.level|graduate|trainee|intern|practicante|becario)\b/i.test(text)) level = 'junior';
    else if (/\b(senior|sr\.?|experienced|expert|principal)\b/i.test(text)) level = 'senior';
    else if (/\b(lead|manager|director|head|staff|architect|tech lead)\b/i.test(text)) level = 'lead';

    let name = '';
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      name = lines[0].replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '').trim();
      if (name.length > 40) name = name.slice(0, 40);
    }

    const expMatch = text.match(/(\d+)\s*(?:years?|años?|yrs?)\s*(?:of\s+)?(?:experience|experiencia)/i);
    let experience = '';
    if (expMatch) experience = `${expMatch[1]} años de experiencia`;

    if (skills.length === 0) {
      const generic = ['Communication', 'Problem Solving', 'Teamwork', 'Leadership'];
      generic.forEach(s => { if (lower.includes(s.toLowerCase())) skills.push(s); });
    }
    if (skills.length === 0) {
      skills.push('JavaScript', 'HTML', 'CSS', 'Git');
    }

    return { name, skills: [...new Set(skills)], level, experience };
  }

  /* ── File Handling ────────────────────── */
  function handleFile(file) {
    if (!file) return;

    const validTypes = ['application/pdf', 'text/plain'];
    const validExts = ['.pdf', '.txt'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      showToast('Formato no soportado. Usa PDF o TXT.');
      return;
    }

    els.upload.fileName.textContent = file.name;
    els.upload.fileInfo.classList.remove('hidden');
    els.upload.dropZone.style.display = 'none';

    if (file.type === 'text/plain' || ext === '.txt') {
      const reader = new FileReader();
      reader.onload = (e) => processCVText(e.target.result);
      reader.readAsText(file);
    } else {
      processCVText(extractTextFromFileName(file.name));
    }
  }

  function extractTextFromFileName(name) {
    return name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
  }

  function processCVText(text) {
    const profile = parseCV(text);
    state.profile = profile;

    els.upload.cvSkills.innerHTML = '';
    profile.skills.forEach((skill, i) => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill;
      tag.style.animationDelay = `${i * 0.05}s`;
      els.upload.cvSkills.appendChild(tag);
    });

    els.upload.cvExperience.innerHTML = `
      <p><strong>Nivel:</strong> ${JobDB.expLabels[profile.level] || profile.level}</p>
      ${profile.experience ? `<p>${profile.experience}</p>` : ''}
    `;

    els.upload.cvPreview.classList.remove('hidden');
    els.upload.btnSearch.classList.remove('hidden');
    els.upload.dividerOr.classList.remove('hidden');
    els.upload.btnManual.classList.remove('hidden');

    els.upload.cvPreview.style.animation = 'none';
    els.upload.cvPreview.offsetHeight;
    els.upload.cvPreview.style.animation = 'slideUp 0.4s both';

    showToast('CV analizado correctamente');
  }

  /* ── Search Jobs ──────────────────────── */
  function searchJobs() {
    if (!state.profile) {
      showToast('Primero sube tu CV o ingresa tus datos');
      return;
    }

    showLoadingSkeletons();

    setTimeout(() => {
      state.jobs = JobDB.searchJobs(state.profile);
      renderResults();
      navigateTo('results');
    }, 800);
  }

  function showLoadingSkeletons() {
    els.results.list.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const skel = document.createElement('div');
      skel.className = 'skeleton skeleton-card';
      els.results.list.appendChild(skel);
    }
  }

  /* ── Render Results ───────────────────── */
  function renderResults() {
    let filtered = [...state.jobs];

    if (state.activeFilter !== 'all') {
      filtered = filtered.filter(j => j.workMode === state.activeFilter);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    els.results.jobCount.textContent = filtered.length;

    if (filtered.length === 0) {
      els.results.list.innerHTML = '';
      els.results.noResults.classList.remove('hidden');
      return;
    }

    els.results.noResults.classList.add('hidden');
    els.results.list.innerHTML = '';

    filtered.forEach((job, i) => {
      const card = createJobCard(job);
      card.style.animationDelay = `${i * 0.06}s`;
      els.results.list.appendChild(card);
    });

    els.results.list.classList.add('stagger');
  }

  function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.dataset.id = job.id;

    let matchClass = 'match-low';
    if (job.match >= 70) matchClass = 'match-high';
    else if (job.match >= 40) matchClass = 'match-mid';

    const workModeEmoji = job.workMode === 'remote' ? '🌐' : job.workMode === 'hybrid' ? '🏢' : '📍';
    const workModeLabel = job.workMode === 'remote' ? 'Remoto' : job.workMode === 'hybrid' ? 'Híbrido' : 'Presencial';

    card.innerHTML = `
      <div class="job-match ${matchClass}">${job.match}% match</div>
      <div class="job-card-top">
        <div class="job-logo">${job.companyEmoji}</div>
        <div class="job-info">
          <div class="job-title">${job.title}</div>
          <div class="job-company">${job.company}</div>
        </div>
      </div>
      <div class="job-meta">
        <span class="job-meta-item"><span class="icon">${workModeEmoji}</span>${workModeLabel}</span>
        <span class="job-meta-item"><span class="icon">📍</span>${job.location}</span>
        <span class="job-meta-item"><span class="icon">💰</span>${job.salary}</span>
        <span class="job-meta-item"><span class="icon">⏰</span>${job.posted}</span>
      </div>
      <div class="job-tags">
        ${job.tags.map(t => `<span class="job-tag">${t}</span>`).join('')}
      </div>
    `;

    card.addEventListener('click', () => showJobDetail(job));
    return card;
  }

  /* ── Job Detail ───────────────────────── */
  function showJobDetail(job) {
    state.currentJob = job;
    const workModeLabel = job.workMode === 'remote' ? 'Remoto' : job.workMode === 'hybrid' ? 'Híbrido' : 'Presencial';
    const workModeEmoji = job.workMode === 'remote' ? '🌐' : job.workMode === 'hybrid' ? '🏢' : '📍';
    const isSaved = state.savedJobs.includes(job.id);

    els.detail.content.innerHTML = `
      <div class="company-header">
        <div class="company-logo">${job.companyEmoji}</div>
        <div>
          <div class="company-name">${job.company}</div>
          <div class="job-meta-item">${job.posted}</div>
        </div>
      </div>
      <div class="job-title-lg">${job.title}</div>
      <div class="detail-meta">
        <div class="detail-meta-item">${workModeEmoji} ${workModeLabel}</div>
        <div class="detail-meta-item">📍 ${job.location}</div>
        <div class="detail-meta-item">⏰ ${job.expLabel}</div>
        <div class="detail-meta-item">👥 ${job.applicants} postulantes</div>
      </div>
      <div class="detail-salary">${job.salary}</div>
      <div class="detail-section">
        <h3>Descripción</h3>
        <p style="font-size:0.9rem; line-height:1.7; color:var(--text-2)">${job.description}</p>
      </div>
      <div class="detail-section">
        <h3>Requisitos</h3>
        <ul>
          ${job.requirements.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      <div class="detail-section">
        <h3>Beneficios</h3>
        <ul>
          ${job.benefits.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
      <div class="detail-section">
        <h3>Match con tu perfil</h3>
        <div style="display:flex; align-items:center; gap:12px; margin-top:8px">
          <div style="flex:1; height:8px; background:var(--bg-3); border-radius:100px; overflow:hidden">
            <div style="width:${job.match}%; height:100%; background:linear-gradient(90deg, var(--accent), var(--green)); border-radius:100px; transition:width 0.8s ease"></div>
          </div>
          <span style="font-weight:700; color:${job.match >= 70 ? 'var(--green)' : job.match >= 40 ? 'var(--orange)' : 'var(--red)'}">${job.match}%</span>
        </div>
      </div>
    `;

    els.detail.btnSave.innerHTML = isSaved
      ? '<span>♥</span> Guardado'
      : '<span>♡</span> Guardar';

    navigateTo('detail');

    setTimeout(() => {
      const bar = els.detail.content.querySelector('[style*="width:0"]');
      if (bar) {
        bar.style.width = job.match + '%';
      }
    }, 300);
  }

  /* ── Save / Unsave ────────────────────── */
  function toggleSave() {
    if (!state.currentJob) return;
    const idx = state.savedJobs.indexOf(state.currentJob.id);
    if (idx > -1) {
      state.savedJobs.splice(idx, 1);
      showToast('Empleo eliminado de guardados');
    } else {
      state.savedJobs.push(state.currentJob.id);
      showToast('Empleo guardado ♥');
    }
    Store.update({ savedJobs: state.savedJobs });
    els.detail.btnSave.innerHTML = state.savedJobs.includes(state.currentJob.id)
      ? '<span>♥</span> Guardado'
      : '<span>♡</span> Guardar';
  }

  /* ── Apply Confetti ───────────────────── */
  function applyToJob() {
    spawnConfetti();
    showModal(`
      <div style="text-align:center">
        <div style="font-size:3rem; margin-bottom:16px">🎉</div>
        <h2 style="margin-bottom:8px">¡Postulación enviada!</h2>
        <p style="color:var(--text-2); font-size:0.9rem; margin-bottom:20px">
          Tu perfil ha sido enviado a <strong>${state.currentJob?.company}</strong>.
          <br>Te notificaremos cuando respondan.
        </p>
        <button class="btn btn-primary btn-full" onclick="document.getElementById('modal').classList.add('hidden')">
          Genial, gracias
        </button>
      </div>
    `);
  }

  /* ── Modal ────────────────────────────── */
  function showModal(html) {
    els.modalContent.innerHTML = html;
    els.modal.classList.remove('hidden');
  }

  /* ── Profile View ─────────────────────── */
  function renderProfile() {
    if (state.profile) {
      els.profile.name.textContent = state.profile.name || 'Mi perfil';
      els.profile.skills.innerHTML = '';
      state.profile.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        els.profile.skills.appendChild(tag);
      });
    }

    els.profile.savedJobs.innerHTML = '';
    if (state.savedJobs.length === 0) {
      els.profile.savedJobs.innerHTML = '<p style="color:var(--text-3); font-size:0.85rem">No has guardado empleos aún</p>';
    } else {
      state.savedJobs.forEach(id => {
        const job = state.jobs.find(j => j.id === id);
        if (!job) return;
        const item = document.createElement('div');
        item.className = 'saved-item';
        item.innerHTML = `
          <span>${job.companyEmoji}</span>
          <div style="flex:1; min-width:0">
            <div style="font-weight:600; font-size:0.9rem">${job.title}</div>
            <div style="color:var(--text-2); font-size:0.8rem">${job.company}</div>
          </div>
        `;
        item.addEventListener('click', () => showJobDetail(job));
        els.profile.savedJobs.appendChild(item);
      });
    }
  }

  /* ── Event Bindings ───────────────────── */
  function bindEvents() {
    // File upload
    els.upload.fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Drag & drop
    const dz = els.upload.dropZone;
    ['dragenter', 'dragover'].forEach(evt => {
      dz.addEventListener(evt, (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dz.addEventListener(evt, (e) => { e.preventDefault(); dz.classList.remove('dragover'); });
    });
    dz.addEventListener('drop', (e) => {
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Remove file
    els.upload.removeFile.addEventListener('click', () => {
      els.upload.fileInput.value = '';
      els.upload.fileInfo.classList.add('hidden');
      els.upload.cvPreview.classList.add('hidden');
      els.upload.btnSearch.classList.add('hidden');
      els.upload.dividerOr.classList.add('hidden');
      els.upload.btnManual.classList.add('hidden');
      els.upload.dropZone.style.display = '';
      state.profile = null;
    });

    // Search buttons
    els.upload.btnSearch.addEventListener('click', searchJobs);
    els.upload.btnManual.addEventListener('click', () => {
      els.upload.manualCard.classList.toggle('hidden');
    });
    els.upload.btnManualSearch.addEventListener('click', () => {
      const name = els.upload.manualName.value.trim();
      const skillsRaw = els.upload.manualSkills.value.trim();
      const level = els.upload.manualExp.value;
      const location = els.upload.manualLocation.value.trim() || 'Ciudad de México';

      if (!skillsRaw) {
        showToast('Ingresa al menos una habilidad');
        return;
      }

      const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
      state.profile = { name, skills, level, location };
      searchJobs();
    });

    // Filters
    els.results.filterChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      els.results.filterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      renderResults();
    });

    // Search input
    let searchTimeout;
    els.results.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderResults();
      }, 250);
    });

    // Back buttons
    els.results.btnBack.addEventListener('click', () => navigateTo('upload'));
    els.results.btnRetry.addEventListener('click', () => navigateTo('upload'));
    els.detail.btnBack.addEventListener('click', () => navigateTo('results'));

    // Detail actions
    els.detail.btnApply.addEventListener('click', applyToJob);
    els.detail.btnSave.addEventListener('click', toggleSave);

    // Profile
    $('#headerProfile').addEventListener('click', () => {
      renderProfile();
      navigateTo('profile');
    });
    els.profile.btnBack.addEventListener('click', () => navigateTo('results'));
    els.profile.btnReset.addEventListener('click', () => {
      showModal(`
        <div style="text-align:center">
          <div style="font-size:2rem; margin-bottom:12px">⚠️</div>
          <h3 style="margin-bottom:8px">¿Borrar todos los datos?</h3>
          <p style="color:var(--text-2); font-size:0.85rem; margin-bottom:20px">Esta acción no se puede deshacer.</p>
          <div style="display:flex; gap:10px">
            <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('modal').classList.add('hidden')">Cancelar</button>
            <button class="btn btn-primary danger" style="flex:1" id="confirmReset">Borrar</button>
          </div>
        </div>
      `);
      setTimeout(() => {
        const confirmBtn = document.getElementById('confirmReset');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            Store.clear();
            state = { profile: null, jobs: [], savedJobs: [], currentView: 'upload', currentJob: null, activeFilter: 'all', searchQuery: '' };
            els.modal.classList.add('hidden');
            navigateTo('upload');
            els.upload.fileInfo.classList.add('hidden');
            els.upload.cvPreview.classList.add('hidden');
            els.upload.btnSearch.classList.add('hidden');
            els.upload.dividerOr.classList.add('hidden');
            els.upload.btnManual.classList.add('hidden');
            els.upload.dropZone.style.display = '';
            els.upload.manualCard.classList.add('hidden');
            showToast('Datos borrados');
          });
        }
      }, 100);
    });

    // Modal close
    els.modal.querySelector('.modal-overlay').addEventListener('click', () => {
      els.modal.classList.add('hidden');
    });

    // PWA Install
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      els.installBanner.classList.remove('hidden');
    });

    els.installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') showToast('¡App instalada!');
      deferredPrompt = null;
      els.installBanner.classList.add('hidden');
    });

    els.installClose.addEventListener('click', () => {
      els.installBanner.classList.add('hidden');
    });

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  /* ── Init ─────────────────────────────── */
  function init() {
    const data = Store.get();
    state.savedJobs = data.savedJobs || [];

    bindEvents();

    // Splash sequence
    setTimeout(() => {
      els.splash.style.display = 'none';
      els.header.classList.remove('hidden');
      els.main.classList.remove('hidden');
    }, 3200);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
