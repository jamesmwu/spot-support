import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, disabled, isStreaming }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isStreaming && !disabled) {
      inputRef.current?.focus()
    }
  }, [isStreaming, disabled])

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim() || disabled || isStreaming) return
    onSend(value.trim())
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="input-row" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        className="chat-input"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Index a website first...' : 'Ask a question...'}
        disabled={disabled || isStreaming}
      />
      <button
        type="submit"
        className="send-btn"
        disabled={disabled || isStreaming || !value.trim()}
      >
        {isStreaming ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
