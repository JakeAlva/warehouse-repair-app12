
/* Rack Repair Survey v2 - tabs fixed, no images, 0–6 strut options */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const LS_KEYS = {
  PROFILE: 'rrs_profile',
  SESSION: 'rrs_session',
  SURVEY:  'rrs_survey',
};

const emptySurvey = () => ({
  start: { facility_name:'', facility_address:'', surveyor_name:'', survey_date:'', survey_notes:'' },
  frames: [],
  locations: [],
  beams: {Q:'',R:'',S:'',T:''}
});

let survey = loadSurvey();
let session = loadSession();

function loadSurvey(){
  try{ return JSON.parse(localStorage.getItem(LS_KEYS.SURVEY)) || emptySurvey(); }
  catch{ return emptySurvey(); }
}
function saveSurvey(){
  localStorage.setItem(LS_KEYS.SURVEY, JSON.stringify(survey));
}
function loadSession(){
  try{ return JSON.parse(localStorage.getItem(LS_KEYS.SESSION)) || null; }
  catch{ return null; }
}
function saveSession(s){ localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(s)); }

/* -------- AUTH -------- */
const authScreen = $('#authScreen');
const appScreen = $('#appScreen');
const showSignIn = $('#showSignIn');
const showSignUp = $('#showSignUp');
const signInForm = $('#signInForm');
const signUpForm = $('#signUpForm');
const rememberMe = $('#rememberMe');
const signOutBtn = $('#signOutBtn');
const currentUser = $('#currentUser');

function updateAuthUI(){
  if(session){
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUser.textContent = session.firstName ? `${session.firstName} ${session.lastName}` : session.email;
  }else{
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    currentUser.textContent = '';
  }
}
updateAuthUI();

showSignIn.addEventListener('click', () => {
  showSignIn.classList.add('active'); showSignUp.classList.remove('active');
  signInForm.classList.remove('hidden'); signUpForm.classList.add('hidden');
});
showSignUp.addEventListener('click', () => {
  showSignUp.classList.add('active'); showSignIn.classList.remove('active');
  signUpForm.classList.remove('hidden'); signInForm.classList.add('hidden');
});

// Profiles keyed by email
function getProfiles(){
  try{ return JSON.parse(localStorage.getItem(LS_KEYS.PROFILE)) || {}; }
  catch{ return {}; }
}
function setProfiles(map){ localStorage.setItem(LS_KEYS.PROFILE, JSON.stringify(map)); }

signUpForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const first = $('#su_first').value.trim();
  const last  = $('#su_last').value.trim();
  const email = $('#su_email').value.trim().toLowerCase();
  const phone = $('#su_phone').value.trim();
  const pass  = $('#su_password').value;
  const comp  = $('#su_company').value.trim();
  if(!first || !last || !email || !pass) return alert('Please fill required fields.');
  const profiles = getProfiles();
  if(profiles[email]) return alert('An account with that email already exists.');
  profiles[email] = { first, last, email, phone, pass, comp };
  setProfiles(profiles);
  alert('Account created! You can now sign in.');
  showSignIn.click();
});
signInForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = $('#si_email').value.trim().toLowerCase();
  const pass  = $('#si_password').value;
  const profiles = getProfiles();
  const p = profiles[email];
  if(!p || p.pass !== pass) return alert('Invalid email or password.');
  session = { email, firstName:p.first, lastName:p.last };
  saveSession(session);
  if(!rememberMe.checked){
    window.addEventListener('beforeunload', ()=> localStorage.removeItem(LS_KEYS.SESSION));
  }
  updateAuthUI();
});
signOutBtn.addEventListener('click', ()=>{
  localStorage.removeItem(LS_KEYS.SESSION);
  session = null;
  updateAuthUI();
});

/* -------- TABS -------- */
$$('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    $$('.tab').forEach(t=>t.classList.remove('active'));
    $('#'+id).classList.add('active');
  });
});

/* -------- START TAB BINDINGS -------- */
const startFields = ['facility_name','facility_address','surveyor_name','survey_date','survey_notes'];
startFields.forEach(id=>{
  const el = $('#'+id);
  el.value = survey.start[id] || '';
  el.addEventListener('input', ()=>{ survey.start[id] = el.value; saveSurvey(); });
});

/* -------- FRAMES TAB -------- */
function renderFrameList(){
  const list = $('#frameList'); list.innerHTML = '';
  if(!survey.frames.length){ list.innerHTML = '<div class="muted">No frame types added yet.</div>'; return; }
  survey.frames.forEach((f, idx)=>{
    const div = document.createElement('div'); div.className='item';
    const name = document.createElement('div'); name.className='grow'; name.textContent = f.name || `Frame #${idx+1}`;
    const meta = document.createElement('div'); meta.className='pill'; meta.textContent = `${f.depth}" A • ${f.postWidth}" B • ${f.style ? 'Style '+f.style : ''} • Punch ${f.punch || '?'}`;
    const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Edit';
    const del  = document.createElement('button'); del.className='btn small'; del.textContent='Delete';
    edit.addEventListener('click', ()=>{
      $('#f_depth').value = f.depth; $('#f_post_width').value = f.postWidth;
      $('#f_backer').value = f.backer; $('#f_style').value = f.style; $('#f_color').value = f.color; $('#f_punch').value = f.punch; $('#f_name').value = f.name;
      survey.frames.splice(idx,1); saveSurvey(); renderFrameList(); populateFrameDropdown();
    });
    del.addEventListener('click', ()=>{ if(confirm('Delete this frame type?')){ survey.frames.splice(idx,1); saveSurvey(); renderFrameList(); populateFrameDropdown(); } });
    div.append(name, meta, edit, del); list.appendChild(div);
  });
}
function populateFrameDropdown(){
  const dd = $('#loc_frame'); dd.innerHTML='';
  if(!survey.frames.length){ const o = document.createElement('option'); o.text='No frames yet'; dd.appendChild(o); return; }
  survey.frames.forEach((f,i)=>{ const o = document.createElement('option'); o.value = i; o.text = f.name || `Frame #${i+1}`; dd.appendChild(o); });
}
renderFrameList(); populateFrameDropdown();

$('#addFrameBtn').addEventListener('click', ()=>{
  const f = {
    depth: parseFloat($('#f_depth').value || '0'),
    postWidth: parseFloat($('#f_post_width').value || '0'),
    backer: $('#f_backer').value || '',
    style: $('#f_style').value || '',
    color: $('#f_color').value.trim(),
    punch: $('#f_punch').value || '',
    name: $('#f_name').value.trim() || undefined
  };
  if(!f.depth || !f.postWidth || !f.backer || !f.style || !f.punch){ return alert('Please complete all required frame fields.'); }
  survey.frames.push(f); saveSurvey();
  renderFrameList(); populateFrameDropdown();
  $('#frameForm').reset();
});

/* -------- LOCATIONS TAB -------- */
(function buildHeightDropdown(){
  const dd = $('#loc_height'); dd.innerHTML='';
  for(let inches=24; inches<=192; inches++){
    const feet = Math.floor(inches/12), inch= inches%12;
    const label = `${feet}' ${inch}" (${inches}")`;
    const opt = document.createElement('option'); opt.value = inches; opt.text = label;
    dd.appendChild(opt);
  }
})();
// Persist beam levels
['Q','R','S','T'].forEach(k=>{
  const el = $('#beam_'+k);
  el.value = survey.beams[k] || '';
  el.addEventListener('input', ()=>{ survey.beams[k] = el.value; saveSurvey(); });
});

function renderLocList(){
  const list = $('#locList'); list.innerHTML='';
  if(!survey.locations.length){ list.innerHTML = '<div class="muted">No damage locations logged yet.</div>'; return; }
  survey.locations.forEach((loc, idx)=>{
    const div = document.createElement('div'); div.className='item';
    const frameName = survey.frames[loc.frameIndex]?.name || `Frame #${loc.frameIndex+1}`;
    const grow = document.createElement('div'); grow.className='grow';
    grow.innerHTML = `<strong>${frameName}</strong> — ${loc.where} — ${loc.type} — ${loc.height}" — H:${loc.hstruts} D:${loc.dstruts}`;
    const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Edit';
    const del  = document.createElement('button'); del.className='btn small'; del.textContent='Delete';
    edit.addEventListener('click', ()=>{
      $('#loc_frame').value = loc.frameIndex;
      $('#loc_where').value = loc.where;
      $('#loc_type').value = loc.type;
      $('#loc_height').value = String(loc.height);
      $('#loc_hstruts').value = String(loc.hstruts);
      $('#loc_dstruts').value = String(loc.dstruts);
      survey.locations.splice(idx,1); saveSurvey(); renderLocList();
    });
    del.addEventListener('click', ()=>{ if(confirm('Delete this entry?')){ survey.locations.splice(idx,1); saveSurvey(); renderLocList(); } });
    div.append(grow, edit, del);
    list.appendChild(div);
  });
}
renderLocList();

$('#addLocationBtn').addEventListener('click', ()=>{
  if(!survey.frames.length) return alert('Please add at least one frame type first.');
  const entry = {
    frameIndex: parseInt($('#loc_frame').value || '0', 10) || 0,
    where: $('#loc_where').value.trim(),
    type: $('#loc_type').value,
    height: parseInt($('#loc_height').value,10),
    hstruts: parseInt($('#loc_hstruts').value,10),
    dstruts: parseInt($('#loc_dstruts').value,10),
    beams: {...survey.beams}
  };
  if(!entry.where) return alert('Enter a location of damage.');
  survey.locations.push(entry); saveSurvey();
  renderLocList();
  $('#locForm').reset();
});

/* -------- DONE TAB: EXPORT -------- */
function exportToExcelHTML(){
  const esc = (s) => (s==null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
  const start = survey.start, frames = survey.frames, locs = survey.locations;

  let html = `
  <html>
  <head><meta charset="UTF-8"></head>
  <body>
  <h2>Rack Repair Survey — Summary</h2>
  <h3>Start</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <tr><th>Facility name</th><td>${esc(start.facility_name)}</td></tr>
    <tr><th>Facility address</th><td>${esc(start.facility_address)}</td></tr>
    <tr><th>Surveyor name</th><td>${esc(start.surveyor_name)}</td></tr>
    <tr><th>Date</th><td>${esc(start.survey_date)}</td></tr>
    <tr><th>Notes</th><td>${esc(start.survey_notes)}</td></tr>
    <tr><th>Beam Q</th><td>${esc(survey.beams.Q)}</td></tr>
    <tr><th>Beam R</th><td>${esc(survey.beams.R)}</td></tr>
    <tr><th>Beam S</th><td>${esc(survey.beams.S)}</td></tr>
    <tr><th>Beam T</th><td>${esc(survey.beams.T)}</td></tr>
  </table>

  <h3>Frame Types</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <tr>
      <th>#</th><th>Name</th><th>Depth A (in)</th><th>Post Width B (in)</th>
      <th>Backer C-1/D-1</th><th>Frame Style #</th><th>Color</th><th>Hole Punch #</th>
    </tr>`;
  frames.forEach((f,i)=>{
    html += `<tr>
      <td>${i+1}</td>
      <td>${esc(f.name||'')}</td>
      <td>${esc(f.depth)}</td>
      <td>${esc(f.postWidth)}</td>
      <td>${esc(f.backer)}</td>
      <td>${esc(f.style)}</td>
      <td>${esc(f.color)}</td>
      <td>${esc(f.punch)}</td>
    </tr>`;
  });
  html += `</table>

  <h3>Damage Locations</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <tr>
      <th>#</th><th>Frame Type</th><th>Location of damage</th><th>Type of repair</th>
      <th>Height (in)</th><th>H Struts</th><th>D Struts</th>
      <th>Q</th><th>R</th><th>S</th><th>T</th>
    </tr>`;
  locs.forEach((L,i)=>{
    const fname = frames[L.frameIndex]?.name || `Frame #${L.frameIndex+1}`;
    html += `<tr>
      <td>${i+1}</td><td>${esc(fname)}</td><td>${esc(L.where)}</td><td>${esc(L.type)}</td>
      <td>${esc(L.height)}</td><td>${esc(L.hstruts)}</td><td>${esc(L.dstruts)}</td>
      <td>${esc(L.beams.Q)}</td><td>${esc(L.beams.R)}</td><td>${esc(L.beams.S)}</td><td>${esc(L.beams.T)}</td>
    </tr>`;
  });
  html += `</table>
  </body></html>`;

  const blob = new Blob([html], {type: 'application/vnd.ms-excel'});
  const link = document.createElement('a');
  const dt = new Date();
  const fname = `RackRepairSurvey_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}.xls`;
  link.href = URL.createObjectURL(blob);
  link.download = fname;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

$('#exportExcelBtn').addEventListener('click', exportToExcelHTML);
$('#exportJsonBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(survey, null, 2)], {type:'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'rack_repair_survey.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
});

$('#newSurveyBtn').addEventListener('click', ()=>{
  if(confirm('Start a new survey? This will clear all current survey data.')){
    survey = emptySurvey(); saveSurvey();
    // Reset UI
    ['facility_name','facility_address','surveyor_name','survey_date','survey_notes'].forEach(id=> $('#'+id).value = '');
    renderFrameList(); populateFrameDropdown(); renderLocList();
    ['Q','R','S','T'].forEach(k=> $('#beam_'+k).value = '');
    alert('New survey started.');
  }
});

/* Footer year */
$('#year').textContent = new Date().getFullYear();

/* hydrate */
(function hydrate(){
  renderFrameList(); populateFrameDropdown(); renderLocList();
})();
