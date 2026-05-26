const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function runTest() {
  const html = fs.readFileSync('public/index.html', 'utf8');
  const dom = new JSDOM(html, { 
    runScripts: "dangerously"
  });

  // Provide mock fetch for API calls
  dom.window.fetch = async (url) => {
    return {
      json: async () => ({ query: 'mock', comments: [] }),
      ok: true
    };
  };

  // Evaluate the app.js script directly in the JSDOM environment
  const appScript = fs.readFileSync('public/app.js', 'utf8');
  dom.window.eval(appScript);

  // Wait for scripts to load
  await new Promise(r => setTimeout(r, 1000));

  console.log("Checking if switchTab is defined: ", typeof dom.window.switchTab);
  
  try {
    const btn = dom.window.document.querySelector('[data-tab="reflected"]');
    console.log("Clicking button...");
    btn.click();
    console.log("Current active tab: ", dom.window.document.querySelector('.tab-content.active').id);
  } catch(e) {
    console.error("Error during click: ", e);
  }
}

runTest();
