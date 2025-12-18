import React, { useState, useCallback, useEffect } from 'react';
import './App.css'; // Import the CSS file for styling

const App = () => {
  const [inputUrls, setInputUrls] = useState('');
  const [selectedCleanup, setSelectedCleanup] = useState('keepFullUrl'); // Default to "Don't change anything."
  const [selectedMatching, setSelectedMatching] = useState('strict');
  const [outputRegex, setOutputRegex] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const cleanupOptions = [
    { label: "Don't change anything.", value: "keepFullUrl" },
    {
      description: "Remove Scheme",
      label: "http://www.example.com/category/product",
      value: "removeScheme",
      prefix: "http://",
      remaining: "www.example.com/category/product"
    },
    {
      description: "Remove Scheme & Subdomain",
      label: "http://www.example.com/category/product",
      value: "removeSchemeSubdomain",
      prefix: "http://www.",
      remaining: "example.com/category/product"
    },
    {
      description: "Remove Scheme, Subdomain, Domain",
      label: "http://www.example.com/category/product",
      value: "removeSchemeSubdomainDomain",
      prefix: "http://www.example.com",
      remaining: "/category/product"
    },
    {
      description: "Remove Scheme, Sub, Dom, Trailing Slash",
      label: "http://www.example.com/category/product",
      value: "removeSchemeSubdomainDomainSlash",
      prefix: "http://www.example.com/",
      remaining: "category/product"
    },
  ];

  const matchingOptions = [
    { label: "Wildcard (e.g., /path/to/page.*)", value: "wildcard" },
    { label: "Strict (e.g., /path/to/page$)", value: "strict" },
  ];

  const processUrls = useCallback(() => {
    setCopyStatus(''); // Clear previous copy status
    const urls = inputUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);

    const processedUrls = urls.map(url => {
      let cleaned = url;

      if (selectedCleanup !== 'keepFullUrl') {
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

          if (selectedCleanup === 'removeScheme') {
            cleaned = url.replace(/^https?:\/\//, '');
          } else if (selectedCleanup === 'removeSchemeSubdomain') {
            cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
          } else if (selectedCleanup === 'removeSchemeSubdomainDomain') {
            cleaned = urlObj.pathname + urlObj.search + urlObj.hash;
          } else if (selectedCleanup === 'removeSchemeSubdomainDomainSlash') {
            const fullPath = urlObj.pathname + urlObj.search + urlObj.hash;
            cleaned = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
          }
        } catch (error) {
          // Fallback if URL is invalid
          cleaned = url;
        }
      }

      if (selectedMatching === 'wildcard') {
        return cleaned + '.*';
      } else if (selectedMatching === 'strict') {
        return cleaned + '$';
      }
      return cleaned;
    });

    const finalOutput = processedUrls.join('|');
    setOutputRegex(finalOutput);

    if (finalOutput) {
      navigator.clipboard.writeText(finalOutput).then(() => {
        setCopyStatus('Output automatically copied to clipboard!');
      }).catch(err => {
        setCopyStatus('Failed to copy output to clipboard: ' + err);
      });
    } else {
      setCopyStatus('No URLs to process or output is empty.');
    }
  }, [inputUrls, selectedCleanup, selectedMatching]);

  // Effect to automatically process when input or options change
  useEffect(() => {
    if (inputUrls.trim().length > 0) {
      processUrls();
    } else {
      setOutputRegex('');
      setCopyStatus('');
    }
  }, [inputUrls, selectedCleanup, selectedMatching, processUrls]);


  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Regex Concatenation Tool</h1>
      </header>

      <div className="tool-card">
        <div className="options-section">
          <div className="option-group">
            <h2>URL Clean-Up Options</h2>
            {cleanupOptions.map((option) => (
              <label key={option.value} className="radio-label">
                <input
                  type="radio"
                  name="cleanupOption"
                  value={option.value}
                  checked={selectedCleanup === option.value}
                  onChange={(e) => setSelectedCleanup(e.target.value)}
                />
                {option.prefix ? (
                  <span className="option-label-container">
                    <span className="option-description">{option.description}.</span>
                    {/* <span className="url-example">
                      <span className="removed-part">{option.prefix}</span>
                      <span className="remaining-part">{option.remaining}</span>
                    </span> */}
                  </span>
                ) : (
                  option.label
                )}
              </label>
            ))}
          </div>

          <div className="option-group">
            <h2>Regex Matching Options</h2>
            {matchingOptions.map((option) => (
              <label key={option.value} className="radio-label">
                <input
                  type="radio"
                  name="matchingOption"
                  value={option.value}
                  checked={selectedMatching === option.value}
                  onChange={(e) => setSelectedMatching(e.target.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="input-section">
          <h2>Input your list of URLs</h2>
          <p>One URL per line.</p>
          <textarea
            className="url-textarea"
            placeholder="Paste URLs here..."
            value={inputUrls}
            onChange={(e) => setInputUrls(e.target.value)}
            rows="10"
          ></textarea>
        </div>

        <button onClick={processUrls} className="process-button">
          Process
        </button>

        <div className="output-section">
          <h2>Output (Automatically Copied to Clipboard):</h2>
          <textarea
            className="output-textarea"
            value={outputRegex}
            readOnly
            rows="5"
          ></textarea>
          {copyStatus && <p className="copy-status">{copyStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default App;