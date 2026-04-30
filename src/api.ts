import express, { Request, Response } from 'express';

const app = express();
const PORT = 4002;

app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4001');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({ status: 'ok', agent: 'front-agent', timestamp: new Date().toISOString() });
});

app.post('/api/echo', (req: Request, res: Response) => {
  res.json({ echo: req.body, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`API server running at http://localhost:${PORT}`));
