/* -------------------------------------------------------------
   XSS PLAYGROUND - INTERACTIVE CORE CONTROLLER (REBUILD)
------------------------------------------------------------- */

// Global Application State
const state = {
  currentTab: 'dashboard',
  isSecureMode: false,
  codeTabs: {
    reflected: 'vuln',
    stored: 'vuln',
    dom: 'vuln'
  },
  mockHash: 'theme=default'
};

// Payload Database (stored client-side to prevent attribute escaping conflicts)
const PAYLOAD_PRESETS = {
  reflected: [
    { name: 'Classic Script', code: "<script>alert('Reflected XSS!')</script>" },
    { name: 'Image Error', code: "<img src=\"invalid-image.jpg\" onerror=\"alert('Image Error Exploit')\">" },
    { name: 'SVG Onload', code: "<svg onload=\"alert('SVG SVG Exploit')\">" },
    { name: 'Javascript Link', code: "<a href=\"javascript:alert('Javascript URI Executed')\">Click Here!</a>" }
  ],
  stored: [
    { name: 'Persistent Script', code: "<script>alert('Stored XSS Triggered!')</script>" },
    { name: 'Image Error Log', code: "<img src=\"broken.png\" onerror=\"alert('Stored Cookie Stealer Sim')\">" },
    { name: 'URI Anchor Click', code: "<a href=\"javascript:alert('Stored URI Exploit')\">Claim Free Gift!</a>" },
    { name: 'Iframe Payload', code: "<iframe src=\"javascript:alert('Iframe Stored XSS')\" width=\"0\" height=\"0\"></iframe>" }
  ],
  dom: [
    { name: 'Image Error Injection', code: "<img src=\"x\" onerror=\"alert('DOM XSS Executed')\">" },
    { name: 'CSS javascript: URI', code: "cyberpunk;background-image:url(\"javascript:alert('DOM CSS Exploit')\")" },
    { name: 'Iframe Sink Injection', code: "<iframe src=\"javascript:alert('DOM Iframe Triggered')\" style=\"display:none\"></iframe>" }
  ]
};

// -------------------------------------------------------------
// Interactive Custom Alert Interception
// -------------------------------------------------------------
function triggerSimulatedAlert(message) {
  const overlay = document.getElementById('alert-modal-overlay');
  const codeContent = document.getElementById('alert-modal-content');
  if (overlay && codeContent) {
    codeContent.textContent = message;
    overlay.classList.add('show');
  }
}

function closeAlertModal() {
  const overlay = document.getElementById('alert-modal-overlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// Redirect Native window.alert to our UI modal globally
window.alert = function(message) {
  triggerSimulatedAlert(message);
};

// -------------------------------------------------------------
// Vulnerable Payload Execution sandbox runner
// -------------------------------------------------------------
function executeInjectedPayload(containerId, rawHTML) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous rendering safely
  container.innerHTML = '';

  if (state.isSecureMode) {
    // In secure mode, write contents as plain text (browser will render safe code characters, not HTML elements)
    container.textContent = rawHTML;
  } else {
    // In vulnerable mode, write raw HTML elements
    container.innerHTML = rawHTML;

    // Search and run injected script blocks since innerHTML does not evaluate scripts natively
    try {
      const scripts = container.getElementsByTagName('script');
      // Convert HTMLCollection to Array to prevent index offsets during appends
      const scriptList = Array.from(scripts);
      scriptList.forEach(scriptNode => {
        const newScript = document.createElement('script');
        newScript.textContent = scriptNode.textContent;
        // Append to trigger execution, then clean up
        document.body.appendChild(newScript);
        document.body.removeChild(newScript);
      });
    } catch (err) {
      console.error('Payload script parsing failed safely:', err);
    }
  }
}

// -------------------------------------------------------------
// Navigation & Routing System
// -------------------------------------------------------------
function switchTab(tabId) {
  // Hide all panels
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active styling on sidebar items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show active tab panel
  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Highlight menu choice
  const activeMenu = document.getElementById(`nav-${tabId}`);
  if (activeMenu) {
    activeMenu.classList.add('active');
  }

  // Synchronize Page Header labels
  const titleMap = {
    dashboard: { title: 'Dashboard', subtitle: 'Security Sandbox & Interactive Demonstrations' },
    reflected: { title: 'Reflected XSS Sandbox', subtitle: 'Inputs are reflected directly inside the server responses' },
    stored: { title: 'Stored XSS Guestbook', subtitle: 'Persisted database variables load scripts for all users' },
    dom: { title: 'DOM-based XSS Lab', subtitle: 'Dynamic hash variables process execution sinks on client-side JS' },
    prevention: { title: 'Prevention Guide', subtitle: 'Universal strategies to block and mitigate script injections' }
  };

  const headerMeta = titleMap[tabId];
  if (headerMeta) {
    document.getElementById('page-title').textContent = headerMeta.title;
    document.getElementById('page-subtitle').textContent = headerMeta.subtitle;
  }

  // Toggle Global Security Switch Visibility
  const securityControl = document.getElementById('global-security-control');
  if (tabId === 'dashboard' || tabId === 'prevention') {
    securityControl.style.display = 'none';
  } else {
    securityControl.style.display = 'flex';
  }

  state.currentTab = tabId;
  syncSecurityStatusUI();

  // Tab bootstrap callbacks
  if (tabId === 'reflected') {
    runReflectedSandbox();
    updateCodeDisplay('reflected');
  } else if (tabId === 'stored') {
    loadStoredComments();
    updateCodeDisplay('stored');
  } else if (tabId === 'dom') {
    initDOMSandbox();
    updateCodeDisplay('dom');
  }
}

function syncSecurityStatusUI() {
  const tabs = ['reflected', 'stored', 'dom'];
  tabs.forEach(tabKey => {
    const indicator = document.getElementById(`${tabKey}-status`);
    const badge = document.getElementById(`${tabKey}-mode-badge`);
    if (!indicator) return;

    const msgSpan = indicator.querySelector('.status-msg');

    if (state.isSecureMode) {
      indicator.className = 'status-indicator secure';
      if (msgSpan) {
        msgSpan.innerHTML = `Status: <strong>Secure Mode Active</strong> &mdash; HTML output escaping is enforced.`;
      }
      if (badge) {
        badge.className = 'badge badge-success';
        badge.textContent = 'Secure';
      }
    } else {
      indicator.className = 'status-indicator vulnerable';
      if (msgSpan) {
        msgSpan.innerHTML = `Status: <strong>Vulnerable Mode Active</strong> &mdash; Sinks receive unescaped inputs.`;
      }
      if (badge) {
        badge.className = 'badge badge-danger';
        badge.textContent = 'Vulnerable';
      }
    }
  });
}

function toggleSecurityMode() {
  const toggle = document.getElementById('security-toggle');
  state.isSecureMode = toggle.checked;

  // Sync active code comparison panels to reflect global switch
  const modeKey = state.isSecureMode ? 'secure' : 'vuln';
  state.codeTabs.reflected = modeKey;
  state.codeTabs.stored = modeKey;
  state.codeTabs.dom = modeKey;

  // Sync code tab button UI selections
  document.querySelectorAll('.code-tabs').forEach(tabGroup => {
    const btns = tabGroup.querySelectorAll('.code-tab-btn');
    btns.forEach(btn => {
      if (btn.getAttribute('data-mode') === modeKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  syncSecurityStatusUI();

  // Re-run sandbox elements
  if (state.currentTab === 'reflected') {
    runReflectedSandbox();
    updateCodeDisplay('reflected');
  } else if (state.currentTab === 'stored') {
    loadStoredComments();
    updateCodeDisplay('stored');
  } else if (state.currentTab === 'dom') {
    runDOMSandboxDemo();
    updateCodeDisplay('dom');
  }
}

// Render Payload presets in sandbox tabs dynamically
function renderPayloadPresets() {
  const categories = ['reflected', 'stored', 'dom'];
  categories.forEach(cat => {
    const container = document.getElementById(`${cat}-presets`);
    if (!container) return;
    container.innerHTML = '';

    PAYLOAD_PRESETS[cat].forEach(preset => {
      const tag = document.createElement('span');
      tag.className = 'preset-tag';
      tag.textContent = preset.name;
      tag.addEventListener('click', () => {
        loadPresetIntoInput(cat, preset.code);
      });
      container.appendChild(tag);
    });
  });
}

function loadPresetIntoInput(category, code) {
  if (category === 'reflected') {
    document.getElementById('reflected-input').value = code;
    runReflectedSandbox();
  } else if (category === 'stored') {
    document.getElementById('stored-content').value = code;
  } else if (category === 'dom') {
    document.getElementById('dom-theme-input').value = code;
    updateMockURLHash();
  }
}

// -------------------------------------------------------------
// Reflected XSS Sandbox Logics
// -------------------------------------------------------------
async function runReflectedSandbox() {
  const inputEl = document.getElementById('reflected-input');
  if (!inputEl) return;
  
  const queryVal = inputEl.value;
  const outputContainer = document.getElementById('reflected-output');
  if (!outputContainer) return;

  // If search value is empty, load a default explanation
  if (!queryVal) {
    outputContainer.innerHTML = `<span style="color: var(--text-muted);">Results will reflect here...</span>`;
    return;
  }

  try {
    const response = await fetch(`/api/reflected?q=${encodeURIComponent(queryVal)}&secure=${state.isSecureMode}`);
    const data = await response.json();
    
    // Render search results through sandbox evaluator
    executeInjectedPayload('reflected-output', data.query);
  } catch (err) {
    console.error('Reflected API error:', err);
    outputContainer.textContent = 'API connection error...';
  }
}

// -------------------------------------------------------------
// Stored XSS Sandbox Logics
// -------------------------------------------------------------
async function loadStoredComments() {
  const wall = document.getElementById('comments-wall');
  if (!wall) return;

  try {
    const res = await fetch(`/api/comments?secure=${state.isSecureMode}`);
    const data = await res.json();
    
    wall.innerHTML = '';

    if (data.comments.length === 0) {
      wall.innerHTML = `<div style="text-align:center; padding: 2rem; color:var(--text-muted);">No comments found. Leave a feedback message!</div>`;
      return;
    }

    data.comments.forEach(comment => {
      const card = document.createElement('div');
      card.className = 'comment-card';

      // Create header row for name and metadata
      const meta = document.createElement('div');
      meta.className = 'comment-meta';

      const author = document.createElement('span');
      author.className = 'comment-author';
      // Render author metadata safely using textContent
      author.textContent = comment.author;

      const time = document.createElement('span');
      time.className = 'comment-time';
      time.textContent = comment.timestamp;

      meta.appendChild(author);
      meta.appendChild(time);
      card.appendChild(meta);

      // Create content container
      const content = document.createElement('div');
      content.className = 'comment-content';
      card.appendChild(content);
      wall.appendChild(card);

      // Render comment content body (evaluating script components in Vulnerable mode)
      if (state.isSecureMode) {
        content.textContent = comment.content;
      } else {
        // Run payload parser
        const shadowDiv = document.createElement('div');
        shadowDiv.innerHTML = comment.content;
        content.appendChild(shadowDiv);

        // Run scripts manually
        try {
          const scripts = shadowDiv.getElementsByTagName('script');
          Array.from(scripts).forEach(scr => {
            const runner = document.createElement('script');
            runner.textContent = scr.textContent;
            document.body.appendChild(runner);
            document.body.removeChild(runner);
          });
        } catch (e) {
          console.error('Comment script load crash:', e);
        }
      }
    });
  } catch (err) {
    console.error('Stored API loading error:', err);
    wall.textContent = 'API connection error...';
  }
}

async function submitStoredComment() {
  const authorEl = document.getElementById('stored-author');
  const contentEl = document.getElementById('stored-content');
  if (!authorEl || !contentEl) return;

  const author = authorEl.value.trim();
  const content = contentEl.value.trim();

  if (!author || !content) {
    alert('Author name and comment body cannot be empty!');
    return;
  }

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content })
    });
    
    if (res.ok) {
      contentEl.value = '';
      loadStoredComments();
    }
  } catch (e) {
    console.error('Comment post failed:', e);
  }
}

async function resetStoredDatabase() {
  try {
    const res = await fetch('/api/comments/reset', { method: 'POST' });
    if (res.ok) {
      loadStoredComments();
    }
  } catch (e) {
    console.error('Reset database failed:', e);
  }
}

// -------------------------------------------------------------
// DOM-based XSS Sandbox Logics
// -------------------------------------------------------------
function initDOMSandbox() {
  const inputEl = document.getElementById('dom-theme-input');
  if (inputEl) {
    inputEl.value = 'default';
    state.mockHash = 'theme=default';
    document.getElementById('url-hash-display').textContent = state.mockHash;
    runDOMSandboxDemo();
  }
}

function updateMockURLHash() {
  const inputEl = document.getElementById('dom-theme-input');
  if (!inputEl) return;

  const val = inputEl.value.trim();
  state.mockHash = `theme=${val}`;
  document.getElementById('url-hash-display').textContent = state.mockHash;
  runDOMSandboxDemo();
}

function runDOMSandboxDemo() {
  const displayTitle = document.getElementById('theme-display-title');
  const previewBox = document.getElementById('theme-preview-box');
  if (!displayTitle || !previewBox) return;

  // Parse simulated hash
  const match = state.mockHash.match(/theme=(.*)/);
  const themeValue = match ? decodeURIComponent(match[1]) : 'default';

  if (state.isSecureMode) {
    // SECURE Mode: Enforce strict allowlists and apply styles via property methods
    const allowedThemes = ['default', 'dark', 'light', 'cyberpunk', 'retro'];
    const selected = themeValue.toLowerCase();

    // Reset styles
    previewBox.style.backgroundColor = '';
    previewBox.style.color = '';
    previewBox.className = 'theme-preview-box';

    if (allowedThemes.includes(selected)) {
      displayTitle.textContent = `Active Theme: ${selected.toUpperCase()}`;
      if (selected === 'dark') {
        previewBox.style.backgroundColor = '#111827';
        previewBox.style.color = '#f9fafb';
      } else if (selected === 'light') {
        previewBox.style.backgroundColor = '#ffffff';
        previewBox.style.color = '#0f172a';
      } else if (selected === 'cyberpunk') {
        previewBox.style.backgroundColor = '#ff0055';
        previewBox.style.color = '#00ffff';
      } else if (selected === 'retro') {
        previewBox.style.backgroundColor = '#fef08a';
        previewBox.style.color = '#1c1917';
      }
    } else {
      displayTitle.textContent = `Active Theme: DEFAULT (Invalid input rejected)`;
    }
  } else {
    // VULNERABLE Mode: Dynamic innerHTML execution sink on user hash data
    displayTitle.innerHTML = `Active Theme: ${themeValue}`;

    // Inline CSS injection parser simulation (handles payloads like: dark;background-image:url("javascript:alert(1)") )
    if (themeValue.includes(';')) {
      const sections = themeValue.split(';');
      const cssString = sections[1];
      if (cssString) {
        previewBox.setAttribute('style', cssString);
        
        // Parse and simulate CSS URL javascript actions
        if (cssString.includes('javascript:')) {
          const jsMatch = cssString.match(/javascript:(.*?)(?:\)|&quot;|$)/);
          if (jsMatch && jsMatch[1]) {
            const jsCode = decodeURIComponent(jsMatch[1]);
            setTimeout(() => {
              try {
                new Function(jsCode)();
              } catch (err) {}
            }, 100);
          }
        }
      }
    } else {
      previewBox.removeAttribute('style');
    }

    // Process scripts embedded inside innerHTML context manually
    const scripts = displayTitle.getElementsByTagName('script');
    Array.from(scripts).forEach(scr => {
      try {
        const runner = document.createElement('script');
        runner.textContent = scr.textContent;
        document.body.appendChild(runner);
        document.body.removeChild(runner);
      } catch (err) {}
    });
  }
}

// -------------------------------------------------------------
// Interactive Code Comparison Displays & Syntax Highlighting
// -------------------------------------------------------------
const CODE_SNIPPETS = {
  reflected: {
    vuln: `// VULNERABLE Endpoint route - server.js
app.get('/api/reflected', (req, res) => {
  const query = req.query.q || '';

  // VULNERABILITY: User input echoed back directly 
  // without validation, sanitization, or escaping
  return res.json({
    query: query,
    status: 'Vulnerable'
  });
});`,
    secure: `// SECURE Endpoint route - server.js
app.get('/api/reflected', (req, res) => {
  const query = req.query.q || '';

  // MITIGATION: Escape special characters using custom HTML encodings
  const securedQuery = escapeHTML(query);

  return res.json({
    query: securedQuery,
    status: 'Protected'
  });
});

// Custom HTML character escaper mapping
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\\//g, '&#x2F;');
}`
  },
  stored: {
    vuln: `// VULNERABLE Comment Renderer - app.js
data.comments.forEach(comment => {
  const card = document.createElement('div');
  card.className = 'comment-card';

  // VULNERABILITY: Raw database variables inserted directly 
  // into the innerHTML sink, executing user script blocks.
  card.innerHTML = \`
    <div class="meta">\${comment.author}</div>
    <div class="body">\${comment.content}</div>
  \`;
  wall.appendChild(card);
});`,
    secure: `// SECURE Comment Renderer - app.js
data.comments.forEach(comment => {
  const card = document.createElement('div');
  card.className = 'comment-card';

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'body';

  // MITIGATION: Write text variables via safe textContent property.
  // The browser parses entities as text data rather than executing DOM elements.
  bodyDiv.textContent = comment.content;

  card.appendChild(bodyDiv);
  wall.appendChild(card);
});`
  },
  dom: {
    vuln: `// VULNERABLE Theme customizer hash receiver - app.js
const hash = window.location.hash;
const themeVal = hash.match(/theme=(.*)/)[1];

// VULNERABILITY: Dynamic hash strings reflected straight 
// inside the execution sink, bypassing check boundaries.
document.getElementById('theme-title').innerHTML = \`Active: \${themeVal}\`;`,
    secure: `// SECURE Theme customizer hash receiver - app.js
const hash = window.location.hash;
const themeVal = hash.match(/theme=(.*)/)[1];

// MITIGATION: Validate against strict allowlists 
// and assign styles via properties rather than raw markup templates.
const allowedThemes = ['light', 'dark', 'cyberpunk', 'retro'];

if (allowedThemes.includes(themeVal.toLowerCase())) {
  document.getElementById('theme-title').textContent = \`Active: \${themeVal}\`;
} else {
  document.getElementById('theme-title').textContent = 'Active: Default';
}`
  }
};

function updateCodeDisplay(section) {
  const codeEl = document.getElementById(`${section}-code`);
  if (!codeEl) return;

  const mode = state.codeTabs[section];
  const snippet = CODE_SNIPPETS[section][mode];

  // Apply simple CSS tag highlights dynamically
  let highlighted = snippet
    .replace(/(function|const|let|var|return|import|from|class|if|else)/g, '<span class="hl-keyword">$1</span>')
    .replace(/('(.*?)'|"(.*?)"|`(.*?)`)/g, '<span class="hl-string">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>');

  // Highlight specific vulnerabilities and mitigations
  if (mode === 'vuln') {
    highlighted = highlighted.replace(/(innerHTML|query: query)/g, '<span class="hl-vuln-bg">$1</span>');
  } else {
    highlighted = highlighted.replace(/(textContent|escapeHTML|escapeHTML\(query\)|allowedThemes\.includes)/g, '<span class="hl-secure-bg">$1</span>');
  }

  codeEl.innerHTML = highlighted;
}

function copyCodeToClipboard(section) {
  const mode = state.codeTabs[section];
  const snippet = CODE_SNIPPETS[section][mode];
  navigator.clipboard.writeText(snippet).then(() => {
    alert(`Copied ${mode === 'vuln' ? 'Vulnerable' : 'Secure'} code sample to clipboard!`);
  }).catch(err => {
    console.error('Clipboard copy failed:', err);
  });
}

// -------------------------------------------------------------
// Interactive Bootstrap Routines
// -------------------------------------------------------------
function bindInteractiveEvents() {
  // 1. Sidebar tab routing buttons
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // 2. Global mitigation switch
  const securityToggle = document.getElementById('security-toggle');
  if (securityToggle) {
    securityToggle.addEventListener('change', toggleSecurityMode);
  }

  // 3. Welcome Screen CTA Button
  const startLabsBtn = document.getElementById('start-labs-btn');
  if (startLabsBtn) {
    startLabsBtn.addEventListener('click', () => {
      switchTab('reflected');
    });
  }

  // 4. Reflected Sandbox search
  const reflectedSearchBtn = document.getElementById('reflected-search-btn');
  if (reflectedSearchBtn) {
    reflectedSearchBtn.addEventListener('click', runReflectedSandbox);
  }
  const reflectedInput = document.getElementById('reflected-input');
  if (reflectedInput) {
    reflectedInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') runReflectedSandbox();
    });
  }

  // 5. Stored Sandbox comment actions
  const commentSubmitBtn = document.getElementById('stored-submit-btn');
  if (commentSubmitBtn) {
    commentSubmitBtn.addEventListener('click', submitStoredComment);
  }
  const commentResetBtn = document.getElementById('stored-reset-btn');
  if (commentResetBtn) {
    commentResetBtn.addEventListener('click', resetStoredDatabase);
  }

  // 6. DOM Hash customize updates
  const domUpdateBtn = document.getElementById('dom-update-btn');
  if (domUpdateBtn) {
    domUpdateBtn.addEventListener('click', updateMockURLHash);
  }
  const domInput = document.getElementById('dom-theme-input');
  if (domInput) {
    domInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') updateMockURLHash();
    });
  }

  // 7. Modal overlay dismiss close btn
  const closeAlertBtn = document.getElementById('close-alert-modal-btn');
  if (closeAlertBtn) {
    closeAlertBtn.addEventListener('click', closeAlertModal);
  }

  // 8. Copy code snippet elements
  const copyReflected = document.getElementById('copy-reflected-code');
  if (copyReflected) {
    copyReflected.addEventListener('click', () => copyCodeToClipboard('reflected'));
  }
  const copyStored = document.getElementById('copy-stored-code');
  if (copyStored) {
    copyStored.addEventListener('click', () => copyCodeToClipboard('stored'));
  }
  const copyDom = document.getElementById('copy-dom-code');
  if (copyDom) {
    copyDom.addEventListener('click', () => copyCodeToClipboard('dom'));
  }

  // 9. Code showcase toggle tab headers
  document.querySelectorAll('.code-tabs').forEach(tabBar => {
    const section = tabBar.getAttribute('data-section');
    const btns = tabBar.querySelectorAll('.code-tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        state.codeTabs[section] = mode;
        
        // Highlight chosen selection button
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        updateCodeDisplay(section);
      });
    });
  });
}

function bootstrapApplication() {
  bindInteractiveEvents();
  renderPayloadPresets();
  switchTab('dashboard');
}

// Kickstart App on Content Loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApplication);
} else {
  bootstrapApplication();
}
