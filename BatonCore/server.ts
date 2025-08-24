import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { executeWebTask } from './web-automation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'BatonCore API is running' });
});

// Main automation endpoint
app.post('/api/execute', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid prompt. Please provide a string prompt in the request body.'
      });
    }

    console.log(`🧠 Processing request: "${prompt}"`);
    
    // Execute the web automation task
    const result = await executeWebTask(prompt);
    
    res.json({
      success: true,
      prompt,
      result
    });
    
  } catch (error) {
    console.error('❌ Automation error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      prompt: req.body.prompt || null
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BatonCore API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Automation endpoint: POST http://localhost:${PORT}/api/execute`);
  console.log(`📝 Send requests with: { "prompt": "your automation request" }`);
});



export default app;
