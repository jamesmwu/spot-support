import { useState, useCallback, useRef } from 'react'
import { sendMessage, saveChatSession } from '../services/api'

export default function useChat(knowledgeBaseId) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const send = useCallback(
    async (prompt) => {
      if (!prompt.trim() || isStreaming) return

      setError(null)

      const userMsg = { role: 'user', content: prompt }
      const assistantMsg = { role: 'assistant', content: '' }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      let streamed = false

      try {
        const res = await sendMessage(
          prompt,
          knowledgeBaseId,
          messages.concat(userMsg).map(({ role, content }) => ({ role, content })),
          controller.signal,
        )

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (!line.startsWith('data: ') || line === 'data: [DONE]') continue

            const payload = JSON.parse(line.slice(6))

            if (payload.error) {
              setError(payload.error)
              break
            }

            streamed = true
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              updated[updated.length - 1] = {
                ...last,
                content: last.content + payload.content,
              }
              return updated
            })
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null

        if (streamed && knowledgeBaseId) {
          saveChatSession({
            id: knowledgeBaseId,
            knowledgeBaseId,
            messages: messagesRef.current,
          }).catch(() => {})
        }
      }
    },
    [knowledgeBaseId, isStreaming, messages],
  )

  const loadMessages = useCallback((msgs) => {
    setMessages(msgs)
    setError(null)
  }, [])

  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setError(null)
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, error, send, clear, loadMessages }
}
