import express from 'express';
import registerHandler from './api/users/register.js';

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/users/register', (req, res) => {
  return registerHandler(req, res);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Local API server running on http://localhost:${port}`);
}); 