import { useState } from 'react'
import yaml from 'js-yaml'
import Fuse from 'fuse.js'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [yamlContent, setYamlContent] = useState('')
  const [yamlEntries, setYamlEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Convert GitHub URL to raw URL if needed
  const convertToRawUrl = (inputUrl) => {
    if (inputUrl.includes('raw.githubusercontent.com')) {
      return inputUrl
    }
    if (inputUrl.includes('github.com') && inputUrl.includes('/blob/')) {
      return inputUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
    }
    return inputUrl
  }

  // Parse YAML and extract all paths with their values and line numbers
  const parseYamlToEntries = (content) => {
    const lines = content.split('\n')
    const entries = []

    const traverse = (obj, path = [], startLine = 0) => {
      if (obj === null || obj === undefined) return

      if (typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
          const currentPath = [...path, key]
          const pathString = currentPath.join('.')

          // Find the line number for this key
          let lineNumber = startLine
          for (let i = startLine; i < lines.length; i++) {
            const line = lines[i]
            const indent = line.search(/\S/)
            if (indent >= 0 && line.trim().startsWith(key + ':')) {
              lineNumber = i
              break
            }
          }

          const value = obj[key]
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            traverse(value, currentPath, lineNumber)
          } else {
            entries.push({
              path: pathString,
              value: value,
              lineNumber: lineNumber,
              key: key
            })
          }
        })
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const currentPath = [...path, `[${index}]`]
          const pathString = currentPath.join('.')
          entries.push({
            path: pathString,
            value: item,
            lineNumber: startLine,
            key: `[${index}]`
          })
        })
      }
    }

    try {
      const parsed = yaml.load(content)
      traverse(parsed)
      return entries
    } catch (err) {
      throw new Error('Invalid YAML format')
    }
  }

  // Load YAML from URL
  const handleLoadYaml = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const rawUrl = convertToRawUrl(url)
      const response = await fetch(rawUrl)

      if (!response.ok) {
        throw new Error('Failed to fetch the file')
      }

      const content = await response.text()
      setYamlContent(content)

      const entries = parseYamlToEntries(content)
      setYamlEntries(entries)
      setError('')
      setSearchTerm('')
      setSearchResults([])
    } catch (err) {
      setError(err.message)
      setYamlContent('')
      setYamlEntries([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term)

    if (!term.trim() || yamlEntries.length === 0) {
      setSearchResults([])
      return
    }

    const fuse = new Fuse(yamlEntries, {
      keys: ['path', 'key'],
      threshold: 0.4,
      includeScore: true
    })

    const results = fuse.search(term)
    setSearchResults(results.map(r => r.item))
  }

  // Get context lines around a specific line
  const getContextLines = (lineNumber, contextSize = 4) => {
    const lines = yamlContent.split('\n')
    const start = Math.max(0, lineNumber - contextSize)
    const end = Math.min(lines.length - 1, lineNumber + contextSize)

    const contextLines = []
    for (let i = start; i <= end; i++) {
      contextLines.push({
        lineNumber: i + 1,
        content: lines[i],
        isTarget: i === lineNumber
      })
    }

    return contextLines
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Yamler</h1>
          <p>Helm Values Explorer</p>
        </header>

        <div className="url-input-section">
          <input
            type="text"
            className="url-input"
            placeholder="Enter GitHub URL or raw URL to values.yaml file..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLoadYaml()}
          />
          <button
            className="load-button"
            onClick={handleLoadYaml}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {yamlEntries.length > 0 && !error && (
          <div className="success-message">
            YAML loaded successfully ({yamlEntries.length} entries found)
          </div>
        )}

        {yamlEntries.length > 0 && (
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="Search for values (e.g., 'webhook replicas')..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="results-section">
            <h3>Found {searchResults.length} result(s)</h3>
            {searchResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-path">
                  {result.path}
                </div>
                <pre className="result-code">
                  {getContextLines(result.lineNumber).map((line, i) => (
                    <div
                      key={i}
                      className={line.isTarget ? 'code-line highlight' : 'code-line'}
                    >
                      <span className="line-number">{line.lineNumber}</span>
                      <span className="line-content">{line.content}</span>
                    </div>
                  ))}
                </pre>
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && yamlEntries.length > 0 && (
          <div className="no-results">
            No results found for "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  )
}

export default App
