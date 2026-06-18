import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import templatesRouter from './routes/templates.js';
import layoutsRouter from './routes/layouts.js';
import labelsRouter from './routes/labels.js';
import printJobsRouter from './routes/printJobs.js';
import settingsRouter from './routes/settings.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/templates', templatesRouter);
app.use('/api/layouts', layoutsRouter);
app.use('/api/labels', labelsRouter);
app.use('/api/print-jobs', printJobsRouter);
app.use('/api/settings', settingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDatabase(config.mongoUri);
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
