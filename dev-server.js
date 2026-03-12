// dev-server.js
// Simple Express server for local API development

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Import API handlers
import validatePasswordModule from './api/validate-password.js';
import analyzeHomeworkModule from './api/analyze-homework.js';

const validatePassword = validatePasswordModule.default || validatePasswordModule;
const analyzeHomework = analyzeHomeworkModule.default || analyzeHomeworkModule;

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