import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import reasoningRouter from './routes/reasoning';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check route
app.use('/api/health', healthRouter);

// Reasoning AI routes
app.use('/api/reason', reasoningRouter);

app.get('/', (req, res) => {
  res.send('Application Reasoning API is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
