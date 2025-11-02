// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';

const initialSystem = {
  role: 'system',
  content: 'You are a helpful Roblox developer assistant. Provide clear Lua code and placement instructions.',
};

export default function App() {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Nowy czat', messages: [initialSystem, { role: 'assistant', content: 'Witaj! Opisz mechanikę, nad którą pracujesz.' }] }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeId);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  function newConversation() {
    const id = Date.now();
    const conv = { id, title: 'Nowy czat', messages: [initialSystem] };
    setConversations(prev => [conv, ...prev]);
    setActiveId(id);
  }

  function updateActiveMessages(newMessages) {
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: newMessages } : c)));
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...activeConv.messages, userMsg];
    updateActiveMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // send messages (including system) to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      // read content from response
      const aiContent = data?.choices?.[0]?.message?.content ?? 'Brak odpowiedzi od modelu.';
      const assistantMsg = { role: 'assistant', content: aiContent };
      updateActiveMessages([...newMessages, assistantMsg]);
    } catch (err) {
      console.error(err);
      updateActiveMessages([...newMessages, { role: 'assistant', content: 'Wystąpił błąd przy łączeniu z serwerem.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  function renderContent(text) {
    const parts = text.split(/```/g);
    return parts.map((p, i) => i % 2 === 1
      ? <pre key={i} className="code-block"><code>{p}</code></pre>
      : <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{p}</div>
    );
  }

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h1 className="brand">Roblox Dev AI</h1>
          <button className="new-chat-btn" onClick={newConversation}>+ Nowy czat</button>
        </div>

        <div className="conversations">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${conv.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(conv.id)}
            >
              <div className="conv-title">{conv.title}</div>
              <div className="conv-preview">{(conv.messages[conv.messages.length - 1]?.content || '').slice(0, 60)}</div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">Keep API key on server only</div>
      </aside>

      <main className="main">
        <div className="main-header">
          <div className="header-left">
            <h2>{activeConv?.title || 'Brak'}</h2>
          </div>
          <div className="header-right">
            <select className="model-select" defaultValue="gpt-4o-mini" disabled>
              <option>gpt-4o-mini</option>
            </select>
          </div>
        </div>

        <div className="chat-area">
          {activeConv?.messages?.filter(m => m.role !== 'system')?.map((m, idx) => (
            <div key={idx} className={`chat-row ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="avatar">{m.role === 'user' ? 'U' : 'AI'}</div>
              <div className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                {renderContent(m.content)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napisz wiadomość..."
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage(); }}
          />
          <div className="composer-actions">
            <button className="send-btn" onClick={sendMessage} disabled={isLoading}>{isLoading ? '...' : 'Wyślij'}</button>
          </div>
        </div>
      </main>
    </div>
  );
}
