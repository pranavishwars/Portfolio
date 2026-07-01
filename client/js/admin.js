let currentPortfolioData = {};

function loadDataAndInit() {
  console.log('[admin] loadDataAndInit called');
  currentPortfolioData = typeof getData === 'function' ? getData() : {};
  console.log('[admin] getData returned type:', typeof currentPortfolioData, 'keys:', Object.keys(currentPortfolioData));
  console.log('[admin] has services:', !!currentPortfolioData.services, 'has projects:', !!currentPortfolioData.projects, 'has skills:', !!currentPortfolioData.skills);
  console.log('[admin] has contact:', !!currentPortfolioData.contact, 'has personal:', !!currentPortfolioData.personal);

  initControlCoreNavigation();
  initIdentityFormHandler();
  initStatsFormHandler();
  initCommsFormHandler();
  initHobbyInput();
  renderAllControlCorePanels();
}

function initControlCoreNavigation() {
  document.querySelectorAll('.admin-sidebar a[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.admin-sidebar a').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.section-nav').forEach(s => s.classList.remove('active'));
      link.classList.add('active');
      const sectionNode = document.getElementById(`section-${link.getAttribute('data-section')}`);
      if (sectionNode) sectionNode.classList.add('active');
    });
  });
}

function initIdentityFormHandler() {
  const form = document.getElementById('identityForm');
  console.log('[admin] identityForm found:', !!form);
  if (!form) return;
  const p = currentPortfolioData.personal;
  console.log('[admin] personal data:', p ? JSON.stringify(p).slice(0,200) : 'undefined');
  if (!p) { console.warn('[admin] personal data missing'); return; }
  const f1 = document.getElementById('i-firstName');
  console.log('[admin] firstName field:', !!f1);
  document.getElementById('i-firstName').value = p.firstName || '';
  document.getElementById('i-lastName').value = p.lastName || '';
  document.getElementById('i-greeting').value = p.greeting || '';
  document.getElementById('i-subtitle').value = p.heroSubtitle || '';
  form.addEventListener('submit', e => {
    e.preventDefault();
    var p2 = currentPortfolioData.personal;
    p2.firstName = document.getElementById('i-firstName').value.trim();
    p2.lastName = document.getElementById('i-lastName').value.trim();
    p2.greeting = document.getElementById('i-greeting').value.trim();
    p2.heroSubtitle = document.getElementById('i-subtitle').value.trim();
    commitDataToSystemStorage();
  });
}

function initStatsFormHandler() {
  const form = document.getElementById('statsForm');
  if (!form) return;
  if (!currentPortfolioData.personal.stats) currentPortfolioData.personal.stats = [];
  while (currentPortfolioData.personal.stats.length < 3) currentPortfolioData.personal.stats.push({ number: '', label: '' });
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
    var c2 = currentPortfolioData.contact;
    c2.email = document.getElementById('c-email').value.trim();
    c2.location = document.getElementById('c-location').value.trim();
    c2.availability = document.getElementById('c-availability').value.trim();
    commitDataToSystemStorage();
  });
}

function initHobbyInput() {
  const input = document.getElementById('hobbyInput');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    if (!currentPortfolioData.personal.hobbies) currentPortfolioData.personal.hobbies = [];
    currentPortfolioData.personal.hobbies.push(val);
    input.value = '';
    saveAndRefreshSystemCore();
  });
}

function renderAllControlCorePanels() {
  renderServicesList();
  renderSpatialProjectsList();
  renderDisciplinesList();
  renderExperienceTimeline();
  renderEducationList();
  renderHobbiesList();
  renderInquiries();
}

function commitDataToSystemStorage() {
  if (typeof saveData !== 'function') return;
  var result = saveData(currentPortfolioData);
  if (result && typeof result.then === 'function') {
    result.then(function (ok) {
      alert(ok ? 'Data saved successfully.' : 'Error saving data. Server may be unavailable.');
    });
  }
}

function saveAndRefreshSystemCore() {
  if (typeof saveData === 'function') {
    saveData(currentPortfolioData);
    renderAllControlCorePanels();
    closeModal();
  }
}

// ---------- Services ----------
function renderServicesList() {
  const container = document.getElementById('services-target-container');
  if (!container) return;
  if (!currentPortfolioData.services || !currentPortfolioData.services.length) {
    container.innerHTML = '<div class="empty-state"><p>No services yet.</p></div>';
    return;
  }
  container.innerHTML = currentPortfolioData.services.map(s => `
    <div class="item-card">
      <div>
        <h4>${escapeHtml(s.name)} — $${escapeHtml(String(s.hourlyRate))}/hr</h4>
        <span class="sub">${escapeHtml(s.description)}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.2);" onclick="removeService(${s.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openServiceModal() {
  showModal(`
    <h3>Add Service</h3>
    <form id="modalServiceForm" style="margin-top:20px;display:grid;gap:16px;">
      <div class="form-group"><label>Name</label><input type="text" id="m-svName" required></div>
      <div class="form-group"><label>Description</label><textarea id="m-svDesc" rows="3" required></textarea></div>
      <div class="form-group"><label>Hourly Rate ($)</label><input type="number" id="m-svRate" min="0" step="1" required></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>`);
  document.getElementById('modalServiceForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!currentPortfolioData.services) currentPortfolioData.services = [];
    currentPortfolioData.services.push({
      id: Date.now(),
      name: document.getElementById('m-svName').value.trim(),
      description: document.getElementById('m-svDesc').value.trim(),
      hourlyRate: Number(document.getElementById('m-svRate').value) || 0
    });
    saveAndRefreshSystemCore();
  });
}

function removeService(id) {
  if (!confirm('Delete this service?')) return;
  currentPortfolioData.services = currentPortfolioData.services.filter(s => s.id !== id);
  saveAndRefreshSystemCore();
}

// ---------- Projects ----------
function renderSpatialProjectsList() {
  const container = document.getElementById('projects-target-container');
  if (!container) return;
  if (!currentPortfolioData.projects || !currentPortfolioData.projects.length) {
    container.innerHTML = '<div class="empty-state"><p>No projects yet.</p></div>';
    return;
  }
  container.innerHTML = currentPortfolioData.projects.map(proj => `
    <div class="item-card">
      <div>
        <h4>${escapeHtml(proj.title)} ${proj.featured ? '<i class="fa-solid fa-star"></i>' : ''}</h4>
        <span class="sub">${escapeHtml((proj.tags || []).join(', '))} — ${escapeHtml(proj.year || '')}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="openProjectAllocationModal(${proj.id})">Edit</button>
        <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.2);" onclick="removeSpatialProjectMesh(${proj.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openProjectAllocationModal(editId) {
  const existing = editId ? currentPortfolioData.projects.find(p => p.id === editId) : null;
  const p = existing || { title: '', subtitle: '', description: '', tags: [], year: '2026', stack: '', type: 'FULL STACK', featured: false, image: '', liveUrl: '', sourceUrl: '' };
  showModal(`
    <h3>${existing ? 'Edit' : 'Add'} Project</h3>
    <form id="modalProjectForm" style="margin-top:20px;display:grid;gap:16px;max-height:65vh;overflow-y:auto;padding-right:4px;">
      <div class="form-group"><label>Title</label><input type="text" id="m-pTitle" value="${escapeHtml(p.title)}" required></div>
      <div class="form-group"><label>Subtitle</label><input type="text" id="m-pSubtitle" value="${escapeHtml(p.subtitle || '')}"></div>
      <div class="form-group"><label>Description</label><textarea id="m-pDesc" rows="3" required>${escapeHtml(p.description)}</textarea></div>
      <div class="form-group"><label>Image path (in /assets)</label><input type="text" id="m-pImage" placeholder="assets/project_1.jpg" value="${escapeHtml(p.image || '')}"></div>
      <div class="form-group"><label>Tags (comma-separated)</label><input type="text" id="m-pTags" placeholder="Three.js, WebGL" value="${escapeHtml((p.tags||[]).join(', '))}" required></div>
      <div class="form-group"><label>Year</label><input type="text" id="m-pYear" value="${escapeHtml(p.year || '')}"></div>
      <div class="form-group"><label>Stack label</label><input type="text" id="m-pStack" placeholder="REACT" value="${escapeHtml(p.stack || '')}"></div>
      <div class="form-group"><label>Type badge</label><input type="text" id="m-pType" placeholder="FULL STACK" value="${escapeHtml(p.type || '')}"></div>
      <div class="form-group"><label>Live URL</label><input type="text" id="m-pLive" value="${escapeHtml(p.liveUrl || '')}"></div>
      <div class="form-group"><label>Source URL</label><input type="text" id="m-pSource" value="${escapeHtml(p.sourceUrl || '')}"></div>
      <div class="form-group" style="flex-direction:row;align-items:center;gap:10px;"><input type="checkbox" id="m-pFeatured" ${p.featured ? 'checked' : ''} style="width:auto;"><label style="margin:0;">Featured</label></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>`);
  document.getElementById('modalProjectForm').addEventListener('submit', e => {
    e.preventDefault();
    const tagsArray = document.getElementById('m-pTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      title: document.getElementById('m-pTitle').value.trim(),
      subtitle: document.getElementById('m-pSubtitle').value.trim(),
      description: document.getElementById('m-pDesc').value.trim(),
      image: document.getElementById('m-pImage').value.trim(),
      tags: tagsArray,
      category: 'webgl',
      year: document.getElementById('m-pYear').value.trim(),
      stack: document.getElementById('m-pStack').value.trim(),
      type: document.getElementById('m-pType').value.trim(),
      liveUrl: document.getElementById('m-pLive').value.trim() || '#',
      sourceUrl: document.getElementById('m-pSource').value.trim() || '#',
      featured: document.getElementById('m-pFeatured').checked
    };
    if (!currentPortfolioData.projects) currentPortfolioData.projects = [];
    if (existing) {
      Object.assign(existing, data);
    } else {
      currentPortfolioData.projects.push({ id: Date.now(), ...data });
    }
    saveAndRefreshSystemCore();
  });
}

function removeSpatialProjectMesh(id) {
  if (!confirm('Delete this project?')) return;
  currentPortfolioData.projects = currentPortfolioData.projects.filter(p => p.id !== id);
  saveAndRefreshSystemCore();
}

// ---------- Skills (star rating) ----------
function renderDisciplinesList() {
  const container = document.getElementById('disciplines-target-container');
  if (!container) return;
  const cats = (currentPortfolioData.skills && currentPortfolioData.skills.categories) || [];
  if (!cats.length) {
    container.innerHTML = '<div class="empty-state"><p>No skill categories defined.</p></div>';
    return;
  }
  container.innerHTML = cats.map((cat, ci) => `
    <div class="item-card" style="flex-direction:column;align-items:flex-start;gap:12px;">
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
        <h4 style="color:var(--gold);">${cat.icon} ${escapeHtml(cat.name)}</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openSkillModal(${ci})"><i class="fa-solid fa-plus"></i> Add Skill</button>
      </div>
      <div style="width:100%;display:grid;gap:10px;">
        ${(cat.items || []).map((s, si) => `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:var(--text-muted);">
            <span style="flex:1;">${escapeHtml(s.name)}</span>
            <span class="star-input" data-cat="${ci}" data-skill="${si}">
              ${[1,2,3,4,5].map(n => `<span class="${n <= (s.stars||1) ? 'on' : ''}" data-n="${n}"><i class="fa-solid fa-star"></i></span>`).join('')}
            </span>
            <button type="button" onclick="removeSkill(${ci},${si})" style="background:none;border:none;color:#ef4444;cursor:pointer;margin-left:10px;"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.star-input span').forEach(starEl => {
    starEl.addEventListener('click', () => {
      const wrap = starEl.parentElement;
      const ci = Number(wrap.dataset.cat), si = Number(wrap.dataset.skill), n = Number(starEl.dataset.n);
      currentPortfolioData.skills.categories[ci].items[si].stars = n;
      saveAndRefreshSystemCore();
    });
  });
}

function openCategoryModal() {
  showModal(`
    <h3>Add Skill Category</h3>
    <form id="modalCatForm" style="margin-top:20px;display:grid;gap:16px;">
      <div class="form-group"><label>Icon (FA class)</label><input type="text" id="m-catIcon" placeholder="fa-solid fa-gear" required></div>
      <div class="form-group"><label>Category Name</label><input type="text" id="m-catName" required></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>`);
  document.getElementById('modalCatForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!currentPortfolioData.skills) currentPortfolioData.skills = { categories: [] };
    currentPortfolioData.skills.categories.push({
      icon: document.getElementById('m-catIcon').value.trim(),
      name: document.getElementById('m-catName').value.trim(),
      items: []
    });
    saveAndRefreshSystemCore();
  });
}

function openSkillModal(catIndex) {
  showModal(`
    <h3>Add Skill</h3>
    <form id="modalSkillForm" style="margin-top:20px;display:grid;gap:16px;">
      <div class="form-group"><label>Skill Name</label><input type="text" id="m-skName" required></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>`);
  document.getElementById('modalSkillForm').addEventListener('submit', e => {
    e.preventDefault();
    currentPortfolioData.skills.categories[catIndex].items.push({
      name: document.getElementById('m-skName').value.trim(),
      stars: 3
    });
    saveAndRefreshSystemCore();
  });
}

function removeSkill(ci, si) {
  currentPortfolioData.skills.categories[ci].items.splice(si, 1);
  saveAndRefreshSystemCore();
}

// ---------- Experience ----------
function renderExperienceTimeline() {
  const container = document.getElementById('experience-target-container');
  if (!container) return;
  if (!currentPortfolioData.experience || !currentPortfolioData.experience.length) {
    container.innerHTML = '<div class="empty-state"><p>No experience entries yet.</p></div>';
    return;
  }
  container.innerHTML = currentPortfolioData.experience.map(exp => `
    <div class="item-card">
      <div>
        <h4>${escapeHtml(exp.title)}</h4>
        <span class="sub" style="color:var(--gold);">${escapeHtml(exp.company)} — ${escapeHtml(exp.date)}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.2);" onclick="removeExperienceEntry(${exp.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openExperienceModal() {
  showModal(`
    <h3>Add Experience Entry</h3>
    <form id="modalExpForm" style="margin-top:20px;display:grid;gap:16px;">
      <div class="form-group"><label>Job Title</label><input type="text" id="m-cTitle" required></div>
      <div class="form-group"><label>Company</label><input type="text" id="m-cCompany" required></div>
      <div class="form-group"><label>Date</label><input type="text" id="m-cDate" placeholder="2026 — Present" required></div>
      <div class="form-group"><label>Description</label><textarea id="m-cDesc" rows="3" required></textarea></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>`);
  document.getElementById('modalExpForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!currentPortfolioData.experience) currentPortfolioData.experience = [];
    currentPortfolioData.experience.push({
      id: Date.now(),
      title: document.getElementById('m-cTitle').value.trim(),
      company: document.getElementById('m-cCompany').value.trim(),
      date: document.getElementById('m-cDate').value.trim(),
      description: document.getElementById('m-cDesc').value.trim()
    });
    saveAndRefreshSystemCore();
  });
}

function removeExperienceEntry(id) {
  if (!confirm('Delete this experience entry?')) return;
  currentPortfolioData.experience = currentPortfolioData.experience.filter(e => e.id !== id);
  saveAndRefreshSystemCore();
}

// ---------- Education ----------
function renderEducationList() {
  const container = document.getElementById('education-target-container');
  if (!container) return;
  const edu = currentPortfolioData.personal.education || [];
  if (!edu.length) {
    container.innerHTML = '<div class="empty-state"><p>No education entries yet.</p></div>';
    return;
  }
  container.innerHTML = edu.map((e, i) => `
    <div class="item-card">
      <div>
        <h4>${escapeHtml(e.degree)}</h4>
        <span class="sub">${escapeHtml(e.school)} — ${escapeHtml(e.date)}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.2);" onclick="removeEducation(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openEducationModal() {
  showModal(`
    <h3>Add Education</h3>
    <form id="modalEduForm" style="margin-top:20px;display:grid;gap:16px;">
      <div class="form-group"><label>Degree</label><input type="text" id="m-eduDegree" required></div>
      <div class="form-group"><label>School</label><input type="text" id="m-eduSchool" required></div>
      <div class="form-group"><label>Date</label><input type="text" id="m-eduDate" placeholder="2021 — 2025" required></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>`);
  document.getElementById('modalEduForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!currentPortfolioData.personal.education) currentPortfolioData.personal.education = [];
    currentPortfolioData.personal.education.push({
      degree: document.getElementById('m-eduDegree').value.trim(),
      school: document.getElementById('m-eduSchool').value.trim(),
      date: document.getElementById('m-eduDate').value.trim()
    });
    saveAndRefreshSystemCore();
  });
}

function removeEducation(i) {
  currentPortfolioData.personal.education.splice(i, 1);
  saveAndRefreshSystemCore();
}

// ---------- Hobbies ----------
function renderHobbiesList() {
  const container = document.getElementById('hobbies-target-container');
  if (!container) return;
  const hobbies = currentPortfolioData.personal.hobbies || [];
  container.innerHTML = hobbies.map((h, i) =>
    `<span class="pill">${escapeHtml(h)}<button type="button" onclick="removeHobby(${i})"><i class="fa-solid fa-xmark"></i></button></span>`
  ).join('') || '<p style="color:var(--text-dim);font-size:0.85rem;">No hobbies yet.</p>';
}

function removeHobby(i) {
  currentPortfolioData.personal.hobbies.splice(i, 1);
  saveAndRefreshSystemCore();
}

// ---------- Data import/export ----------
function exportPortfolioData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentPortfolioData, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', 'portfolio_data.json');
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importPortfolioData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (typeof saveData === 'function') {
        currentPortfolioData = imported;
        var result = saveData(imported);
        renderAllControlCorePanels();
        if (result && typeof result.then === 'function') {
          result.then(function (ok) {
            alert(ok ? 'Data imported and saved.' : 'Imported locally. Server save failed.');
          });
        } else {
          alert('Data imported successfully.');
        }
      }
    } catch (err) {
      alert('Error parsing JSON file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ---------- Inquiries (Hire page submissions) ----------
function renderInquiries() {
  var container = document.getElementById('inquiries-target-container');
  if (!container) return;
  container.innerHTML = '<div class="empty-state">Loading inquiries...</div>';
  var token = typeof getAdminToken === 'function' ? getAdminToken() : null;
  if (!token) { container.innerHTML = '<div class="empty-state">Not authenticated.</div>'; return; }
  fetch(API_BASE + '/hire', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(function(r) { return r.json(); })
  .then(function(json) {
    if (!json.success || !json.data || !json.data.length) {
      container.innerHTML = '<div class="empty-state">No inquiries yet.</div>';
      return;
    }
    container.innerHTML = json.data.map(function(inq) {
      var date = new Date(inq.createdAt);
      var dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      return '<div class="inquiry-card' + (inq.read ? '' : ' unread') + '">' +
        '<div class="inq-header">' +
          '<span class="inq-name">' + escapeHtml(inq.name) + '</span>' +
          (!inq.read ? '<span class="inq-badge">New</span>' : '') +
        '</div>' +
        '<div class="inq-meta">' +
          '<a href="mailto:' + escapeHtml(inq.email) + '" style="color:#4488ff;text-decoration:none;">' + escapeHtml(inq.email) + '</a>' +
          (inq.phone ? '<span>' + escapeHtml(inq.phone) + '</span>' : '') +
          (inq.service ? '<span>Service: ' + escapeHtml(inq.service) + '</span>' : '') +
          '<span>' + dateStr + '</span>' +
        '</div>' +
        '<div class="inq-desc">' + escapeHtml(inq.description) + '</div>' +
        (!inq.read ? '<div class="inq-actions"><button class="btn btn-sm btn-secondary" onclick="markInquiryRead(\'' + inq._id + '\')">Mark Read</button></div>' : '') +
      '</div>';
    }).join('');
  })
  .catch(function() {
    container.innerHTML = '<div class="empty-state">Failed to load inquiries.</div>';
  });
}

function markInquiryRead(id) {
  var token = typeof getAdminToken === 'function' ? getAdminToken() : null;
  if (!token) return;
  fetch(API_BASE + '/hire/' + id + '/read', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function() { renderInquiries(); }).catch(function() {});
}

// ---------- Modal helpers ----------
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
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

loadDataAndInit();

window.addEventListener('portfolio-data-ready', function (e) {
  if (!e.detail) return;
  currentPortfolioData = e.detail;
  renderAllControlCorePanels();
});
