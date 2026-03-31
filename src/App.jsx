import { useState, useEffect } from 'react'
import { getKnowledgeBases } from './services/api'
import useChat from './hooks/useChat'
import URLInput from './components/URLInput'
import ChatWindow from './components/ChatWindow'
import ChatInput from './components/ChatInput'
import './App.css'

function App() {
  const [knowledgeBase, setKnowledgeBase] = useState(null)
  const [knowledgeBases, setKnowledgeBases] = useState([])

  const { messages, isStreaming, error, send, clear } = useChat(knowledgeBase?.id)

  useEffect(() => {
    getKnowledgeBases()
      .then(setKnowledgeBases)
      .catch(() => {})
  }, [])

  function handleCrawlComplete(data) {
    setKnowledgeBase(data)
    setKnowledgeBases((prev) => {
      const without = prev.filter((kb) => kb.id !== data.id)
      return [data, ...without]
    })
  }

  function selectKnowledgeBase(kb) {
    if (kb.id !== knowledgeBase?.id) {
      clear()
      setKnowledgeBase(kb)
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Spot Support</h1>
        </div>
        <div className="sidebar-content">
          {knowledgeBases.length === 0 ? (
            <p className="sidebar-hint">
              Index a website to get started
            </p>
          ) : (
            <div className="kb-list">
              <p className="kb-list-label">Knowledge Bases</p>
              {knowledgeBases.map((kb) => (
                <button
                  key={kb.id}
                  className={`kb-item ${knowledgeBase?.id === kb.id ? 'active' : ''}`}
                  onClick={() => selectKnowledgeBase(kb)}
                >
                  <span className="kb-item-url">{kb.url}</span>
                  <span className="kb-item-meta">
                    {kb.pageCount} page{kb.pageCount !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <URLInput onCrawlComplete={handleCrawlComplete} />
          {knowledgeBase && (
            <div className="kb-badge">
              Using: <strong>{knowledgeBase.url}</strong>
              &nbsp;&middot;&nbsp;{knowledgeBase.pageCount} page
              {knowledgeBase.pageCount !== 1 ? 's' : ''} indexed
            </div>
          )}
        </header>

        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h2>Welcome to Spot Support</h2>
              <p>
                {knowledgeBase
                  ? 'Your knowledge base is ready. Start asking questions below.'
                  : 'Index a website above, then ask questions about it.'}
              </p>
            </div>
          ) : (
            <ChatWindow messages={messages} isStreaming={isStreaming} />
          )}
          {error && <p className="chat-error">{error}</p>}
        </div>

        <footer className="input-area">
          <ChatInput
            onSend={send}
            disabled={!knowledgeBase}
            isStreaming={isStreaming}
          />
        </footer>
      </main>
    </div>
  )
}

export default App
