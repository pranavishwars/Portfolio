let currentPortfolioData = typeof getData === 'function' ? getData() : {};

// NOTE: this script is loaded dynamically (injected via createElement('script'))
// AFTER the password gate unlocks, which is always well after DOMContentLoaded
// has already fired once for the page. Listening for DOMContentLoaded here would
// never run, since that event doesn't fire again — so initialize directly.
initControlCoreNavigation();
initIdentityFormHandler();
initStatsFormHandler();
initCommsFormHandler();
renderAllControlCorePanels();

function initControlCoreNavigation() {
  document.querySelectorAll('.admin-sidebar a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      
      document.querySelectorAll('.admin-sidebar a').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.section-nav').forEach(s => s.classList.remove('active'));
      
      link.classList.add('active');
      const targetedSection = link.getAttribute('data-section');
      const sectionNode = document.getElementById(`section-${targetedSection}`);
      if (sectionNode) sectionNode.classList.add('active');
    });
  });
}

function initIdentityFormHandler() {
  const form = document.getElementById('identityForm');
  if (!form) return;

  const p = currentPortfolioData.personal;
  document.getElementById('i-firstName').value = p.firstName || '';
  document.getElementById('i-lastName').value = p.lastName || '';
  document.getElementById('i-greeting').value = p.greeting || '';
  document.getElementById('i-subtitle').value = p.heroSubtitle || '';

  form.addEventListener('submit', e => {
    e.preventDefault();
    
    currentPortfolioData.personal.firstName = document.getElementById('i-firstName').value.trim();
    currentPortfolioData.personal.lastName = document.getElementById('i-lastName').value.trim();
    currentPortfolioData.personal.greeting = document.getElementById('i-greeting').value.trim();
    currentPortfolioData.personal.heroSubtitle = document.getElementById('i-subtitle').value.trim();

    commitDataToSystemStorage();
  });
}

function initStatsFormHandler() {
  const form = document.getElementById('statsForm');
  if (!form) return;

  if (!currentPortfolioData.personal.stats) currentPortfolioData.personal.stats = [];
  while (currentPortfolioData.personal.stats.length < 3) {
    currentPortfolioData.personal.stats.push({ number: '', label: '' });
  }
  const stats = currentPortfolioData.personal.stats;
  for (let i = 0; i < 3; i++) {
    document.getElementById(`st-${i}-num`).value = stats[i].number || '';
    document.getElementById(`st-${i}-lbl`).value = stats[i].label || '';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    for (let i = 0; i < 3; i++) {
      currentPortfolioData.personal.stats[i] = {
        number: document.getElementById(`st-${i}-num`).value.trim(),
        label: document.getElementById(`st-${i}-lbl`).value.trim()
      };
    }
    commitDataToSystemStorage();
  });
}

function initCommsFormHandler() {
  const form = document.getElementById('commsForm');
  if (!form) return;

  const c = currentPortfolioData.contact;
  document.getElementById('c-email').value = c.email || '';
  document.getElementById('c-location').value = c.location || '';
  document.getElementById('c-availability').value = c.availability || '';

  form.addEventListener('submit', e => {
    e.preventDefault();
    
    currentPortfolioData.contact.email = document.getElementById('c-email').value.trim();
    currentPortfolioData.contact.location = document.getElementById('c-location').value.trim();
    currentPortfolioData.contact.availability = document.getElementById('c-availability').value.trim();

    commitDataToSystemStorage();
  });
}

function renderAllControlCorePanels() {
  renderSpatialProjectsList();
  renderDisciplinesList();
  renderExperienceTimeline();
}

function commitDataToSystemStorage() {
  if (typeof saveData === 'function') {
    const success = saveData(currentPortfolioData);
    if (success) {
      alert('Data saved successfully.');
    } else {
      alert('Error saving data.');
    }
  }
}

function renderSpatialProjectsList() {
  const container = document.getElementById('projects-target-container');
  if (!container) return;

  if (!currentPortfolioData.projects || currentPortfolioData.projects.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No projects yet.</p></div>';
    return;
  }

  container.innerHTML = currentPortfolioData.projects.map(proj => `
    <div class="item-card">
      <div>
        <h4>${escapeHtml(proj.title)}</h4>
        <span class="sub" style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(proj.tags.join(', '))}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444; border-color:rgba(239,68,68,0.2);" onclick="removeSpatialProjectMesh(${proj.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderDisciplinesList() {
  const container = document.getElementById('disciplines-target-container');
  if (!container) return;

  if (!currentPortfolioData.skills || !currentPortfolioData.skills.categories || currentPortfolioData.skills.categories.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No skill categories defined.</p></div>';
    return;
  }

  container.innerHTML = currentPortfolioData.skills.categories.map(cat => `
    <div class="item-card" style="flex-direction:column; align-items:flex-start; gap:12px;">
      <h4 style="color:var(--gold);">${escapeHtml(cat.icon)} ${escapeHtml(cat.name)}</h4>
      <div style="width:100%; display:grid; gap:8px;">
        ${cat.items.map(s => `
          <div style="display:flex; justify-content:between; font-size:0.8rem; color:var(--text-muted);">
            <span style="flex:1;">${escapeHtml(s.name)}</span>
            <span>${s.level}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderExperienceTimeline() {
  const container = document.getElementById('experience-target-container');
  if (!container) return;

  if (!currentPortfolioData.experience || currentPortfolioData.experience.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No experience entries yet.</p></div>';
    return;
  }

  container.innerHTML = currentPortfolioData.experience.map(exp => `
    <div class="item-card">
      <div>
        <h4>${escapeHtml(exp.title)}</h4>
        <span class="sub" style="font-size:0.75rem; color:var(--gold);">${escapeHtml(exp.company)} — ${escapeHtml(exp.date)}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444; border-color:rgba(239,68,68,0.2);" onclick="removeExperienceEntry(${exp.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openProjectAllocationModal() {
  showModal(`
    <h3>Add New Project</h3>
    <form id="modalProjectForm" style="margin-top:20px; display:grid; gap:16px;">
      <div class="form-group"><label>Title</label><input type="text" id="m-pTitle" required></div>
      <div class="form-group"><label>Description</label><textarea id="m-pDesc" rows="3" required></textarea></div>
      <div class="form-group"><label>Tags (comma-separated)</label><input type="text" id="m-pTags" placeholder="Three.js, WebGL" required></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>
  `);

  document.getElementById('modalProjectForm').addEventListener('submit', e => {
    e.preventDefault();
    const tagsArray = document.getElementById('m-pTags').value.split(',').map(t => t.trim()).filter(t => t);
    
    const newProj = {
      id: Date.now(),
      title: document.getElementById('m-pTitle').value.trim(),
      description: document.getElementById('m-pDesc').value.trim(),
      category: 'webgl',
      tags: tagsArray,
      liveUrl: '#',
      sourceUrl: '#'
    };

    if (!currentPortfolioData.projects) currentPortfolioData.projects = [];
    currentPortfolioData.projects.push(newProj);
    
    saveAndRefreshSystemCore();
  });
}

function openExperienceModal() {
  showModal(`
    <h3>Add Experience Entry</h3>
    <form id="modalExpForm" style="margin-top:20px; display:grid; gap:16px;">
      <div class="form-group"><label>Job Title</label><input type="text" id="m-cTitle" required></div>
      <div class="form-group"><label>Company</label><input type="text" id="m-cCompany" required></div>
      <div class="form-group"><label>Date</label><input type="text" id="m-cDate" placeholder="2026 — Present" required></div>
      <div class="form-group"><label>Description</label><textarea id="m-cDesc" rows="3" required></textarea></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>
  `);

  document.getElementById('modalExpForm').addEventListener('submit', e => {
    e.preventDefault();
    
    const newExp = {
      id: Date.now(),
      title: document.getElementById('m-cTitle').value.trim(),
      company: document.getElementById('m-cCompany').value.trim(),
      date: document.getElementById('m-cDate').value.trim(),
      description: document.getElementById('m-cDesc').value.trim()
    };

    if (!currentPortfolioData.experience) currentPortfolioData.experience = [];
    currentPortfolioData.experience.push(newExp);
    
    saveAndRefreshSystemCore();
  });
}

function removeSpatialProjectMesh(id) {
  if (confirm('Delete this project?')) {
    currentPortfolioData.projects = currentPortfolioData.projects.filter(p => p.id !== id);
    saveAndRefreshSystemCore();
  }
}

function removeExperienceEntry(id) {
  if (confirm('Delete this experience entry?')) {
    currentPortfolioData.experience = currentPortfolioData.experience.filter(e => e.id !== id);
    saveAndRefreshSystemCore();
  }
}

function saveAndRefreshSystemCore() {
  if (typeof saveData === 'function') {
    saveData(currentPortfolioData);
    renderAllControlCorePanels();
    closeModal();
  }
}

function exportPortfolioData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentPortfolioData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "portfolio_data.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importPortfolioData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (typeof saveData === 'function') {
        saveData(importedData);
        currentPortfolioData = typeof getData === 'function' ? getData() : importedData;
        renderAllControlCorePanels();
        alert('Data imported successfully.');
      }
    } catch (err) {
      alert('Error parsing JSON file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function showModal(html) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  if (overlay && content) {
    content.innerHTML = html;
    overlay.classList.add('open');
  }
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
