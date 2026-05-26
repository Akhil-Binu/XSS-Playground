const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing URL-encoded and JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to prevent caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Handle favicon to prevent 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

// In-memory data store for Stored XSS demonstration
let comments = [
  {
    id: 1,
    author: 'Alice',
    content: 'Welcome to the guestbook! Try posting some feedback.',
    timestamp: new Date(Date.now() - 3600000).toLocaleString()
  },
  {
    id: 2,
    author: 'Bob',
    content: 'Love this simple interface! Very responsive.',
    timestamp: new Date(Date.now() - 1800000).toLocaleString()
  }
];

// Helper to escape HTML characters (Reflected XSS Prevention)
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Helper to sanitize HTML tags completely (Alternative Reflected/Stored XSS Prevention)
function stripHTML(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

// -------------------------------------------------------------
// Reflected XSS Endpoint
// -------------------------------------------------------------
app.get('/api/reflected', (req, res) => {
  const query = req.query.q || '';
  const secure = req.query.secure === 'true';

  if (secure) {
    // Return HTML-encoded string to prevent XSS execution
    return res.json({
      query: escapeHTML(query),
      rawQuery: query,
      status: 'Protected',
      methodDescription: 'Passed through custom HTML escaping filter (converting <, >, ", \', / to HTML entities)'
    });
  } else {
    // Return raw input back to client directly
    return res.json({
      query: query,
      rawQuery: query,
      status: 'Vulnerable',
      methodDescription: 'Direct reflection of parameter values without validation, sanitization, or encoding'
    });
  }
});

// -------------------------------------------------------------
// Stored XSS Endpoints
// -------------------------------------------------------------
app.get('/api/comments', (req, res) => {
  const secure = req.query.secure === 'true';

  // Apply mitigation if secure mode is enabled
  const processedComments = comments.map(c => {
    return {
      ...c,
      content: secure ? escapeHTML(c.content) : c.content,
      author: secure ? escapeHTML(c.author) : c.author
    };
  });

  res.json({
    comments: processedComments,
    status: secure ? 'Protected' : 'Vulnerable'
  });
});

app.post('/api/comments', (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: 'Author and content are required' });
  }

  const newComment = {
    id: comments.length + 1,
    author: author.substring(0, 100),
    content: content.substring(0, 1000), // Limit size, but allow raw injection
    timestamp: new Date().toLocaleString()
  };

  comments.push(newComment);

  res.status(201).json({
    message: 'Comment added successfully',
    comment: newComment
  });
});

app.post('/api/comments/reset', (req, res) => {
  comments = [
    {
      id: 1,
      author: 'Alice',
      content: 'Welcome to the guestbook! Try posting some feedback.',
      timestamp: new Date(Date.now() - 3600000).toLocaleString()
    },
    {
      id: 2,
      author: 'Bob',
      content: 'Love this simple interface! Very responsive.',
      timestamp: new Date(Date.now() - 1800000).toLocaleString()
    }
  ];
  res.json({ message: 'Database reset successful', comments });
});

// Dynamic Port binding to prevent crash loops when EADDRINUSE
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`==================================================`);
    console.log(`  Akhil XSS Playground Server started on port ${port}`);
    console.log(`  Access the site via http://localhost:${port}`);
    console.log(`==================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use. Attempting next port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Fatal Server Error:', err);
    }
  });
}

startServer(PORT);
