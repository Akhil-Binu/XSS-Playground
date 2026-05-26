/* -------------------------------------------------------------
   XSS PLAYGROUND - INTERACTIVE APP ENGINE (VANILLA JS)
------------------------------------------------------------- */

// Global Application State
const state = {
  currentTab: 'dashboard',
  isSecureMode: false,
  codeTabs: {
    reflected: 'vuln', // 'vuln' or 'secure'
    stored: 'vuln',
    dom: 'vuln'
  },
  mockHash: 'theme=cyberpunk'
};

// -------------------------------------------------------------
// Interactive Alert Simulation
// -------------------------------------------------------------
// Because calling alert() stops thread execution and can crash or break modern browsers/sandbox tests,
// we intercept standard XSS code payloads and direct them to a simulated alert overlay block.
function triggerSimulatedAlert(message) {
  const overlay = document.getElementById('alert-modal-overlay');
  const codeContent = document.getElementById('alert-modal-content');
  
  codeContent.textContent = message;
  overlay.classList.add('show');
}

function closeAlertModal() {
  const overlay = document.getElementById('alert-modal-overlay');
  overlay.classList.remove('show');
}

// Custom Safe Script Evaluator that catches executing alerts and logs them
function executeInjectedPayload(containerId, rawHTML) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous output safely
  container.innerHTML = '';

  // Vulnerable Mode: Execute scripts in container manually since innerHTML doesn't execute script tags
  if (!state.isSecureMode) {
    // 1. Create a shadow element to parse HTML structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHTML;

    // 2. Insert standard content nodes
    container.innerHTML = rawHTML;

    // 3. Find and run script tags manually
    const scripts = tempDiv.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const scriptNode = scripts[i];
      const newScript = document.createElement('script');
      
      // Handle inline scripts with alert simulations
      let scriptContent = scriptNode.textContent;
      if (scriptContent.includes('alert(')) {
        // Rewrite alert(...) to triggerSimulatedAlert(...)
        scriptContent = scriptContent.replace(/alert\((.*?)\)/g, 'triggerSimulatedAlert($1)');
      }
      
      newScript.textContent = scriptContent;
      document.body.appendChild(newScript);
      document.body.removeChild(newScript); // Cleanup execution
    }

    // 4. Handle element events (like onerror, onload, onclick Javascript URIs)
    const elementsWithHandlers = container.querySelectorAll('*');
    elementsWithHandlers.forEach(el => {
      // Look for typical inline handlers
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (attr.name.startsWith('on')) {
          const handlerContent = attr.value;
          // Bind simulated handler triggers
          el.addEventListener(attr.name.substring(2), () => {
            const rewritten = handlerContent.replace(/alert\((.*?)\)/g, 'triggerSimulatedAlert($1)');
            try {
              new Function(rewritten)();
            } catch (e) {
              console.error('Trigger error:', e);
            }
          });
          
          // If it's an error handler and the element is an image, we immediately trigger it
          if (attr.name === 'onerror' && el.tagName === 'IMG') {
            setTimeout(() => {
              const rewritten = handlerContent.replace(/alert\((.*?)\)/g, 'triggerSimulatedAlert($1)');
              try {
                new Function(rewritten)();
              } catch (e) {
                console.error(e);
              }
            }, 50);
          }
          // If it's an svg onload handler, trigger immediately
          if (attr.name === 'onload' && el.tagName === 'svg') {
             setTimeout(() => {
              const rewritten = handlerContent.replace(/alert\((.*?)\)/g, 'triggerSimulatedAlert($1)');
              try {
                new Function(rewritten)();
              } catch (e) {
                console.error(e);
              }
            }, 50);
          }
        }

        // Handle javascript: href execution links
        if (attr.name === 'href' && attr.value.startsWith('javascript:')) {
          const jsContent = attr.value.substring(11);
          el.setAttribute('href', '#');
          el.addEventListener('click', (e) => {
            e.preventDefault();
            const rewritten = jsContent.replace(/alert\((.*?)\)/g, 'triggerSimulatedAlert($1)');
            try {
              new Function(rewritten)();
            } catch (err) {
              console.error(err);
            }
          });
        }
      });
    });
  } else {
    // Secure Mode: HTML Encode input before setting innerHTML
    // Server already returns HTML encoded string when secure=true, so we can display safely
    container.innerHTML = rawHTML;
  }
}

// -------------------------------------------------------------
// Tab Router / Controller
// -------------------------------------------------------------
function switchTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active sidebar class
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected tab
  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Highlight menu item
  const activeMenu = document.getElementById(`nav-${tabId}`);
  if (activeMenu) {
    activeMenu.classList.add('active');
  }

  // Update Page Title
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Interactive Cybersecurity Labs' },
    reflected: { title: 'Reflected XSS Sandbox', subtitle: 'echo parameters back directly into server responses' },
    stored: { title: 'Stored XSS Guestbook', subtitle: 'inputs are persisted inside the server database' },
    dom: { title: 'DOM-based XSS Lab', subtitle: 'dynamic values are parsed and rendered directly in client JS' },
    prevention: { title: 'Prevention Guide', subtitle: 'mitigating XSS using secure design principles' }
  };

  const header = titles[tabId];
  if (header) {
    document.getElementById('page-title').textContent = header.title;
    document.getElementById('page-subtitle').textContent = header.subtitle;
  }

  // Show/Hide Global Security Toggle
  const securityControl = document.getElementById('global-security-control');
  if (tabId === 'dashboard' || tabId === 'prevention') {
    securityControl.style.display = 'none';
  } else {
    securityControl.style.display = 'flex';
  }

  state.currentTab = tabId;
  updateGlobalUIPosition();
  
  // Tab Init Callbacks
  if (tabId === 'reflected') {
    updateReflectedCodeShowcase();
  } else if (tabId === 'stored') {
    loadStoredComments();
    updateStoredCodeShowcase();
  } else if (tabId === 'dom') {
    initDOMSandbox();
    updateDOMCodeShowcase();
  }
}

// Update Lab Banner Status Indicators and Badges
function updateGlobalUIPosition() {
  const modes = ['reflected', 'stored', 'dom'];
  modes.forEach(mode => {
    const statusDiv = document.getElementById(`${mode}-status`);
    const badge = document.getElementById(`${mode}-mode-badge`);
    if (!statusDiv) return;

    if (state.isSecureMode) {
      statusDiv.className = 'status-indicator secure';
      statusDiv.innerHTML = `<span class="indicator-dot"></span><span>Status: <strong>Secure Mode Enabled</strong> &mdash; System enforces output escaping, validation, and encoding filters.</span>`;
      if (badge) {
        badge.className = 'badge badge-success';
        badge.textContent = 'Secure';
      }
    } else {
      statusDiv.className = 'status-indicator vulnerable';
      statusDiv.innerHTML = `<span class="indicator-dot"></span><span>Status: <strong>Vulnerable Mode Active</strong> &mdash; Dangerous sinks receive unsanitized parameters.</span>`;
      if (badge) {
        badge.className = 'badge badge-danger';
        badge.textContent = 'Vulnerable';
      }
    }
  });
}

function toggleSecurityMode() {
  const checkbox = document.getElementById('security-toggle');
  state.isSecureMode = checkbox.checked;
  updateGlobalUIPosition();
  
  // Re-run standard actions to display current secure state
  if (state.currentTab === 'reflected') {
    runReflectedDemo();
    updateReflectedCodeShowcase();
  } else if (state.currentTab === 'stored') {
    loadStoredComments();
    updateStoredCodeShowcase();
  } else if (state.currentTab === 'dom') {
    runDOMSandboxDemo();
    updateDOMCodeShowcase();
  }
}

function loadPayload(lab, text) {
  if (lab === 'reflected') {
    document.getElementById('reflected-input').value = text;
  } else if (lab === 'stored') {
    document.getElementById('stored-content').value = text;
  } else if (lab === 'dom') {
    document.getElementById('dom-theme-input').value = text;
  }
}

// -------------------------------------------------------------
// 1. Reflected XSS Sandbox Logics
// -------------------------------------------------------------
async function runReflectedDemo() {
  const queryVal = document.getElementById('reflected-input').value;
  const reflectedOutput = document.getElementById('reflected-output');
  
  try {
    const response = await fetch(`/api/reflected?q=${encodeURIComponent(queryVal)}&secure=${state.isSecureMode}`);
    const data = await response.json();
    
    // Execute / Render the reflected query value safely or unsafely
    executeInjectedPayload('reflected-output', data.query);
  } catch (err) {
    console.error('Error fetching reflected API:', err);
    reflectedOutput.textContent = 'Error connecting to api server...';
  }
}

// -------------------------------------------------------------
// 2. Stored XSS Guestbook Logics
// -------------------------------------------------------------
async function loadStoredComments() {
  const commentsWall = document.getElementById('comments-wall');
  try {
    const res = await fetch(`/api/comments?secure=${state.isSecureMode}`);
    const data = await res.json();
    
    commentsWall.innerHTML = '';
    
    if (data.comments.length === 0) {
      commentsWall.innerHTML = `<div style="text-align:center; padding: 2rem; color:var(--text-muted);">No comments found. Be the first to leave feedback!</div>`;
      return;
    }

    data.comments.forEach(comment => {
      const commentId = `comment-render-${comment.id}`;
      
      // Create comment card wrappers safely
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment-card';
      commentDiv.innerHTML = `
        <div class="comment-meta">
          <span class="comment-author" id="author-${commentId}"></span>
          <span class="comment-time">${comment.timestamp}</span>
        </div>
        <div class="comment-content" id="content-${commentId}"></div>
      `;
      commentsWall.appendChild(commentDiv);

      // Render author & content using custom evaluator (simulating XSS execution in vulnerable mode)
      if (state.isSecureMode) {
        document.getElementById(`author-${commentId}`).textContent = comment.author;
        document.getElementById(`content-${commentId}`).textContent = comment.content;
      } else {
        // Execute inside vulnerable blocks
        executeInjectedPayload(`author-${commentId}`, comment.author);
        executeInjectedPayload(`content-${commentId}`, comment.content);
      }
    });
  } catch (e) {
    console.error(e);
    commentsWall.textContent = 'Error loading guestbook...';
  }
}

async function submitStoredComment() {
  const authorVal = document.getElementById('stored-author').value;
  const contentVal = document.getElementById('stored-content').value;

  if (!authorVal || !contentVal) {
    alert('Please fill out Author and Comment fields!');
    return;
  }

  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: authorVal,
        content: contentVal
      })
    });
    
    if (response.ok) {
      document.getElementById('stored-content').value = '';
      loadStoredComments();
    }
  } catch (err) {
    console.error(err);
  }
}

async function resetStoredDatabase() {
  try {
    const res = await fetch('/api/comments/reset', { method: 'POST' });
    if (res.ok) {
      loadStoredComments();
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// 3. DOM-Based XSS Logics
// -------------------------------------------------------------
function initDOMSandbox() {
  const initialThemeInput = document.getElementById('dom-theme-input').value;
  state.mockHash = `theme=${initialThemeInput}`;
  document.getElementById('url-hash-display').textContent = state.mockHash;
  runDOMSandboxDemo();
}

function updateMockURLHash() {
  const themeInputVal = document.getElementById('dom-theme-input').value;
  state.mockHash = `theme=${themeInputVal}`;
  document.getElementById('url-hash-display').textContent = state.mockHash;
  runDOMSandboxDemo();
}

function runDOMSandboxDemo() {
  const previewBox = document.getElementById('theme-preview-box');
  const titleDisplay = document.getElementById('theme-display-title');
  
  // Parse hash parameter simulation
  const hashString = state.mockHash;
  const themeParamMatch = hashString.match(/theme=(.*)/);
  const themeValue = themeParamMatch ? decodeURIComponent(themeParamMatch[1]) : 'default';

  if (state.isSecureMode) {
    // -------------------------------------------------------------
    // SECURE DOM Handling: Text rendering + validate against allowlist
    // -------------------------------------------------------------
    const safeThemes = ['light', 'dark', 'cyberpunk', 'retro'];
    const lowerTheme = themeValue.toLowerCase();
    
    if (safeThemes.includes(lowerTheme)) {
      titleDisplay.textContent = `Active: ${themeValue.toUpperCase()} Theme`;
      
      // Apply clean CSS modifications
      previewBox.className = 'theme-preview-box';
      previewBox.style.backgroundColor = '';
      previewBox.style.color = '';
      
      if (lowerTheme === 'dark') {
        previewBox.style.backgroundColor = '#1e293b';
        previewBox.style.color = '#ffffff';
      } else if (lowerTheme === 'light') {
        previewBox.style.backgroundColor = '#f8fafc';
        previewBox.style.color = '#0f172a';
      } else if (lowerTheme === 'cyberpunk') {
        previewBox.style.backgroundColor = '#ff0055';
        previewBox.style.color = '#00ffff';
      } else if (lowerTheme === 'retro') {
        previewBox.style.backgroundColor = '#fef08a';
        previewBox.style.color = '#1c1917';
      }
    } else {
      // Neutralize completely if not in allowlist
      titleDisplay.textContent = `Active: DEFAULT Theme (Invalid parameter filtered)`;
      previewBox.className = 'theme-preview-box';
      previewBox.style.backgroundColor = '';
      previewBox.style.color = '';
    }
  } else {
    // -------------------------------------------------------------
    // VULNERABLE DOM Sink: innerHTML used on raw inputs
    // -------------------------------------------------------------
    
    // Unsafe reflection into DOM text
    titleDisplay.innerHTML = `Active Theme: ${themeValue}`;

    // Inline CSS injection parser (e.g. parameter is: dark;background-image:url("javascript:alert(1)") )
    if (themeValue.includes(';')) {
      const parts = themeValue.split(';');
      const backgroundStyle = parts[1];
      if (backgroundStyle) {
        previewBox.setAttribute('style', backgroundStyle);
        // Simulate CSS javascript URL triggers
        if (backgroundStyle.includes('javascript:')) {
          const match = backgroundStyle.match(/javascript:(.*?)(?:\)|&quot;|$)/);
          if (match && match[1]) {
            const code = decodeURIComponent(match[1]);
            const rewritten = code.replace(/alert\((.*?)\)/g, 'triggerSimulatedAlert($1)');
            setTimeout(() => {
              try {
                new Function(rewritten)();
              } catch (e) {}
            }, 100);
          }
        }
      }
    } else {
      previewBox.removeAttribute('style');
    }

    // Explicitly scan and evaluate innerHTML injection for mock alert triggers
    executeInjectedPayload('theme-display-title', `Active Theme: ${themeValue}`);
  }
}

// -------------------------------------------------------------
// Code Tabs & Showcases Highlighter
// -------------------------------------------------------------
function toggleCodeTab(section, mode) {
  state.codeTabs[section] = mode;
  
  // Update button tabs UI
  const tabBtnVuln = document.getElementById(`${section}-tab-vuln`);
  const tabBtnSecure = document.getElementById(`${section}-tab-secure`);
  
  if (mode === 'vuln') {
    tabBtnVuln.classList.add('active');
    tabBtnSecure.classList.remove('active');
  } else {
    tabBtnVuln.classList.remove('active');
    tabBtnSecure.classList.add('active');
  }

  // Refresh contents
  if (section === 'reflected') {
    updateReflectedCodeShowcase();
  } else if (section === 'stored') {
    updateStoredCodeShowcase();
  } else if (section === 'dom') {
    updateDOMCodeShowcase();
  }
}

function copyCodeText(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText);
  alert('Code copied to clipboard!');
}

function updateReflectedCodeShowcase() {
  const codeEl = document.getElementById('reflected-code');
  const mode = state.codeTabs.reflected;

  if (mode === 'vuln') {
    codeEl.innerHTML = `
<span class="hl-comment">// VULNERABLE Reflected XSS Endpoint - server.js</span>
app.<span class="hl-function">get</span>(<span class="hl-string">'/api/reflected'</span>, (req, res) => {
  <span class="hl-keyword">const</span> query = req.query.q || <span class="hl-string">''</span>;

  <span class="hl-comment">// VULNERABILITY: Raw input echoed directly to response</span>
  <span class="hl-keyword">return</span> res.json({
    <span class="hl-highlight">query: query</span>,
    status: <span class="hl-string">'Vulnerable'</span>
  });
});
    `;
  } else {
    codeEl.innerHTML = `
<span class="hl-comment">// SECURE Reflected XSS Endpoint - server.js</span>
app.<span class="hl-function">get</span>(<span class="hl-string">'/api/reflected'</span>, (req, res) => {
  <span class="hl-keyword">const</span> query = req.query.q || <span class="hl-string">''</span>;

  <span class="hl-comment">// REMEDIATION: HTML escape standard symbols before reflecting</span>
  <span class="hl-keyword">const</span> securedQuery = <span class="hl-function">escapeHTML</span>(query);

  <span class="hl-keyword">return</span> res.json({
    <span class="hl-secure-bg">query: securedQuery</span>,
    status: <span class="hl-string">'Protected'</span>
  });
});

<span class="hl-comment">// Custom escaping function converting tags to entity literals</span>
<span class="hl-keyword">function</span> <span class="hl-function">escapeHTML</span>(str) {
  <span class="hl-keyword">return</span> str
    .replace(<span class="hl-string">/&amp;/g</span>, <span class="hl-string">'&amp;amp;'</span>)
    .replace(<span class="hl-string">/&lt;/g</span>, <span class="hl-string">'&amp;lt;'</span>)
    .replace(<span class="hl-string">/&gt;/g</span>, <span class="hl-string">'&amp;gt;'</span>)
    .replace(<span class="hl-string">/"/g</span>, <span class="hl-string">'&amp;quot;'</span>)
    .replace(<span class="hl-string">/'/g</span>, <span class="hl-string">'&amp;#x27;'</span>)
    .replace(<span class="hl-string">/\\//g</span>, <span class="hl-string">'&amp;#x2F;'</span>);
}
    `;
  }
}

function updateStoredCodeShowcase() {
  const codeEl = document.getElementById('stored-code');
  const mode = state.codeTabs.stored;

  if (mode === 'vuln') {
    codeEl.innerHTML = `
<span class="hl-comment">// VULNERABLE Guestbook rendering logic - app.js</span>
data.comments.<span class="hl-function">forEach</span>(comment => {
  <span class="hl-keyword">const</span> card = document.<span class="hl-function">createElement</span>(<span class="hl-string">'div'</span>);
  card.className = <span class="hl-string">'comment-card'</span>;
  
  <span class="hl-comment">// VULNERABILITY: Raw stored comment injected directly into innerHTML sink</span>
  <span class="hl-highlight">card.innerHTML</span> = \`
    &lt;div class="meta"&gt;\${comment.author}&lt;/div&gt;
    &lt;div class="body"&gt;\${comment.content}&lt;/div&gt;
  \`;
  
  commentsWall.<span class="hl-function">appendChild</span>(card);
});
    `;
  } else {
    codeEl.innerHTML = `
<span class="hl-comment">// SECURE Guestbook rendering logic - app.js</span>
data.comments.<span class="hl-function">forEach</span>(comment => {
  <span class="hl-keyword">const</span> card = document.<span class="hl-function">createElement</span>(<span class="hl-string">'div'</span>);
  card.className = <span class="hl-string">'comment-card'</span>;

  <span class="hl-comment">// REMEDIATION: Create safe DOM nodes and use safe textContent property</span>
  <span class="hl-keyword">const</span> bodyDiv = document.<span class="hl-function">createElement</span>(<span class="hl-string">'div'</span>);
  bodyDiv.className = <span class="hl-string">'body'</span>;
  <span class="hl-secure-bg">bodyDiv.textContent = comment.content;</span> <span class="hl-comment">// Safely handles tag entities as plain text</span>
  
  card.<span class="hl-function">appendChild</span>(bodyDiv);
  commentsWall.<span class="hl-function">appendChild</span>(card);
});
    `;
  }
}

function updateDOMCodeShowcase() {
  const codeEl = document.getElementById('dom-code');
  const mode = state.codeTabs.dom;

  if (mode === 'vuln') {
    codeEl.innerHTML = `
<span class="hl-comment">// VULNERABLE DOM Hash Parser - app.js</span>
<span class="hl-keyword">const</span> hash = window.location.hash;
<span class="hl-keyword">const</span> themeVal = hash.<span class="hl-function">match</span>(<span class="hl-string">/theme=(.*)/</span>)[<span class="hl-string">1</span>];

<span class="hl-comment">// VULNERABILITY: Unsafely modifying page structure directly via innerHTML sink</span>
<span class="hl-highlight">document.getElementById('theme-title').innerHTML</span> = \`Active: \${themeVal}\`;
    `;
  } else {
    codeEl.innerHTML = `
<span class="hl-comment">// SECURE DOM Hash Parser - app.js</span>
<span class="hl-keyword">const</span> hash = window.location.hash;
<span class="hl-keyword">const</span> themeVal = hash.<span class="hl-function">match</span>(<span class="hl-string">/theme=(.*)/</span>)[<span class="hl-string">1</span>];

<span class="hl-comment">// REMEDIATION: Validate against allowlist and use textContent</span>
<span class="hl-keyword">const</span> allowedThemes = [<span class="hl-string">'light'</span>, <span class="hl-string">'dark'</span>, <span class="hl-string">'cyberpunk'</span>];

<span class="hl-keyword">if</span> (allowedThemes.<span class="hl-function">includes</span>(themeVal)) {
  <span class="hl-comment">// SAFE SINK: textContent prevents HTML entity evaluation/execution</span>
  <span class="hl-secure-bg">document.getElementById('theme-title').textContent</span> = \`Active: \${themeVal}\`;
} <span class="hl-keyword">else</span> {
  document.getElementById(<span class="hl-string">'theme-title'</span>).textContent = <span class="hl-string">'Active: Default Theme'</span>;
}
    `;
  }
}

// -------------------------------------------------------------
// App Bootstrap Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Select main tab
  switchTab('dashboard');
});
