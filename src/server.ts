import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT ?? 4001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({ status: 'ok', agent: 'front-agent', timestamp: new Date().toISOString() });
});

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}`);
});
