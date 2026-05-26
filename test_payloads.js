const { JSDOM } = require('jsdom');

const payloads = [
  "<img src=x onerror=alert('Stored XSS Executed!')>",
  "<img src=x onerror=alert(`Image Error Exploit`)>",
  "<img src=x onerror=alert(1)>",
  "<img src=\"x\" onerror=\"alert('Hello) onerror=alert('Error!')\">", // DevTools example
  "<img src=\"x\" onerror=alert('Hello) onerror=\"alert(1)\">"
];

for (const p of payloads) {
  console.log("Testing:", p);
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="d"></div></body></html>`, { runScripts: "dangerously" });
  const div = dom.window.document.getElementById('d');
  
  // Attach a global error handler
  dom.window.onerror = (msg) => {
    console.log("Caught native error:", msg);
  };
  
  try {
    div.innerHTML = p;
  } catch (e) {
    console.log("Caught sync error:", e);
  }
}
