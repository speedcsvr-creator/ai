/*
README / INSTRUCTIONS (IMPORTANT - Read first)

1) SECURITY WARNING: You pasted an OpenAI API key into chat. DO NOT paste API keys in public chat. Revoke that key immediately in your OpenAI dashboard and create a new key. Use the new key only in your server environment variables.

How to rotate key:
 - Go to https://platform.openai.com/account/api-keys
 - Revoke the exposed key
 - Create a new secret key
 - Save it to your server environment as OPENAI_API_KEY

2) This file contains two parts:
 - A beautiful React component (default export) that is a modern chat UI using Tailwind classes.
 - A sample Node.js / Express backend (provided below inside comments) that safely proxies requests to OpenAI using the API key from environment variables. **Run the backend on Vercel/Render/Railway or locally** and set the env var OPENAI_API_KEY there.

3) How it works (high level):
 - Frontend sends POST /api/chat { messages } to your backend
 - Backend calls OpenAI Chat Completions (or responses) with the API key and returns model reply
 - Frontend displays messages, code blocks, and has a polished UI for developer answers

4) Deployment tips:
 - Host frontend on Vercel/Netlify/GitHub Pages
 - Host backend on Vercel (serverless), Render, or Railway and set OPENAI_API_KEY env var
 - Do NOT embed the API key in frontend code

------------------------------------------------------------------------------
SAMPLE BACKEND (Node.js + Express) - save as server.js and deploy. Do NOT paste your key here.

// server.js
/*
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body; // expect array of { role, content }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1200,
        temperature: 0.2,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
*/

/*
Note: On Vercel, create an API route or use serverless functions. On Render/Railway, deploy this as a small service.

------------------------------------------------------------------------------
FRONTEND (React component) - Paste this React component in your app. It uses Tailwind utility classes.
Be sure your app includes Tailwind CSS. If not, you can still use the inline classes or adapt to plain CSS.
*/

import React, { useEffect, useState, useRef } from 'react';

export default function RobloxDevChat() {
  const [messages, setMessages] = useState([
    { id: 0, role: 'system', content: 'You are a helpful Roblox developer assistant. Provide clear step-by-step instructions and Lua code. When presenting code, use fenced code blocks and label where each script should go (LocalScript/ServerScript/ModuleScript and service location). Keep answers concise and include testing steps.' },
    { id: 1, role: 'assistant', content: 'Witaj! Jestem Twoim Roblox Dev AI. Opisz mechanikę, nad którą pracujesz, np. "combat system" lub "leaderboard". Mogę generować kod, wskazać gdzie wkleić skrypty oraz zaproponować testy.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const bottomRef = useRef(null);

  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function appendMessage(role, content) {
    setMessages(prev => [...prev, { id: Date.now(), role, content }]);
  }

  function formatMsg(msg) {
    if (msg.role === 'assistant') return { label: 'AI', color: 'bg-gray-800', align: 'start' };
    if (msg.role === 'user') return { label: 'You', color: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white', align: 'end' };
    return { label: 'System', color: 'bg-yellow-500', align: 'center' };
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    appendMessage('user', trimmed);
    setInput('');
    setIsLoading(true);

    // Build messages to send to backend
    const payload = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));
    payload.push({ role: 'user', content: trimmed });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: 'You are an expert Roblox developer assistant. Answer clearly, include Lua code blocks, and always state script type and service location.' }, ...payload] })
      });
      const data = await res.json();

      // OpenAI's response structure
      const aiContent = (data?.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || data?.output || JSON.stringify(data);

      appendMessage('assistant', aiContent);
    } catch (err) {
      console.error(err);
      appendMessage('assistant', 'Wystąpił błąd przy komunikacji z serwerem.');
    } finally {
      setIsLoading(false);
    }
  }

  function renderMessageContent(text) {
    // Basic code block highlighting: split by ``` and render code blocks separately
    const parts = text.split(/```/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // code block
        return (
          <pre key={i} className="bg-black bg-opacity-60 p-4 rounded-md overflow-x-auto text-sm font-mono">{part}</pre>
        );
      }
      // normal text - handle newlines
      return <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</div>;
    });
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg"> 
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="white"/></svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Roblox Dev AI</h1>
            <p className="text-sm text-gray-400">Generate Lua scripts, placement info, and testing steps.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setMessages([messages[0]]); }} className="px-3 py-2 rounded-md bg-gray-700 text-sm">Reset</button>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="px-3 py-2 rounded-md bg-gray-700 text-sm">Toggle Theme</button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col bg-gradient-to-tr from-gray-900/40 to-gray-800/30 rounded-2xl p-6 shadow-xl">

          <div className="flex-1 overflow-auto" id="chatArea">
            <div className="flex flex-col gap-4">
              {messages.filter(m => m.role !== 'system').map(msg => {
                const meta = formatMsg(msg);
                return (
                  <div key={msg.id} className={`flex ${meta.align === 'end' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`msg-container max-w-3/4`}> 
                      <div className={`text-xs mb-1 ${meta.align === 'end' ? 'text-right text-gray-300' : 'text-left text-gray-400'}`}>{meta.label}</div>

                      <div className={`p-4 rounded-xl ${meta.align === 'end' ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={2}
                className="flex-1 p-3 rounded-xl bg-gray-900 border border-gray-700 resize-none text-sm"
                placeholder="Describe the mechanic you want (e.g. 'combat system with NPCs and leaderboard')"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(); }}
              />
              <div className="flex flex-col gap-2">
                <button onClick={handleSend} className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600">{isLoading ? 'Thinking...' : 'Send'}</button>
                <button onClick={() => { setInput(''); }} className="px-3 py-1 rounded-md bg-gray-700 text-xs">Clear</button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400 flex items-center justify-between">
              <div>Tip: Press <span className="px-2 py-1 bg-gray-800 rounded">Ctrl/Cmd + Enter</span> to send.</div>
              <div>Model: <span className="font-medium">gpt-4o-mini</span></div>
            </div>
          </div>

        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-3">Built for Roblox developers • Keep your API key on the server only</footer>
    </div>
  );
}
