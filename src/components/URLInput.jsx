import { useState } from 'react'
import { crawlWebsite } from '../services/api'

export default function URLInput({ onCrawlComplete, disabled }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await crawlWebsite(url.trim())
      onCrawlComplete?.(data)
      setUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="url-input" onSubmit={handleSubmit}>
      <div className="url-input-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          disabled={loading || disabled}
          className="url-field"
        />
        <button
          type="submit"
          disabled={loading || !url.trim() || disabled}
          className="url-btn"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Indexing&hellip;
            </>
          ) : (
            'Index Site'
          )}
        </button>
      </div>
      {error && <p className="url-error">{error}</p>}
    </form>
  )
}
