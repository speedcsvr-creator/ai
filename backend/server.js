// backend/server.js
import express from 'express';
import fetch from 'node-fetch'; // node 18+ ma globalne fetch; jeśli używasz starego node -> npm i node-fetch
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('⚠️ Missing OPENAI_API_KEY in environment. Add it to .env file.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body; // expect array of { role, content }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be array' });
    }

    const payload = {
      model: 'gpt-4o-mini', // zmień jeśli chcesz inny model
      messages,
      max_tokens: 1200,
      temperature: 0.2,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenAI error', response.status, text);
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    // Forward the OpenAI response directly to the frontend
    res.json(data);
  } catch (err) {
    console.error('Server error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});
