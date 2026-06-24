# Akhil XSS Playground

An interactive, educational security sandbox demonstrating Reflected, Stored, and DOM-based Cross-Site Scripting (XSS) vulnerabilities, complete with side-by-side code comparisons and prevention mechanisms. 

The application is styled with a premium Cyberpunk-inspired dark glassmorphism aesthetic and is fully responsive across desktop, tablet, and mobile viewports.

---

## 🚀 Key Features

* **3 Interactive XSS Laboratories**:
  * **Reflected XSS Sandbox**: Demonstrates how input parameters from HTTP queries are echoed back. Features preset payloads and a toggle to test server-side HTML entity escaping.
  * **Stored XSS Guestbook**: Shows how persistent data entries are saved in memory and executed for all subsequent visitors. Toggle client-side safe DOM text-rendering (`textContent`).
  * **DOM-based XSS Theme Customizer**: Demonstrates client-side logic reading from URL hashes (`#theme=...`) and feeding them directly to execution sinks. Toggle input validation against strict theme allowlists.
* **Safety Sandbox Interception**: Intercepts standard browser `window.alert` calls globally, redirecting them to a custom cyberpunk alert modal. This prevents browser locks and provides an immersive sandbox warning.
* **Responsive Design**: Adapts seamlessly to laptops, tablets, and mobiles. Smaller viewports collapse to a slide-over navigation drawer toggleable via a hamburger top header with a blur backdrop overlay.
* **Dynamic Port Allocation**: Backend checks port availability on startup and increments the port number automatically if `3000` is occupied, avoiding EADDRINUSE server crashes.
* **Prevention Guide**: Educational section explaining context-aware encoding, safe client-side sinks, and Content Security Policy (CSP) header configurations.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express
* **Frontend**: Vanilla HTML5, CSS3, ES6 JavaScript (No heavyweight frameworks or compiler steps needed)
* **Testing**: JSDOM (for headful script and event validation in tests)
* **Typography**: Google Fonts (Inter, JetBrains Mono)

---

## 📂 Project Structure

```text
├── public/                 # Static assets served by Express
│   ├── index.html          # Main layout container and tab panels (Zero inline JS)
│   ├── styles.css          # Responsive styling, Cyberpunk theme, syntax highlighting
│   └── app.js              # Application state, event bindings, and sandbox logic
├── package.json            # Node configuration, scripts, and dependencies
├── server.js               # Express server, dynamic port scanner, and API endpoints
├── test_jsdom.js           # Automated virtual DOM event integration tests
└── README.md               # You are here
```

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have Node.js (v14 or higher) installed on your system.

### 1. Installation
Clone or navigate to the project directory and install the required packages (`express` and `jsdom`):
```bash
npm install
```

### 2. Start the Local Server
Launch the server via npm scripts or node directly:
```bash
npm start
# OR: node server.js
```

Upon start, the server will check for port availability:
```text
==================================================
  Akhil XSS Playground Server started on port 3000
  Access the site via http://localhost:3000
==================================================
```
*Note: If port 3000 is occupied (e.g. by a zombie process), the server will automatically scan and bind to the next open port (3001, 3002, etc.).*

### 3. Open in Browser
Navigate to the logged URL in your web browser:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Testing

The repository contains an automated integration test using JSDOM to verify navigation, script execution hooks, and routing behavior:
```bash
node test_jsdom.js
```

Upon success, you will see the virtual DOM navigation trace log:
```text
Checking if switchTab is defined:  function
Clicking button...
Current active tab:  tab-reflected
```

---

## 🔒 Security Notice
This application deliberately exposes XSS vulnerabilities for educational learning and demonstration purposes. It is configured to bind strictly to localhost and should not be deployed to public production environments.
