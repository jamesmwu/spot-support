import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === 'user'

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        {content ? (
          isUser ? content : <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          isStreaming && <span className="cursor-blink" />
        )}
      </div>
    </div>
  )
}
