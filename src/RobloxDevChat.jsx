import React, { useEffect, useState, useRef } from 'react';

export default function MegaChatAI() {
  const [messages, setMessages] = useState([
    { id: 0, role: 'system', content: 'You are a helpful Roblox developer assistant. Provide clear step-by-step instructions and Lua code.' },
    { id: 1, role: 'assistant', content: 'Witaj! Jestem Twoim Roblox Dev AI. Opisz mechanikę, nad którą pracujesz.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function appendMessage(role, content) {
    setMessages(prev => [...prev, { id: Date.now(), role, content }]);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    appendMessage('user', trimmed);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: 'You are an expert Roblox developer assistant. Answer clearly, include Lua code blocks.' }, ...messages.filter(m => m.role !== 'system'), { role: 'user', content: trimmed }] })
      });
      const data = await res.json();
      const aiContent = (data?.choices && data.choices[0]?.message?.content) || 'Error: no response';
      appendMessage('assistant', aiContent);
    } catch (err) {
      console.error(err);
      appendMessage('assistant', 'Wystąpił błąd przy komunikacji z serwerem.');
    } finally {
      setIsLoading(false);
    }
  }

  function renderMessageContent(text) {
    const parts = text.split(/```/g);
    return parts.map((part, i) => i % 2 === 1
      ? <pre key={i} className="bg-black bg-opacity-70 p-4 rounded-md overflow-x-auto text-sm font-mono my-2">{part}</pre>
      : <div key={i} style={{ whiteSpace: 'pre-wrap', margin: '0.25rem 0' }}>{part}</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-700 p-4">
      <div className="w-full max-w-2xl flex flex-col rounded-3xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Mega Roblox Dev AI</h1>
              <p className="text-sm text-white/80">Generuje Lua code, placement info i testy</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMessages([messages[0]])} className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-sm">Reset</button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.filter(m => m.role !== 'system').map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-3/4 shadow-md animate-fade ${isUser ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-none' : 'bg-white/20 text-white rounded-bl-none'}`}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 bg-white/10 backdrop-blur-md flex gap-3 items-center border-t border-white/20">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            className="flex-1 p-3 rounded-2xl bg-white/20 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Opisz mechanikę np. 'combat system z leaderboard'"
            onKeyDown={e => { if(e.key==='Enter' && (e.ctrlKey || e.metaKey)) handleSend(); }}
          />
          <button onClick={handleSend} className="px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold">{isLoading ? 'Thinking...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
