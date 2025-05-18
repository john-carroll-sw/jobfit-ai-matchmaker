import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import reasoningRouter from './routes/reasoning';
import resumeMatchingRouter from './routes/resumeMatchingRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased payload limit for resume data

// Health check route
app.use('/api/health', healthRouter);

// Reasoning AI routes
app.use('/api/reason', reasoningRouter);

// Resume Matching routes (industry-agnostic interface)
app.use('/api/resume-matching', resumeMatchingRouter);

// Log startup information
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Azure OpenAI Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
console.log(`Azure Search Endpoint: ${process.env.AZURE_SEARCH_ENDPOINT}`);
console.log(`Azure Search Index: ${process.env.AZURE_SEARCH_INDEX || 'vector-index'}`);

app.get('/', (req, res) => {
  res.send('Application Reasoning API is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
