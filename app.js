// ── Screen Navigation ──
function showForm(type) {
  document.getElementById('landing').classList.remove('active');
  const target = type === 'nda' ? 'nda-form' : 'dd-form';
  document.getElementById(target).classList.add('active');
  window.scrollTo(0, 0);

  // Wait a frame so the screen is visible and canvases have real dimensions
  requestAnimationFrame(() => {
    initSignaturePads();
    if (type === 'nda') {
      drawCursiveSignature('companySig', 'Benjamin Boyce');
    }
  });
}

function goBack() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('landing').classList.add('active');
  window.scrollTo(0, 0);
}

// ── Signature Pad ──
const sigPads = {};

function initSignaturePads() {
  document.querySelectorAll('.screen.active .signature-pad').forEach(canvas => {
    const isPreSigned = canvas.id === 'companySig';

    // Always re-init so dimensions are correct
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Skip if canvas is still hidden (0 width)
    if (rect.width === 0) return;

    // If already initialized with correct size, skip
    if (sigPads[canvas.id] && sigPads[canvas.id]._width === rect.width) return;

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false;
    let hasDrawn = isPreSigned;

    // Pre-signed company pad — show tooltip on click, no drawing
    if (isPreSigned) {
      canvas.style.cursor = 'not-allowed';

      canvas.onclick = () => {
        showTooltip(canvas, 'This signature is pre-signed by Benjamin Boyce (CEO) and cannot be modified.');
      };

      sigPads[canvas.id] = {
        canvas,
        ctx,
        _width: rect.width,
        isEmpty: () => false,
        clear: () => {},
        toDataURL: () => canvas.toDataURL('image/png')
      };
      return;
    }

    // Interactive signature pad
    canvas.style.cursor = 'crosshair';

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: touch.clientX - r.left, y: touch.clientY - r.top };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      hasDrawn = true;
    }

    function end() {
      drawing = false;
    }

    // Remove old listeners by replacing canvas (clean slate)
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    const newCtx = newCanvas.getContext('2d');
    newCanvas.width = rect.width * 2;
    newCanvas.height = rect.height * 2;
    newCtx.scale(2, 2);
    newCtx.strokeStyle = '#1a1a2e';
    newCtx.lineWidth = 2.5;
    newCtx.lineCap = 'round';
    newCtx.lineJoin = 'round';
    newCanvas.style.cursor = 'crosshair';

    function getPos2(e) {
      const r = newCanvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: touch.clientX - r.left, y: touch.clientY - r.top };
    }

    let drawing2 = false;
    let hasDrawn2 = false;

    newCanvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      drawing2 = true;
      const pos = getPos2(e);
      newCtx.beginPath();
      newCtx.moveTo(pos.x, pos.y);
    });

    newCanvas.addEventListener('mousemove', (e) => {
      if (!drawing2) return;
      e.preventDefault();
      const pos = getPos2(e);
      newCtx.lineTo(pos.x, pos.y);
      newCtx.stroke();
      newCtx.beginPath();
      newCtx.moveTo(pos.x, pos.y);
      hasDrawn2 = true;
    });

    newCanvas.addEventListener('mouseup', () => { drawing2 = false; });
    newCanvas.addEventListener('mouseleave', () => { drawing2 = false; });

    newCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      drawing2 = true;
      const pos = getPos2(e);
      newCtx.beginPath();
      newCtx.moveTo(pos.x, pos.y);
    }, { passive: false });

    newCanvas.addEventListener('touchmove', (e) => {
      if (!drawing2) return;
      e.preventDefault();
      const pos = getPos2(e);
      newCtx.lineTo(pos.x, pos.y);
      newCtx.stroke();
      newCtx.beginPath();
      newCtx.moveTo(pos.x, pos.y);
      hasDrawn2 = true;
    }, { passive: false });

    newCanvas.addEventListener('touchend', () => { drawing2 = false; });

    sigPads[newCanvas.id] = {
      canvas: newCanvas,
      ctx: newCtx,
      _width: rect.width,
      isEmpty: () => !hasDrawn2,
      clear: () => {
        newCtx.clearRect(0, 0, newCanvas.width, newCanvas.height);
        hasDrawn2 = false;
      },
      toDataURL: () => newCanvas.toDataURL('image/png')
    };
  });
}

function clearSignature(id) {
  if (sigPads[id]) sigPads[id].clear();
}

// ── Tooltip for locked fields ──
function showTooltip(element, message) {
  // Remove any existing tooltip
  const existing = document.querySelector('.locked-tooltip');
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'locked-tooltip';
  tooltip.innerHTML = '<span class="tooltip-icon">&#128274;</span> ' + message;
  element.parentNode.style.position = 'relative';
  element.parentNode.appendChild(tooltip);

  setTimeout(() => {
    tooltip.classList.add('visible');
  }, 10);

  setTimeout(() => {
    tooltip.classList.remove('visible');
    setTimeout(() => tooltip.remove(), 300);
  }, 3500);
}

// ── File Upload ──
function handleUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large. Maximum size is 5MB.');
    input.value = '';
    return;
  }
  document.getElementById('uploadBox').style.display = 'none';
  document.getElementById('uploadPreview').style.display = 'flex';
  document.getElementById('uploadFileName').textContent = file.name;
}

function removeUpload() {
  document.getElementById('checkUpload').value = '';
  document.getElementById('uploadBox').style.display = '';
  document.getElementById('uploadPreview').style.display = 'none';
}

// ── Form Submission ──
let lastSubmittedType = null;
let lastFormData = null;

function submitNDA(e) {
  e.preventDefault();

  if (sigPads['repSig'] && sigPads['repSig'].isEmpty()) {
    alert('Please provide your signature to complete the agreement.');
    document.getElementById('repSig').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  const form = document.getElementById('ndaFormEl');
  const data = new FormData(form);

  lastSubmittedType = 'nda';
  lastFormData = {
    effectiveDate: data.get('effectiveDate'),
    companyAddress: data.get('companyAddress'),
    repName: data.get('repName'),
    repAddress: data.get('repAddress'),
    govState: data.get('govState'),
    courtJurisdiction: data.get('courtJurisdiction'),
    companySignerName: data.get('companySignerName'),
    companySignerTitle: data.get('companySignerTitle'),
    companySig: sigPads['companySig'].toDataURL(),
    repSig: sigPads['repSig'].toDataURL()
  };

  document.getElementById('successMsg').textContent =
    `The NDA & Non-Compete Agreement has been signed by ${lastFormData.repName} on ${new Date().toLocaleDateString()}. A copy is available for download.`;
  document.getElementById('successModal').style.display = 'flex';
  return false;
}

function submitDD(e) {
  e.preventDefault();

  if (sigPads['ddSig'] && sigPads['ddSig'].isEmpty()) {
    alert('Please provide your signature to submit the form.');
    const ddSigCanvas = document.getElementById('ddSig') || document.querySelector('#dd-form .signature-pad');
    if (ddSigCanvas) ddSigCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  const form = document.getElementById('ddFormEl');
  const data = new FormData(form);

  lastSubmittedType = 'dd';
  lastFormData = {
    name: data.get('ddName'),
    empId: data.get('ddEmpId'),
    ssn: data.get('ddSSN'),
    phone: data.get('ddPhone'),
    address: data.get('ddAddress'),
    city: data.get('ddCity'),
    state: data.get('ddState'),
    zip: data.get('ddZip'),
    email: data.get('ddEmail'),
    requestType: data.get('ddRequestType'),
    bankName: data.get('ddBankName'),
    bankAddress: data.get('ddBankAddress'),
    bankCity: data.get('ddBankCity'),
    bankState: data.get('ddBankState'),
    bankZip: data.get('ddBankZip'),
    routing: data.get('ddRouting'),
    account: data.get('ddAccount'),
    accountType: data.get('ddAccountType'),
    sig: sigPads['ddSig'].toDataURL()
  };

  document.getElementById('successMsg').textContent =
    `The Direct Deposit Authorization has been submitted by ${lastFormData.name} on ${new Date().toLocaleDateString()}.`;
  document.getElementById('successModal').style.display = 'flex';
  return false;
}

// ── PDF Download ──
function downloadPDF() {
  if (!lastFormData) return;

  const win = window.open('', '_blank');
  let html = '';

  if (lastSubmittedType === 'nda') {
    html = buildNDAPrintHTML(lastFormData);
  } else {
    html = buildDDPrintHTML(lastFormData);
  }

  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

function buildNDAPrintHTML(d) {
  const today = new Date().toLocaleDateString();
  return `<!DOCTYPE html><html><head><title>NDA Non-Compete - ${esc(d.repName)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 40px; color: #222; font-size: 13px; line-height: 1.7; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
  .sub { text-align: center; color: #666; margin-bottom: 24px; }
  h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  ol { padding-left: 20px; }
  li { margin-bottom: 8px; }
  .info-row { margin-bottom: 4px; }
  .info-row strong { display: inline-block; min-width: 180px; }
  .sig-section { margin-top: 30px; }
  .sig-section h3 { font-size: 14px; margin: 20px 0 8px; }
  .sig-img { max-width: 300px; height: 80px; border-bottom: 2px solid #222; }
  .sig-line { display: flex; gap: 40px; margin-top: 4px; font-size: 12px; color: #666; }
  .logo { display: block; max-width: 160px; margin: 0 auto 16px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<img src="logo.png" class="logo" onerror="this.style.display='none'">
<h1>NON-DISCLOSURE & NON-COMPETE AGREEMENT</h1>
<p class="sub">AdvancedMarketing.co</p>
<p class="info-row"><strong>Effective Date:</strong> ${esc(d.effectiveDate)}</p>
<p class="info-row"><strong>Company:</strong> AdvancedMarketing.co</p>
<p class="info-row"><strong>Company Address:</strong> ${esc(d.companyAddress)}</p>
<p class="info-row"><strong>Representative:</strong> ${esc(d.repName)}</p>
<p class="info-row"><strong>Representative Address:</strong> ${esc(d.repAddress)}</p>

<h2>1. Purpose</h2>
<p>The Representative acknowledges that during their engagement with AdvancedMarketing.co, they will have access to proprietary information including but not limited to: client lists, pricing structures, sales strategies, marketing methodologies, internal processes, trade secrets, business plans, and all other confidential business information.</p>

<h2>2. Non-Disclosure Obligations</h2>
<ol type="a">
<li>The Representative shall not disclose any Confidential Information to any third party without prior written consent.</li>
<li>Confidential Information includes: client/prospect lists, contact information, lead databases, pricing models, proposal templates, sales scripts, cold calling lists, outreach sequences, website development processes, internal tools, revenue figures, compensation structures, and any proprietary business methodologies.</li>
<li>The Representative shall not use any Confidential Information for personal gain or for the benefit of any competing entity.</li>
<li>All materials containing Confidential Information remain the exclusive property of the Company and must be returned or destroyed upon termination.</li>
<li>These non-disclosure obligations remain in effect indefinitely.</li>
</ol>

<h2>3. Non-Compete Restrictions (3-Year Period)</h2>
<ol type="a">
<li>Shall NOT build, design, or develop websites for any competing website development agency or digital marketing firm.</li>
<li>Shall NOT engage in cold calling, cold emailing, or any solicitation on behalf of any competing agency.</li>
<li>Shall NOT solicit any current or former clients, prospects, or leads of AdvancedMarketing.co.</li>
<li>Shall NOT recruit any current or former employees or contractors of the Company.</li>
<li>Shall NOT own, manage, operate, consult for, or be employed by any competing business.</li>
<li>Shall NOT use any sales techniques or methodologies learned at AdvancedMarketing.co for competing businesses.</li>
</ol>

<h2>4. Non-Compete Period</h2>
<p>THREE (3) YEARS from the last day of engagement, regardless of termination reason.</p>

<h2>5. Scope</h2>
<p>Applies globally to all markets in which AdvancedMarketing.co operates, including all digital markets.</p>

<h2>6. Remedies</h2>
<p>Breach entitles the Company to injunctive relief, actual damages, attorneys' fees, and $50,000 liquidated damages per violation. The non-compete period extends by the duration of any breach.</p>

<h2>7. Severability</h2>
<p>Invalid provisions may be modified by the court; remaining provisions stay in full force.</p>

<h2>8. Entire Agreement</h2>
<p>This constitutes the entire agreement. Amendments require written consent of both parties.</p>

<h2>9. Governing Law</h2>
<p>Governed by the laws of <strong>${esc(d.govState)}</strong>. Disputes resolved in courts of <strong>${esc(d.courtJurisdiction)}</strong>.</p>

<div class="sig-section">
<h2>Signatures</h2>
<h3>Company Representative</h3>
<img src="${d.companySig}" class="sig-img">
<div class="sig-line"><span>${esc(d.companySignerName)}, ${esc(d.companySignerTitle)}</span><span>Date: ${today}</span></div>

<h3>Sales Representative</h3>
<img src="${d.repSig}" class="sig-img">
<div class="sig-line"><span>${esc(d.repName)}</span><span>Date: ${today}</span></div>
</div>
</body></html>`;
}

function buildDDPrintHTML(d) {
  const today = new Date().toLocaleDateString();
  const typeLabels = { new: 'New Enrollment', change: 'Change to Existing', cancel: 'Cancel Direct Deposit' };
  return `<!DOCTYPE html><html><head><title>Direct Deposit - ${esc(d.name)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 40px; color: #222; font-size: 13px; line-height: 1.7; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
  .sub { text-align: center; color: #666; margin-bottom: 24px; }
  h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .info-row { margin-bottom: 4px; }
  .info-row strong { display: inline-block; min-width: 180px; }
  .sig-img { max-width: 300px; height: 80px; border-bottom: 2px solid #222; }
  .sig-line { display: flex; gap: 40px; margin-top: 4px; font-size: 12px; color: #666; }
  .logo { display: block; max-width: 160px; margin: 0 auto 16px; }
  p.auth { margin-bottom: 10px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<img src="logo.png" class="logo" onerror="this.style.display='none'">
<h1>DIRECT DEPOSIT AUTHORIZATION FORM</h1>
<p class="sub">AdvancedMarketing.co</p>

<h2>Employee Information</h2>
<p class="info-row"><strong>Full Legal Name:</strong> ${esc(d.name)}</p>
<p class="info-row"><strong>Employee ID:</strong> ${esc(d.empId || 'N/A')}</p>
<p class="info-row"><strong>SSN (last 4):</strong> ***${esc(d.ssn)}</p>
<p class="info-row"><strong>Address:</strong> ${esc(d.address)}, ${esc(d.city)}, ${esc(d.state)} ${esc(d.zip)}</p>
<p class="info-row"><strong>Phone:</strong> ${esc(d.phone)}</p>
<p class="info-row"><strong>Email:</strong> ${esc(d.email)}</p>

<h2>Request Type</h2>
<p class="info-row"><strong>Type:</strong> ${typeLabels[d.requestType] || d.requestType}</p>

<h2>Bank Account Information</h2>
<p class="info-row"><strong>Bank Name:</strong> ${esc(d.bankName)}</p>
<p class="info-row"><strong>Bank Address:</strong> ${esc(d.bankAddress)}, ${esc(d.bankCity)}, ${esc(d.bankState)} ${esc(d.bankZip)}</p>
<p class="info-row"><strong>Routing Number:</strong> ${esc(d.routing)}</p>
<p class="info-row"><strong>Account Number:</strong> ${esc(d.account)}</p>
<p class="info-row"><strong>Account Type:</strong> ${d.accountType === 'checking' ? 'Checking' : 'Savings'}</p>

<h2>Authorization</h2>
<p class="auth">I hereby authorize AdvancedMarketing.co to deposit my entire net pay directly into the bank account indicated above. I also authorize my financial institution to accept and credit any such deposits.</p>
<p class="auth">This authorization remains in effect until written cancellation is submitted. Changes may take one to two pay cycles to take effect.</p>

<h2>Employee Signature</h2>
<img src="${d.sig}" class="sig-img">
<div class="sig-line"><span>${esc(d.name)}</span><span>Date: ${today}</span></div>
</body></html>`;
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function closeModal() {
  document.getElementById('successModal').style.display = 'none';
  goBack();
  document.getElementById('ndaFormEl').reset();
  document.getElementById('ddFormEl').reset();
  Object.keys(sigPads).forEach(id => {
    if (id !== 'companySig') sigPads[id].clear();
  });
  removeUpload();
  // Reset today's date
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.querySelector('input[name="effectiveDate"]');
  if (dateInput) dateInput.value = today;
}

// ── Draw cursive signature ──
function drawCursiveSignature(canvasId, name) {
  const pad = sigPads[canvasId];
  if (!pad) return;
  const canvas = pad.canvas;
  const ctx = pad.ctx;
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0) return;

  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.save();
  ctx.font = 'italic 32px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 20, rect.height / 4);

  // Measure then draw underline
  const textWidth = ctx.measureText(name).width;
  ctx.restore();

  ctx.beginPath();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1.5;
  ctx.moveTo(18, rect.height / 4 + 20);
  ctx.lineTo(18 + textWidth + 10, rect.height / 4 + 20);
  ctx.stroke();

  pad.isEmpty = () => false;
}

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.querySelector('input[name="effectiveDate"]');
  if (dateInput) dateInput.value = today;
});
