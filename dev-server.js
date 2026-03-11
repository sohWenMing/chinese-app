// dev-server.js
// Simple Express server for local API development

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Import API handlers
const validatePassword = require('./api/validate-password').default;
const analyzeHomework = require('./api/analyze-homework').default;

// Wrap handlers for Express
const wrapHandler = (handler) => async (req, res) => {
  const mockReq = {
    method: req.method,
    headers: req.headers,
    body: req.body,
  };
  
  const mockRes = {
    status: (code) => ({
      json: (data) => res.status(code).json(data),
    }),
    json: (data) => res.json(data),
  };
  
  await handler(mockReq, mockRes);
};

// Routes
app.post('/api/validate-password', wrapHandler(validatePassword));
app.post('/api/analyze-homework', wrapHandler(analyzeHomework));

app.listen(PORT, () => {
  console.log(`🚀 Dev API server running on http://localhost:${PORT}`);
});
