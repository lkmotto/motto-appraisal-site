const express = require('express');
const cors = require('cors');
const handler = require('./tally-apollo').handler;

const app = express();
app.use(cors());
app.use(express.json());

app.post('/tally-apollo', async (req, res) => {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify(req.body),
    headers: req.headers,
  };
  try {
    const result = await handler(event);
    let parsed;
    try {
      parsed = JSON.parse(result.body);
    } catch (e) {
      parsed = null;
    }
    if (parsed !== null) {
      res.status(result.statusCode).json(parsed);
    } else {
      res.status(result.statusCode).type('text/plain').send(result.body);
    }
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`tally-apollo server listening on port ${PORT}`);
});
